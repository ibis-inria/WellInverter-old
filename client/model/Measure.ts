///<reference path="../model/Well.ts" />
///<reference path="../model/Curve.ts" />

class Measure {

    /**
     * Measure types
     */
    static ABS_TYPE = 0;
    static RFU_TYPE = 1;
    static RLU_TYPE = 2;

    /**
     * Well associated with me
     */
    well: Well;

    /**
     * 0: abs, 1: RFU, 2: RLU
     */
    type: number;

    /**
     * 0 to #sub-types - 1
     */
    subType: number;

    /**
     * 0 | 1
     */
    isBackground: number;

    /**
     * index of reference Well
     */
    backgroundReferenceWell: number;

    /**
     * Time points
     */
    time: number[] = [];

    /**
     * Measured signal
     */
    originalSignal: number[] = [];

    /**
     * Is data[i] an outlier ? 0 | 1
     */
    outlier: number[] = [];

    /**
     * Markers drawn by user to guide outliers filtering. Each element is a point, i.e. a 2-elements array: [x,y]
     */
    trueCurveMarks: number[][] = [];

    /**
     * Parameter used for smoothing the measure
     */
    smoothingParameter: number = 0.0;

    /**
     * Parameter used for filtering outliers
     */
    outliersFilteringParameter: number;

// COMPUTED DATA

    /**
     * Original signal
     */
    originalCurve: Curve = null;

    /**
     * Signal after outlier removal
     */
    outlierFreeCurve: Curve = null;

    /**
     * Synchronized curve wrt background
     */
    synchronizedCurve: Curve = null;

    /**
     * Subtracted background (i.e. corrected signal - original signal)
     */
    subtractedBackgroundCurve: Curve = null;

    /**
     * growth rate
     */
    growthRateCurve: Curve = null;

    /**
     * Promoter activity
     */
    promoterActivityCurve: Curve = null;

    /**
     * Reporter concentration
     */
    reporterConcentrationCurve: Curve = null;

    /**
     * Constructor
     *
     * @param well Well associated with me
     */
    constructor(well: Well) {
        this.well = well;
    }

    /**
     * Returns subtype name
     */
    subTypeName(): string {
        return wic.wr.measureSubTypes[this.subType].name;
    }

    /**
     * Returns type name
     */
    typeName(): string {
        switch (this.type) {
            case 0: return "Abs";
            case 1: return "RFU";
            case 2: return "RLU";
            default: throw new Error("Invalid type");
        }
    }

    /**
     * Returns value of parameter paramName (defined in ExperimentParameterController.ts) for this measure
     */
    parameterValue(paramName): number {
        var param: String = this.subTypeName() + "_" + paramName;
        return wic.experimentParametersController.getParameterValue(param);
    }

    /**
     * Reset computed data.
     * Called each time outlier detection or background detection is performed because data previously computed are then invalidated
     */
    resetComputedData() {
        this.originalCurve = null;
        this.outlierFreeCurve = null;
        this.synchronizedCurve = null;
        this.subtractedBackgroundCurve = null;
        this.growthRateCurve = null;
        this.promoterActivityCurve = null;
        this.reporterConcentrationCurve = null;
    }

    /**
     * Original signal
     */
    getOriginalCurve(): Curve {
        if ( this.originalCurve == null ) {
            this.originalCurve = new Curve(this.time, this.originalSignal);
        }
        return this.originalCurve
    }

    /**
     * Compute signal in which Outliers are eliminated.
     */
    getOutlierFreeCurve(): Curve {
        if ( this.time.length > 0 ) {
            var outlierFreeTime = [];
            var outlierFreevalue = [];
            for (var i = 0; i < this.time.length; i++) {
                if ( this.outlier[i] != 1 ) {
                    outlierFreeTime.push(this.time[i]);
                    outlierFreevalue.push(this.originalSignal[i]);
                }
            }
            this.outlierFreeCurve = new Curve(outlierFreeTime, outlierFreevalue);
        }
        return this.outlierFreeCurve;
    }

