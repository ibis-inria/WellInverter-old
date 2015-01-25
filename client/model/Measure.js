///<reference path="../model/Well.ts" />
///<reference path="../model/Curve.ts" />
var Measure = (function () {
    /**
     * Constructor
     *
     * @param well Well associated with me
     */
    function Measure(well) {
        /**
         * Time points
         */
        this.time = [];
        /**
         * Measured signal
         */
        this.originalSignal = [];
        /**
         * Is data[i] an outlier ? 0 | 1
         */
        this.outlier = [];
        /**
         * Markers drawn by user to guide outliers filtering. Each element is a point, i.e. a 2-elements array: [x,y]
         */
        this.trueCurveMarks = [];
        /**
         * Parameter used for smoothing the measure
         */
        this.smoothingParameter = 0.0;
        // COMPUTED DATA
        /**
         * Original signal
         */
        this.originalCurve = null;
        /**
         * Signal after outlier removal
         */
        this.outlierFreeCurve = null;
        /**
         * Synchronized curve wrt background
         */
        this.synchronizedCurve = null;
        /**
         * Subtracted background (i.e. corrected signal - original signal)
         */
        this.subtractedBackgroundCurve = null;
        /**
         * growth rate
         */
        this.growthRateCurve = null;
        /**
         * Promoter activity
         */
        this.promoterActivityCurve = null;
        /**
         * Reporter concentration
         */
        this.reporterConcentrationCurve = null;
        this.well = well;
    }
    /**
     * Returns subtype name
     */
    Measure.prototype.subTypeName = function () {
        return wic.wr.measureSubTypes[this.subType].name;
    };
    /**
     * Returns type name
     */
    Measure.prototype.typeName = function () {
        switch (this.type) {
            case 0:
                return "Abs";
            case 1:
                return "RFU";
            case 2:
                return "RLU";
            default:
                throw new Error("Invalid type");
        }
    };
    /**
     * Returns value of parameter paramName (defined in ExperimentParameterController.ts) for this measure
     */
    Measure.prototype.parameterValue = function (paramName) {
        var param = this.subTypeName() + "_" + paramName;
        return wic.experimentParametersController.getParameterValue(param);
    };
    /**
     * Reset computed data.
     * Called each time outlier detection or background detection is performed because data previously computed are then invalidated
     */
    Measure.prototype.resetComputedData = function () {
        this.originalCurve = null;
        this.outlierFreeCurve = null;
        this.synchronizedCurve = null;
        this.subtractedBackgroundCurve = null;
        this.growthRateCurve = null;
        this.promoterActivityCurve = null;
        this.reporterConcentrationCurve = null;
    };
    /**
     * Original signal
     */
    Measure.prototype.getOriginalCurve = function () {
        if (this.originalCurve == null) {
            this.originalCurve = new Curve(this.time, this.originalSignal);
        }
        return this.originalCurve;
    };
    /**
     * Compute signal in which Outliers are eliminated.
     */
    Measure.prototype.getOutlierFreeCurve = function () {
        if (this.time.length > 0) {
            var outlierFreeTime = [];
            var outlierFreevalue = [];
            for (var i = 0; i < this.time.length; i++) {
                if (this.outlier[i] != 1) {
                    outlierFreeTime.push(this.time[i]);
                    outlierFreevalue.push(this.originalSignal[i]);
                }
            }
            this.outlierFreeCurve = new Curve(outlierFreeTime, outlierFreevalue);
        }
        return this.outlierFreeCurve;
    };
    /**
     * Synchronize c2 on c1 (c1 is reference)
     * @param c1 Curve
     * @param c2 Curve
     */
    Measure.prototype.getTimeShift = function (c1, c2) {
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
            async: false,
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: { 'json': JSON.stringify(jsonParams) },
            success: function (result) {
                timeShift = +(result['time_shift']); // convert to number
                console.log('Wellfare: time_shift: ' + timeShift);
            },
            error: function () {
                alert("Cannot get synchronize time shift from Wellfare");
            }
        });
        return timeShift;
    };
    Measure.prototype.shiftTime = function (curve, timeShift) {
        var shiftedTime = curve.time.map(function (val) {
            return val + timeShift;
        });
        return new Curve(shiftedTime, curve.value);
    };
    /**
     * Compute (if not already done) and return synchronized curve wrt background.
     */
    // TODO rewrite this as a Promise: http://www.mattgreer.org/articles/promises-in-wicked-detail/
    Measure.prototype.getSynchronizedCurve = function () {
        var outlierFreeCurve = this.getOutlierFreeCurve();
        if (this.synchronizedCurve == null) {
            var backgroundWell = this.well.getBackgroundWell(this.subType);
            if (backgroundWell == null || this.type != Measure.RFU_TYPE)
                return outlierFreeCurve;
            else {
                var bgOutlierFreeCurve = backgroundWell.getMeasure(this.subType).getOutlierFreeCurve();
                var timeShift = this.getTimeShift(bgOutlierFreeCurve, outlierFreeCurve);
                this.synchronizedCurve = this.shiftTime(outlierFreeCurve, timeShift);
                console.log("Wellfare: synchronized curve: ", this.synchronizedCurve);
            }
        }
        return this.synchronizedCurve;
    };
    /**
     * Compute (if not already done) and return subtracted background - (Corrected data).
     */
    Measure.prototype.getSubtractedBackgroundCurve = function () {
        var outlierFreeCurve = this.getOutlierFreeCurve();
        if (this.subtractedBackgroundCurve == null) {
            var backgroundWell = this.well.getBackgroundWell(this.subType);
            var bgOutlierFreeCurve = null;
            var shiftedCurve = null;
            if (backgroundWell == null) {
                var defaultBackground = (!this.isBackground ? this.parameterValue("background_value") : 0);
                var times = outlierFreeCurve.time.slice(); // copy
                var values = outlierFreeCurve.time.map(function () {
                    return defaultBackground;
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
    };
    /**
     * Compute (if not already done) and return growth rate.
     */
    Measure.prototype.getGrowthRateCurve = function () {
        if (this.growthRateCurve == null && this.type == Measure.ABS_TYPE) {
            var subtractedBackgroundCurve = this.getSubtractedBackgroundCurve();
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
                    data: { 'json': JSON.stringify(jsonParams) },
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
    };
    /**
     * Compute (if not already done) and return reporter concentration.
     */
    Measure.prototype.getReporterConcentrationCurve = function () {
        if (this.reporterConcentrationCurve == null && this.type == Measure.RFU_TYPE) {
            var subtractedBackgroundCurve = this.getSubtractedBackgroundCurve();
            var fluoMeasure = this.well.getMeasure(Measure.RFU_TYPE);
            if (fluoMeasure != null) {
                var fluoSubtractedBackgroundCurve = fluoMeasure.getSubtractedBackgroundCurve();
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
                    data: { 'json': JSON.stringify(jsonParams) },
                    success: function (result) {
                        that.reporterConcentrationCurve = new Curve(result['times_concentration'], result['values_concentration']);
                        console.log("Wellfare: concentration", result);
                    },
                    error: function () {
                        alert("Cannot get concentration data from Wellfare");
                    }
                });
                $("body").removeClass("loading");
            }
        }
        return this.reporterConcentrationCurve;
    };
    /**
     * Compute (if not already done) and return reporter concentration.
     */
    Measure.prototype.getPromoterActivityCurve = function () {
        if (this.promoterActivityCurve == null && this.type == Measure.RFU_TYPE) {
            var subtractedBackgroundCurve = this.getSubtractedBackgroundCurve();
            var fluoMeasure = this.well.getMeasure(Measure.RFU_TYPE);
            if (fluoMeasure != null) {
                var fluoSubtractedBackgroundCurve = fluoMeasure.getSubtractedBackgroundCurve();
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
                    data: { 'json': JSON.stringify(jsonParams) },
                    success: function (result) {
                        that.promoterActivityCurve = new Curve(result['times_activity'], result['values_activity']);
                        console.log("Wellfare: activity", result);
                    },
                    error: function () {
                        alert("Cannot get promoter activity data from Wellfare");
                    }
                });
                $("body").removeClass("loading");
            }
        }
        return this.promoterActivityCurve;
    };
    /**
     * Measure types
     */
    Measure.ABS_TYPE = 0;
    Measure.RFU_TYPE = 1;
    Measure.RLU_TYPE = 2;
    return Measure;
})();
//# sourceMappingURL=Measure.js.map