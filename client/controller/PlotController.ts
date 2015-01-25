///<reference path="../highcharts.d.ts" />
///<reference path="WellInverterController.ts" />
///<reference path="PlotSelector.ts" />
///<reference path="../model/Sample.ts" />

declare var $: JQueryStatic;

/**
 * Class for handling Highcharts plots. Associated view is plot.html
 */
class PlotController {

    /**
     * Y-axis scale type (scaleType[0]: left-most y-axis, scaleType[1]: right-most y-axis): "linear" | "logarithmic"
     */
    scaleType = ["linear", "linear"];

    /**
     * Colors used for plots
     */
    colors = ['#0099FF', '#00CC66', '#CC9933', '#CC3300', '#006600', '#000099',
   '#990066', '#CC6633', '#0066FF', '#009966', '#FF0000', '#999933', '#6600FF'];

    /**
     * Hash table used for remembering color of each well in plots. Keys are well names
     */
    colorHash: string[] = [];

    /**
     * Array of colors that are already used in plots
     */
    usedColors: number[] = [];

    /**
     * Currently selected color in color controller GUI: either an element in 'colors' or 'auto'
     * - 'auto': next curve is drawn using next unused color if possible, or cycle inside colors list if not possible
     * - color: next curve is drawn using this color
     */
    currentColor = 'auto';

    /**
     * Point markers shapes used for plotting
     */
    markerSymbols = ["circle", "diamond", "triangle", "square", "triangle-down"];

    /**
     * WellInverterController associated with me
     */
    public wic: WellInverterController;

    /**
     * Constructor
     */
    constructor(wic: WellInverterController) {
        this.wic = wic;
    }

