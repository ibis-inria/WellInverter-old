///<reference path="../highcharts.d.ts" />
///<reference path="WellInverterController.ts" />
///<reference path="PlotSelector.ts" />
///<reference path="../file-saver.d.ts" />
// Global variables used to patch Highcharts behavior: if mouseup click point <> mousedown click point,
// it is not a "true" click" but rather a D&D.
// See end of updatePlots() method
var mouseX, mouseY, trueClick;
/**
 * Class for handling outliers detection. Associated view is outlier-detection.html
 */
var OutlierDetectionController = (function () {
    /**
     * Constructor
     * @param wic WellInverterController associated with me
     */
    function OutlierDetectionController(wic) {
        this.wic = wic;
    }
    /**
     * Update plot showing outliers
     */
    OutlierDetectionController.prototype.updatePlots = function () {
        var selectedWell = this.wic.plotSelector.selectedWell;
        this.measureSubType = this.wic.plotSelector.measureSubType;
        this.well = selectedWell;
        if (selectedWell != null && selectedWell.hasMeasure(this.measureSubType)) {
            var measure = selectedWell.getMeasure(this.measureSubType);
            var hideOutliers = $('#hide-outliers-checkbox').is(':checked');
            var outliersGuide = $('#outliers-guide-checkbox').is(':checked');
            // set up filtering tolerance parameter and number spinner step
            // step is defined as followed:
            // - for a number without '.', step is given by the 10-power on the last non-zero digit
            //   e.g.: 153 -> 1, 150 -> 10, 300 -> 100
            // - for a number containing a '.', step is given as 10^-n, when n is the number of digits after '.'
            //   10.2 -> 0.1, 23.00 -> 0.01, 5.34 -> 0.01
            var tol = measure.outliersFilteringParameter;
            var tolString = "" + tol;
            $("#filter").val(tolString);
            var step;
            var dotPos = tolString.indexOf(".");
            if (dotPos == -1) {
                var pow = 10;
                while (tol - pow * Math.floor(tol / pow) == 0) {
                    pow *= 10;
                }
                step = pow / 10;
            }
            else {
                step = Math.pow(10, -(tolString.substr(dotPos + 1).length));
            }
            $("#filter").attr("step", step);
            // Compute chart data and axis data scale
            var chartData = [];
            var chartOutlierData = [];
            var maxValue = -1e10;
            for (var i = 0; i < measure.time.length; i++) {
                if (measure.outlier[i] != 1) {
                    chartData.push([measure.time[i], measure.originalSignal[i]]);
                    if (measure.originalSignal[i] > maxValue)
                        maxValue = measure.originalSignal[i];
                }
                else if (!hideOutliers) {
                    chartOutlierData.push([measure.time[i], measure.originalSignal[i]]);
                    if (measure.originalSignal[i] > maxValue)
                        maxValue = measure.originalSignal[i];
                }
            }
            // prepare highcharts options
            var odc = this;
            var options = {
                chart: {
                    renderTo: 'outlier-detection',
                    /*zoomType: 'x',*/
                    events: {
                        click: function (e) {
                            if (outliersGuide && trueClick) {
                                console.log('add point to true curve');
                                // find the clicked values and the series
                                var x = e.xAxis[0].value;
                                var y = e.yAxis[0].value;
                                this.series[1].addPoint([x, y]);
                                odc.refreshTrueCurve(measure);
                            }
                        }
                    }
                },
                credits: { enabled: false },
                legend: { enabled: false },
                xAxis: { title: { text: "Time (min)" }, labels: {
                    formatter: function () {
                        return Highcharts.numberFormat(this.value, 0, '', ''); // Remove thousands separator
                    }
                } },
                yAxis: { min: 0, max: maxValue, title: { text: wic.wr.measureSubTypes[this.measureSubType].name }, labels: { formatter: function () {
                    return this.value;
                } } },
                tooltip: { enabled: false },
                plotOptions: {
                    series: {
                        animation: false,
                        allowPointSelect: true,
                        lineWidth: 0,
                        point: {
                            events: {
                                click: function (event) {
                                    if (outliersGuide) {
                                        console.log('remove point from true curve');
                                        this.remove();
                                        odc.refreshTrueCurve(measure);
                                    }
                                    else {
                                        console.log('remove outlier');
                                        //console.log(this.series[0].marker.fillcolor);
                                        this.setState("select");
                                        this.update({
                                            marker: {
                                                fillColor: '#E0E8F0',
                                                lineColor: '#E0E8F0'
                                            }
                                        });
                                        odc.removePoint(measure, event.point);
                                        event.preventDefault();
                                        measure.resetComputedData();
                                    }
                                }
                            }
                        }
                    }
                },
                scrollbar: { enabled: true },
                title: { text: this.well.getName() + " / " + wic.wr.measureSubTypes[this.measureSubType].name },
                series: [
                    { data: chartData, allowPointSelect: !outliersGuide, enableMouseTracking: !outliersGuide, lineWidth: 0, zIndex: 1 },
                    { data: measure.trueCurveMarks.slice(), lineWidth: 4, marker: { radius: 8 }, draggableX: true, draggableY: true, allowPointSelect: true, zIndex: 2 },
                    { data: chartOutlierData, allowPointSelect: false, enableMouseTracking: false, lineWidth: 0, color: '#E0E8F0', marker: { symbol: "circle" }, zIndex: 0 }
                ]
            };
            // draw plots using Highcharts
            // displayed plots depend on 'hide-outliers-checkbox' and 'outliers-guide-checkbox'
            var chart = new Highcharts.Chart(options);
            if (hideOutliers)
                chart.series[2].hide();
            else
                chart.series[2].show();
            if (outliersGuide)
                chart.series[1].show();
            else
                chart.series[1].hide();
            // patch Highcharts behavior: if mouseup click point <> mousedown click point, it is not a "true" click" but rather a D&D
            $('#outlier-detection').mousedown(function (e) {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });
            $('#outlier-detection').mouseup(function (e) {
                trueClick = (mouseX == e.clientX && mouseY == e.clientY);
            });
            // Export context menu
            var that = this;
            OutlierDetectionController.addChartContextMenu('Export outliers-free data', function () {
                that.exportOutliersFreeData(measure);
            });
            $('#hide-outliers-form').show();
            $('#outlier-detection-form').show();
        }
        else {
            $('#outlier-detection').html("");
            $('#outlier-detection-form').hide();
            $('#hide-outliers-form').hide();
        }
    };
    /**
     * Refresh true curves points from curve marks given by user
     */
    OutlierDetectionController.prototype.refreshTrueCurve = function (measure) {
        measure.trueCurveMarks = [];
        var curveMarks = $('#outlier-detection').highcharts().series[1].data;
        for (var m = 0; m < curveMarks.length; m++) {
            measure.trueCurveMarks.push([curveMarks[m].x, curveMarks[m].y]);
        }
    };
    OutlierDetectionController.addChartContextMenu = function (optionText, callback) {
        var chartContextMenuOptions = Highcharts.getOptions().exporting.buttons.contextButton.menuItems;
        for (var i = 0; i < chartContextMenuOptions.length; i++) {
            if (chartContextMenuOptions[i].text == optionText) {
                Highcharts.getOptions().exporting.buttons.contextButton.menuItems.splice(i, 1);
                break;
            }
        }
        // Not found add context menu option
        Highcharts.getOptions().exporting.buttons.contextButton.menuItems.push({
            text: 'Export outliers-free data',
            onclick: callback
        });
    };
    /**
     * Remove a point from the non-outlier list
     */
    OutlierDetectionController.prototype.removePoint = function (measure, point) {
        var chart = $('#outlier-detection').highcharts();
        var index = chart.series[0].data.indexOf(point);
        var x = chart.series[0].data[index].x;
        //chart.series[0].data[index].remove();
        chart.series[0].data[index].fillColor = "#FF0000";
        for (var i = 0; i < measure.time.length; i++) {
            if (measure.time[i] == x) {
                measure.outlier[i] = 1;
                break;
            }
        }
    };
    /**
     * Handle click on "Reset outliers" button
     */
    OutlierDetectionController.prototype.resetOutliers = function () {
        var measure = this.well.getMeasure(this.measureSubType);
        this.refreshTrueCurve(measure);
        for (var i = 0; i < measure.time.length; i++) {
            measure.outlier[i] = 0;
        }
        this.wic.wr.resetComputedData();
        this.wic.experimentController.saveExperiment();
        this.updatePlots();
    };
    /**
     * Detect outliers from Wellfare algo
     */
    OutlierDetectionController.prototype.detectOutliers = function () {
        var measure = this.well.getMeasure(this.measureSubType);
        var measureSubTypePrefix = wic.wr.measureSubTypes[this.measureSubType].name;
        if (measure.time.length > 0) {
            this.refreshTrueCurve(measure);
            var validTime = [];
            var validSignal = [];
            for (var i = 0; i < measure.time.length; i++) {
                if (measure.outlier[i] != 1) {
                    validTime.push(measure.time[i]);
                    validSignal.push(measure.originalSignal[i]);
                }
            }
            var jsonParams = { 'times_curve': validTime, 'values_curve': validSignal };
            var outliersParams = ['percentile_above', 'percentile_below', 'niter_above', 'niter_below', 'goal_above', 'goal_below', 'smoothing_win', 'nstd'];
            outliersParams.forEach(function (p) {
                jsonParams[p] = wic.experimentParametersController.getParameterValue(measureSubTypePrefix + "_" + p);
            });
            // run wellfare/outliers
            $.ajax({
                url: "http://" + window.location.host + ":" + wic.config.wellfarePort + "/wellfare/outliers",
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: { 'json': JSON.stringify(jsonParams) },
                success: function (data) {
                    console.log('success');
                    for (var i = 0; i < measure.time.length; i++) {
                        var index = data.times_cleaned_curve.indexOf(measure.time[i]);
                        measure.outlier[i] = (index == -1 ? 1 : 0);
                    }
                    wic.outlierDetectionController.updatePlots();
                    wic.wr.resetComputedData();
                    wic.experimentController.saveExperiment();
                },
                error: function () {
                    alert("Cannot get data from Wellfare");
                }
            });
        }
    };
    /**
     * Filter outliers, i.e. remove points from originalSignal that lie farther than given tolerance
     * around the trueCurveMarks provided by user.
     */
    OutlierDetectionController.prototype.filterOutliers = function () {
        var measure = this.well.getMeasure(this.measureSubType);
        var measureSubTypePrefix = wic.wr.measureSubTypes[this.measureSubType].name;
        measure.outliersFilteringParameter = +($("#filter").val()); // +: forces conversion to numeric type
        if (measure.time.length > 0) {
            this.refreshTrueCurve(measure);
            if (measure.trueCurveMarks == null || measure.trueCurveMarks.length < 2)
                return;
            var mark = 1;
            for (var i = 0; i < measure.time.length; i++) {
                measure.outlier[i] = 0;
                if (measure.time[i] >= measure.trueCurveMarks[mark - 1][0]) {
                    while (measure.time[i] > measure.trueCurveMarks[mark][0]) {
                        mark++;
                        if (mark >= measure.trueCurveMarks.length) {
                            //$('#hide-outliers-checkbox').prop('checked', true);
                            wic.outlierDetectionController.updatePlots();
                            measure.resetComputedData();
                            wic.experimentController.saveExperiment();
                            return;
                        }
                    }
                    var y1 = measure.trueCurveMarks[mark - 1][1];
                    var y2 = measure.trueCurveMarks[mark][1];
                    var x1 = measure.trueCurveMarks[mark - 1][0];
                    var x2 = measure.trueCurveMarks[mark][0];
                    var value = y1 + (y2 - y1) / (x2 - x1) * (measure.time[i] - x1);
                    if (Math.abs(measure.originalSignal[i] - value) > measure.outliersFilteringParameter) {
                        measure.outlier[i] = 1;
                    }
                }
            }
        }
        measure.resetComputedData();
        wic.outlierDetectionController.updatePlots();
        wic.experimentController.saveExperiment();
    };
    /**
     * Export outliers-free curve as CSV file
     * @param measure
     */
    OutlierDetectionController.prototype.exportOutliersFreeData = function (measure) {
        var times = "time";
        var values = "value";
        for (var i = 0; i < measure.time.length; i++) {
            if (measure.outlier[i] != 1) {
                times += ";" + measure.time[i];
                values += ";" + measure.originalSignal[i];
            }
        }
        var blob = new Blob([(times + "\n" + values).replace(/\./g, ",")], { type: "text/csv;charset=utf-8" });
        saveAs(blob, measure.well.getName() + "-" + wic.wr.measureSubTypes[this.measureSubType].name + ".csv");
    };
    /**
     * Display Outlier detection tab
     */
    OutlierDetectionController.prototype.showView = function (measureSubType) {
        this.wic.tabController.showTab(TabController.OUTLIER_DETECTION_TAB);
        this.wic.plotSelector.setMeasureType(measureSubType);
        this.wic.plotSelector.setMode(PlotSelector.OUTLIER_DETECTION_MODE);
        var that = this;
        $("#outlier-detection").livequery(function () {
            that.updatePlots();
        });
    };
    return OutlierDetectionController;
})();
//# sourceMappingURL=OutlierDetectionController.js.map