    /**
     * Synchronize c2 on c1 (c1 is reference)
     * @param c1 Curve
     * @param c2 Curve
     */
    getTimeShift(c1: Curve, c2: Curve): number {
        var jsonParams = {
            'times_curve_1': c1.time,
            'values_curve_1': c1.value,
            'times_curve_2': c2.time,
            'values_curve_2': c2.value,
            'max_shift': wic.experimentParametersController.getParameterValue('max_shift')
        };

        // run wellfare/synchronize

        var timeShift = 0;
        $.ajax({
            url: "http://" + window.location.host + ":" + wic.config.wellfarePort + "/wellfare/synchronize",
            async: false,   // because needs to be chained with other wellfare methods
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: {'json': JSON.stringify(jsonParams)},
            success: function (result) {
                timeShift = +(result['time_shift']);    // convert to number
                console.log('Wellfare: time_shift: ' + timeShift);
            },
            error: function(){
                alert("Cannot get synchronize time shift from Wellfare");
            }
        });

        return timeShift;
    }

    shiftTime(curve: Curve, timeShift: number): Curve {
        var shiftedTime: number[] = curve.time.map(function(val){return val + timeShift});
        return new Curve(shiftedTime, curve.value);
    }

    /**
     * Compute (if not already done) and return synchronized curve wrt background.
     */
    // TODO rewrite this as a Promise: http://www.mattgreer.org/articles/promises-in-wicked-detail/
    getSynchronizedCurve(): Curve {
        var outlierFreeCurve: Curve = this.getOutlierFreeCurve();
        if ( this.synchronizedCurve == null ) {
            var backgroundWell: Well = this.well.getBackgroundWell(this.subType);
            if ( backgroundWell == null || this.type != Measure.RFU_TYPE )
                return outlierFreeCurve;
            else {
                var bgOutlierFreeCurve: Curve = backgroundWell.getMeasure(this.subType).getOutlierFreeCurve();
                var timeShift: number = this.getTimeShift(bgOutlierFreeCurve, outlierFreeCurve);
                this.synchronizedCurve = this.shiftTime(outlierFreeCurve, timeShift);
                console.log("Wellfare: synchronized curve: ", this.synchronizedCurve);
            }
        }

        return this.synchronizedCurve;
    }

    /**
     * Compute (if not already done) and return subtracted background - (Corrected data).
     */
    getSubtractedBackgroundCurve(): Curve {
        var outlierFreeCurve: Curve = this.getOutlierFreeCurve();
        if ( this.subtractedBackgroundCurve == null ) {
            var backgroundWell:Well = this.well.getBackgroundWell(this.subType);
            var bgOutlierFreeCurve:Curve = null;
            var shiftedCurve:Curve = null;

            if (backgroundWell == null) {
                var defaultBackground:number = ( !this.isBackground ? this.parameterValue("background_value") : 0 );
                var times:number[] = outlierFreeCurve.time.slice(); // copy
                var values:number[] = outlierFreeCurve.time.map(function () {
                    return defaultBackground
                });
                bgOutlierFreeCurve = new Curve(times, values);
                shiftedCurve = outlierFreeCurve;
            }
            else {
                bgOutlierFreeCurve = backgroundWell.getMeasure(this.subType).getOutlierFreeCurve();
                shiftedCurve = this.getSynchronizedCurve();
            }

            this.subtractedBackgroundCurve = shiftedCurve.subtract(bgOutlierFreeCurve);
        }

        return this.subtractedBackgroundCurve;
    }