    /**
     * Update plots when an element of the plot selector has changed
     */
    updatePlots(): void {
        var plotsCount = 0;
        var selectedWells  = this.wic.plotSelector.selectedWells();
        this.updateColors(selectedWells);

        // Computation of the different y-axis

        var yAxis: Object[] = [];         // yAxis object
        var yAxisNames: string[] = [];    // yAxis name
        var yAxisRefs: number[] = [];     // reference to yAxis used for each series
        for (var p = 1; p <= this.wic.plotSelector.plotsCount; p++) {
            var measureSubTypeText = $('#measure-' + p + " option:selected").text();
            var plotTypeText = $("#plot-type-" + p + " option:selected").text();

            var title = "";
            if ( plotTypeText == "Protein concentration" || plotTypeText == "Promoter activity" ) {
                var yAxisName = measureSubTypeText + "/" + plotTypeText;
                if ( yAxisNames.indexOf(yAxisName) == -1 ) {
                    title = yAxisName;
                    yAxisNames.push(yAxisName);
                    yAxisRefs.push(yAxis.length);
                }
                else yAxisRefs.push(yAxisNames.indexOf(yAxisName));
            }
            else {
                if ( yAxisNames.indexOf(measureSubTypeText) == -1 ) {
                    title = measureSubTypeText;
                    yAxisNames.push(measureSubTypeText);
                    yAxisRefs.push(yAxis.length);
                }
                else yAxisRefs.push(yAxisNames.indexOf(measureSubTypeText));
            }

            if ( title != "" ) {
                if ( yAxis.length == 0 )
                    yAxis.push({title: {text: title}, type: this.scaleType[0], labels: {formatter: function(){return this.value}}});
                else yAxis.push({title: {text: title}, type: this.scaleType[1], opposite: true, labels: {formatter: function(){return this.value}}});
            }
            //yAxis.labels = {formatter: function(){return "x"}}};
        }

        if ( selectedWells.length > 0 ) {
            var options = {
                chart: { renderTo: 'plot', zoomType: 'x', height: 650 },
                credits: { enabled: false },
                legend: { enabled: true },
                xAxis: { title: { text: "Time (min)" },
                    labels: {
                        formatter: function () {
                            return Highcharts.numberFormat(this.value, 0, '', ''); // Remove thousands separator
                        }
                    }
                },
                yAxis: yAxis,
                tooltip: { enabled: true },
                plotOptions: {
                    series: {
                        animation:false,
                        allowPointSelect: true,
                        lineWidth: 0,
                        marker: { symbol: 'circle', radius: 3}
                    }
                },
                scrollbar: { enabled: true },
                title: { text: "Plots" },
                series: []
            };

            // for each selected well, create for each (measure subtype, plot type) a plot except if indicator only is checked

            var values = [];
            var wellNames = "";
            for(var w = 0; w < selectedWells.length; w++) {
                var well: Well = selectedWells[w];
                wellNames += well.getName() + " ";

                for (var p = 1; p <= this.wic.plotSelector.plotsCount; p++) {
                    var plotType = $('#plot-type-' + p).val();
                    var measureSubType = $('#measure-' + p).val();
                    var plotTypeText = $("#plot-type-" + p +" option:selected").text();
                    //var selectedIndicator = $('#indicator-' + p).val();
                    var plotIndicatorOnly = $('#indicator-only-' + p).is(':checked');

                    if ( plotType != null && measureSubType != "" ) {
                        var measure = well.getMeasure(measureSubType);
                        var curve = this.getCurve(measure, plotType);
                        if ( curve != null ) {
                            var chartData = [];
                            var value = [];
                            for(var i = 0; i < curve.size(); i++) {
                                chartData.push([curve.time[i], curve.value[i]]);
                                value.push(curve.value[i]);
                            }
                            values.push(value);
                            if ( ! plotIndicatorOnly ) {
                                options.series.push({
                                    data: chartData,
                                    color: this.getPlotColor(measure),
                                    name: well.getName() + ": " + wic.wr.measureSubTypes[measureSubType].name + " / " + plotTypeText,
                                    yAxis: yAxisRefs[p-1],
                                    marker: {symbol: this.getMarkerSymbol(measure), radius: 3}});
                                plotsCount++;
                            }
                        }
                    }
                }
            }

            // create indicator curves

            var colors = ['000000', '333333', '666666'];
            for (var p = 1; p <= this.wic.plotSelector.plotsCount; p++) {

                var showMean = $('#show-mean-' + p).is(':checked');
                var showStdError = $('#show-std-error-' + p).is(':checked');
                var plotType = $('#plot-type-' + p).val();
                if ( plotType != "" && measureSubType != "" && showMean ) {
                    var measureSubType = $('#measure-' + p).val();
                    var plotTypeText = $("#plot-type-" + p + " option:selected").text();
                    var selectedIndicator = $('#indicator-' + p).val();

                    var measure0 = selectedWells[0].getMeasure(measureSubType);
                    var refCurve = this.getCurve(measure0, plotType);
                    var curves = [refCurve];
                    for (var w = 1; w < selectedWells.length; w++) {
                        var measure = selectedWells[w].getMeasure(measureSubType);
                        var curve = this.getCurve(measure, plotType);
                        if (curve != null) {
                            curves.push(curve.interpolate(refCurve));
                        }
                    }

                    var meanCurve = Curve.mean(curves);
                    var meanChartData = [];
                    for (var i = 0; i < meanCurve.size(); i++) {
                        meanChartData.push([meanCurve.time[i], meanCurve.value[i]]);
                    }
                    options.series.push({
                        data: meanChartData,
                        color: colors[p - 1],
                        lineWidth: 2, // TODO doesn't work
                        marker: {radius: 3},
                        name: "Mean over " + wellNames
                    });
                    plotsCount++;

                    if ( showStdError ) {
                        var stdErrorCurve = Curve.stdErrorOfMean(curves);


                        var stdErrorChartData = [];
                        for (var i = 0; i < meanCurve.size(); i++) {
                            stdErrorChartData.push([meanCurve.time[i], meanCurve.value[i] - 2 * stdErrorCurve.value[i], meanCurve.value[i] + 2 * stdErrorCurve.value[i]]);
                        }
                        options.series.push({
                            data: stdErrorChartData,
                            type: 'arearange',
                            marker: {enabled: false},
                            fillOpacity: 0.5,
                            lineWidth: 0,
                            color: '#ddd',
                            name: "Mean +/- 2 x std.error over " + wellNames
                        });
                        plotsCount++;
                    }
                }
            }
        }

        if ( plotsCount > 0 ) {
            new Highcharts.Chart(options);
            $('#axis-button-0').show();
            $('#axis-button-0').val(this.scaleType[0]);
            if ( yAxis.length > 1 ) {
                $('#axis-button-1').show();
                $('#axis-button-1').val(this.scaleType[1]);
            }
            else {
                $('#axis-button-1').hide();
            }
        }
        else {
            $('#plot').html("");
            $('#axis-button-0').hide();
            $('#axis-button-1').hide();
        }
    }

    /**
     * Returns curve of given measure and plot type
     */
    getCurve(measure: Measure, plotType: string): Curve {
        switch ( plotType ) {
            case "originalSignal": return measure.getOriginalCurve();
            case "outlierFreeSignal": return measure.getOutlierFreeCurve();
            case "subtractedBackground": return measure.getSubtractedBackgroundCurve();
            case "synchronized": return measure.getSynchronizedCurve();
            case "growthRate": return measure.getGrowthRateCurve();
            case "reporterConcentration": return measure.getReporterConcentrationCurve();
            case "promoterActivity": return measure.getPromoterActivityCurve();
            case "": return new Curve([], []);
            default: throw new Error("Undefined plotType:" + plotType)
        }
    }

    /**
     * Return plot width
     */
    getPlotLineWidth(plotType: string): number {
        return ( plotType == "originalSignal" ? 0 : 1 );
    }

    /**
     * Refresh colorHash: remove colors for wells that are no longer selected
     */
    updateColors(selectedWells: Well[]): void {
        for (var wellName in this.colorHash) {
            if ( this.colorHash.hasOwnProperty(wellName) && selectedWells.indexOf(wic.wr.wellFromName(wellName)) == -1 ) {
                console.log('delete ' + wellName);
                delete this.colorHash[wellName];
            }
        }
    }

    /**
     * Return a color for measure
     */
    getPlotColor(measure: Measure): string {
        var wellName = measure.well.getName();
        if ( this.colorHash[wellName] != null ) {
            return this.colors[this.colorHash[wellName]];
        }
        else if ( this.currentColor != 'auto' ) {
            this.colorHash[wellName] = this.currentColor;
            return this.colors[this.currentColor];
        }
        else {
            for (var c = 0; c < this.colors.length; c++) {
                if (this.usedColors.indexOf(c) == -1) {
                    this.usedColors.push(c);
                    this.colorHash[wellName] = c;
                    return this.colors[c];
                }
            }

            // colors all used, let's start again
            this.usedColors = [];
            this.colorHash[wellName] = this.colors[0];
            return this.colors[this.colors[0]];
        }
    }

    /**
     * Return plot marker symbol, in function of measure type
     */
    getMarkerSymbol(measure: Measure): string {
        return this.markerSymbols[measure.subType];
    }

    /**
     * Switch between "linear" and "logarithmic" scale type for Y-axis number. 0 -> left-hand side Y-axis, 1: right-hand side Y-axis
     */
    changeAxisScale(i: number): void {
        var chart = $('#plot').highcharts();
        if ( this.scaleType[i] == "linear" ) {
            this.scaleType[i] = "logarithmic";
            chart.yAxis[i].update({ type: "logarithmic", tickInterval: 1});
        }
        else {
            this.scaleType[i] = "linear";
            chart.yAxis[i].update({ type: "linear", tickInterval: null});
        }
    }

    /**
     * Display plots in Plots tab
     */
    showView(): void {
        this.wic.tabController.showTab(TabController.PLOTS_TAB);
        this.wic.plotSelector.setMode(PlotSelector.PLOT_DISPLAY_MODE);
        this.wic.plotSelector.setMeasureType(Measure.ABS_TYPE);
        this.usedColors = [];
        this.colorHash = [];
        var that = this;
        $("#plot").livequery(function() {    // livequery() waits for view complete loading
            that.updatePlots();
        });
    }
}