    /**
     * Compute (if not already done) and return growth rate.
     */
    getGrowthRateCurve(): Curve {
        if ( this.growthRateCurve == null && this.type == Measure.ABS_TYPE ) {
            var subtractedBackgroundCurve:Curve = this.getSubtractedBackgroundCurve();

            if (subtractedBackgroundCurve.time.length > 1000) {
                alert("Cannot compute growth rate for a curve with more than 1000 points - currently: " + subtractedBackgroundCurve.time.length);
                this.growthRateCurve = new Curve([], []);
            }
            else {
                var jsonParams = {
                    'times_volume': subtractedBackgroundCurve.time,
                    'values_volume': subtractedBackgroundCurve.value
                };

                // run wellfare/growth

                var that = this;
                $.ajax({
                    url: "http://" + window.location.host + ":" + wic.config.wellfarePort + "/wellfare/growth",
                    type: 'POST',
                    dataType: 'json',
                    async: false,
                    contentType: 'application/json',
                    data: {'json': JSON.stringify(jsonParams)},
                    success: function (result) {
                        that.growthRateCurve = new Curve(result['times_growth_rate'], result['values_growth_rate']);
                        console.log("Wellfare: growth: ", result);
                    },
                    error: function () {
                        alert("Cannot get growth rate values from Wellfare");
                    }
                });
            }
        }
        return this.growthRateCurve;
    }

    /**
     * Compute (if not already done) and return reporter concentration.
     */
    getReporterConcentrationCurve(): Curve {
        if ( this.reporterConcentrationCurve == null && this.type == Measure.RFU_TYPE ) {

            var subtractedBackgroundCurve: Curve = this.getSubtractedBackgroundCurve();
            var fluoMeasure = this.well.getMeasure(Measure.RFU_TYPE);
            if ( fluoMeasure != null ) {
                var fluoSubtractedBackgroundCurve: Curve = fluoMeasure.getSubtractedBackgroundCurve();
                var jsonParams = {
                    'times_volume': subtractedBackgroundCurve.time,
                    'values_volume': subtractedBackgroundCurve.value,
                    'times_fluo': fluoSubtractedBackgroundCurve.time,
                    'values_fluo': fluoSubtractedBackgroundCurve.value,
                    'dR': 0.01,
                    'dP': 0.01
                };

                // run wellfare/concentration

                var that = this;
                $("body").addClass("loading");
                $.ajax({
                    url: "http://" + window.location.host + ":" + wic.config.wellfarePort + "/wellfare/concentration",
                    type: 'POST',
                    dataType: 'json',
                    async: false,
                    contentType: 'application/json',
                    data: {'json': JSON.stringify(jsonParams)},
                    success: function (result) {
                        that.reporterConcentrationCurve = new Curve(result['times_concentration'], result['values_concentration']);
                        console.log("Wellfare: concentration", result);
                    },
                    error: function(){
                        alert("Cannot get concentration data from Wellfare");
                    }
                });
                $("body").removeClass("loading");
            }
        }
        return this.reporterConcentrationCurve;
    }

    /**
     * Compute (if not already done) and return reporter concentration.
     */
     getPromoterActivityCurve():Curve {
        if ( this.promoterActivityCurve == null  && this.type == Measure.RFU_TYPE ) {

            var subtractedBackgroundCurve: Curve = this.getSubtractedBackgroundCurve();
            var fluoMeasure = this.well.getMeasure(Measure.RFU_TYPE);
            if ( fluoMeasure != null ) {
                var fluoSubtractedBackgroundCurve: Curve = fluoMeasure.getSubtractedBackgroundCurve();
                var jsonParams = {
                    'times_volume': subtractedBackgroundCurve.time,
                    'values_volume': subtractedBackgroundCurve.value,
                    'times_fluo': fluoSubtractedBackgroundCurve.time,
                    'values_fluo': fluoSubtractedBackgroundCurve.value,
                    'dR': 0.007
                };

                // run wellfare/activity

                var that = this;
                $("body").addClass("loading");
                $.ajax({
                    url: "http://" + window.location.host + ":" + wic.config.wellfarePort + "/wellfare/activity",
                    type: 'POST',
                    dataType: 'json',
                    async: false,
                    contentType: 'application/json',
                    data: {'json': JSON.stringify(jsonParams)},
                    success: function (result) {
                        that.promoterActivityCurve = new Curve(result['times_activity'], result['values_activity']);
                        console.log("Wellfare: activity", result);
                    },
                    error: function(){
                        alert("Cannot get promoter activity data from Wellfare");
                    }
                });
                $("body").removeClass("loading");
            }
        }
        return this.promoterActivityCurve;
    }
}