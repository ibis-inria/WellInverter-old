///<reference path="../jquery.d.ts" />
///<reference path="WellReaderController.ts" />
///<reference path="../model/MeasureSubType.ts" />
/**
 * Class for handling background definition. Associated view is background-definition.html
 */
var BackgroundDefinitionController = (function () {
    /**
     * Constructor
     */
    function BackgroundDefinitionController(wrc, measureSubType, canvasContainerId) {
        // mouse button variables
        this.gMOUSEUP = false;
        this.gMOUSEDOWN = false;
        this.gMOUSEMOVE = false;
        // Indicates whether a mousedown event within selection happened
        this.selection = false;
        // selection mode: are we selecting wells or background wells in microplate ? // WELLS_SELECTION_MODE or BACKGROUND_SELECTION_MODE
        this.selectionMode = 1; // WELLS_SELECTION_MODE or BACKGROUND_SELECTION_MODE
        // size of well
        this.boxSize = 40;
        // offset of the 1st well from the top left corner
        this.matrixOffsetX = 20;
        this.matrixOffsetY = 50;
        this.wrc = wrc;
        this.measureSubType = measureSubType;
        this.canvasContainerId = canvasContainerId;
        this.selected = [];
        for (var l = 0; l < 8; l++)
            this.selected[l] = [false, false, false, false, false, false, false, false, false, false, false, false];
    }
    /**
     * Draw microplate
     */
    BackgroundDefinitionController.prototype.draw = function () {
        var canvas = document.getElementById(this.canvasContainerId);
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, 700, 500);
        // fond gris
        context.beginPath();
        context.rect(this.xCoord(0) - 30, this.yCoord(0) - 30, this.boxSize * 11 + 60, this.boxSize * 7 + 60);
        context.fillStyle = '#aaa';
        context.fill();
        for (var l = 0; l < 8; l++) {
            context.font = "10pt Arial";
            context.fillStyle = "#000000";
            context.fillText(String.fromCharCode(65 + l), 0, this.yCoord(l) + 5);
        }
        for (var c = 0; c < 12; c++) {
            context.fillText((c + 1).toString(), this.xCoord(c) - 7, this.yCoord(0) - 35);
        }
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                var w = this.wrc.wr.getWell(12 * l + c);
                var m = w.getMeasure(this.measureSubType);
                var bw = w.getBackgroundWell(this.measureSubType);
                var isb = w.isBackground(this.measureSubType);
                // well background
                context.beginPath();
                context.arc(this.xCoord(c), this.yCoord(l), 15, 0, Math.PI * 2, false);
                context.fillStyle = (m == null ? "#aaa" : (bw != null ? 'lightgreen' : 'lightgray'));
                context.fill();
                // well border
                context.lineWidth = (this.selected[l][c] ? 5 : 2);
                context.strokeStyle = (isb ? 'green' : '#666');
                context.stroke();
                if (bw != null) {
                    context.font = "9pt Arial";
                    context.fillStyle = "#000000";
                    var backgroundCol = bw.getColumn();
                    context.fillText(bw.getName(), this.xCoord(c) - (backgroundCol >= 9 ? 11 : 8), this.yCoord(l) + 5);
                }
            }
        }
    };
    /**
     * Init mouse handling events
     */
    BackgroundDefinitionController.prototype.initMouseHandler = function () {
        var bdc = this; // necessary because in event handling: this = current event
        var ydr = $("#YDR-Frame");
        var microplate = $("#" + this.canvasContainerId);
        // Global Events if left mousebutton is pressed or nor (usability fix)
        $(document).mouseup(function () {
            bdc.gMOUSEUP = true;
            bdc.gMOUSEDOWN = false;
        });
        $(document).mousedown(function () {
            bdc.gMOUSEUP = false;
            bdc.gMOUSEDOWN = true;
            bdc.gMOUSEMOVE = false;
        });
        var bdc = this;
        $(microplate).mousemove(function (e) {
            if (!bdc.selection) {
                var originalSignal = [];
                var xNow = e.pageX - microplate.offset().left;
                var yNow = e.pageY - microplate.offset().top;
                for (var l = 0; l < 8; l++) {
                    for (var c = 0; c < 12; c++) {
                        var measure = wrc.wr.getWell(12 * l + c).getMeasure(bdc.measureSubType);
                        if (Math.abs(xNow - bdc.xCoord(c)) < 15 && Math.abs(yNow - bdc.yCoord(l)) < 15 && bdc.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE && measure != null) {
                            for (var i = 0; i < measure.time.length; i++)
                                originalSignal.push([measure.time[i], measure.originalSignal[i]]);
                            if (!(this instanceof WellSetController)) {
                                $('#plot-div').highcharts({
                                    chart: {},
                                    credits: { enabled: false },
                                    exporting: { enabled: false },
                                    plotOptions: { series: { animation: false, lineWidth: 0 } },
                                    title: { text: wrc.wr.getWell(12 * l + c).getName() },
                                    legend: { enabled: false },
                                    yAxis: { title: { text: "" }, labels: { formatter: function () {
                                        return this.value;
                                    } } },
                                    series: [{ data: originalSignal, marker: { radius: 2 } }]
                                });
                            }
                            break;
                        }
                    }
                }
            }
        });
        // Selection frame
        ydr.mousedown(function (e) {
            bdc.selection = true;
            // store mouseX and mouseY
            bdc.x1 = e.pageX - microplate.offset().left + 10;
            bdc.y1 = e.pageY - microplate.offset().top + bdc.matrixOffsetY - 10;
        });
        // If bdc.selection is true (mousedown on selection frame) the mousemove
        // event will drawMicroplate the selection div
        ydr.mousemove(function (e) {
            bdc.gMOUSEMOVE = true;
            if (bdc.selection) {
                // Store current mouse position
                bdc.x2 = e.pageX - microplate.offset().left + 10;
                bdc.y2 = e.pageY - microplate.offset().top + bdc.matrixOffsetY - 10;
                // Prevent the selection div to get outside of your frame
                (bdc.x2 < 0) ? bdc.selection = false : (microplate.width() < bdc.x2) ? bdc.selection = false : (bdc.y2 < 0) ? bdc.selection = false : (microplate.height() < bdc.y2) ? bdc.selection = false : bdc.selection = true;
                // If the mouse is inside your frame resize the selection div
                if (bdc.selection) {
                    var selDiv = $("#selection");
                    // Use CSS to place your selection div
                    selDiv.css({
                        position: 'absolute',
                        zIndex: 5000,
                        left: Math.min(bdc.x1, bdc.x2),
                        top: Math.min(bdc.y1, bdc.y2) + 30,
                        width: Math.abs(bdc.x2 - bdc.x1),
                        height: Math.abs(bdc.y2 - bdc.y1)
                    });
                    selDiv.show();
                }
            }
        });
        // Selection complete, hide the selection div
        ydr.mouseup(function () {
            if (bdc.gMOUSEMOVE)
                bdc.selectRectangular(Math.min(bdc.x1, bdc.x2), Math.max(bdc.x1, bdc.x2), Math.min(bdc.y1, bdc.y2), Math.max(bdc.y1, bdc.y2));
            bdc.selection = false;
            $("#selection").hide();
        });
        // Usability fix. If mouse leaves the selection and enters the selection frame again with mousedown
        ydr.mouseenter(function () {
            bdc.selection = (bdc.gMOUSEDOWN);
        });
        // Usability fix. If mouse leaves the selection and enters the selection div again with mousedown
        $("#selection").mouseenter(function () {
            bdc.selection = (bdc.gMOUSEDOWN);
        });
        // Set selection to false, to prevent further selection outside of your selection frame
        ydr.mouseleave(function () {
            bdc.selection = false;
        });
    };
    /**
     * Return X coordinate of well column c (0 <= c <= 11)
     */
    BackgroundDefinitionController.prototype.xCoord = function (c) {
        return this.matrixOffsetX + 25 + c * this.boxSize;
    };
    /**
     * Return Y coordinate of well column l (0 <= l <= 7)
     */
    BackgroundDefinitionController.prototype.yCoord = function (l) {
        return this.matrixOffsetY + l * this.boxSize;
    };
    /**
     * Handle rectangular selection in microplate div
     * @param xmin
     * @param xmax
     * @param ymin
     * @param ymax
     */
    BackgroundDefinitionController.prototype.selectRectangular = function (xmin, xmax, ymin, ymax) {
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                //console.log(Math.abs(xNow - matrix.xCoord(c)), Math.abs(yNow - matrix.yCoord(l)));
                if (xmin < this.xCoord(c) && xmax > this.xCoord(c) && ymin < this.yCoord(l) + this.matrixOffsetY && ymax > this.yCoord(l) + this.matrixOffsetY && (this.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE || wrc.wr.getWell(12 * l + c).getMeasure(this.measureSubType) != null)) {
                    this.selected[l][c] = true;
                }
            }
        }
        this.draw();
        this.updateSetBackgroundButtons();
    };
    /**
     * Handle click on the microplate
     */
    BackgroundDefinitionController.prototype.microplateClickhandler = function (e) {
        var jqCanvas = $("#" + this.canvasContainerId);
        var xNow = e.pageX - jqCanvas.offset().left;
        var yNow = e.pageY - jqCanvas.offset().top;
        console.log('clic:', xNow, yNow, Math.abs(xNow - this.xCoord(0)), Math.abs(yNow - this.yCoord(0)));
        var sel = null;
        var updatedSelection = false;
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                // click on a well
                if (Math.abs(xNow - this.xCoord(c)) < 15 && Math.abs(yNow - this.yCoord(l)) < 15 && (this.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE || wrc.wr.getWell(12 * l + c).getMeasure(this.measureSubType) != null)) {
                    sel = { l: l, c: c };
                    updatedSelection = true;
                    break;
                }
                // click on a line name
                if (Math.abs(xNow - this.xCoord(0) + 30) < 15 && Math.abs(yNow - this.yCoord(l)) < 15 && this.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE) {
                    for (var c1 = 0; c1 < 12; c1++) {
                        if (this instanceof WellSetController || wrc.wr.getWell(12 * l + c1).hasMeasure(this.measureSubType))
                            this.selected[l][c1] = true;
                    }
                    updatedSelection = true;
                    break;
                }
                // click on a column name
                if (Math.abs(yNow - this.yCoord(0) + 30) < 15 && Math.abs(xNow - this.xCoord(c)) < 15 && this.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE) {
                    for (var l1 = 0; l1 < 8; l1++) {
                        if (this instanceof WellSetController || wrc.wr.getWell(12 * l1 + c).hasMeasure(this.measureSubType))
                            this.selected[l1][c] = true;
                    }
                    updatedSelection = true;
                    break;
                }
            }
        }
        if (sel != null) {
            if (wrc.wr.getWell(12 * sel.l + sel.c).getMeasure(this.measureSubType) != null) {
                if (this.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE)
                    this.selected[sel.l][sel.c] = !this.selected[sel.l][sel.c];
                else {
                    this.selectedBackGroundWell = wrc.wr.getWell(12 * sel.l + sel.c);
                    this.setBackgroundWell();
                }
            }
        }
        if (updatedSelection) {
            this.draw();
            this.updateSetBackgroundButtons();
        }
    };
    /**
     * Update the 'disabled' status of 'Set background' and 'Unset background' buttons
     */
    BackgroundDefinitionController.prototype.updateSetBackgroundButtons = function () {
        var setBackgroundButton = $('#set-background-button');
        var unsetBackgroundButton = $('#unset-background-button');
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                if (this.selected[l][c]) {
                    setBackgroundButton.removeAttr("disabled");
                    unsetBackgroundButton.removeAttr("disabled");
                    return;
                }
            }
        }
        setBackgroundButton.attr("disabled", "disabled");
        unsetBackgroundButton.attr("disabled", "disabled");
    };
    /**
     * Set background well of selected Wells
     */
    BackgroundDefinitionController.prototype.setBackgroundWell = function () {
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                if (this.selected[l][c]) {
                    this.wrc.wr.wells[12 * l + c].setBackgroundWell(this.measureSubType, this.selectedBackGroundWell);
                    this.selected[l][c] = false;
                }
            }
        }
        this.selectedBackGroundWell = null;
        this.toggleSelectionMode(BackgroundDefinitionController.WELLS_SELECTION_MODE);
        this.wrc.experimentController.saveExperiment();
    };
    /**
     * Run on "Set background" button click
     */
    BackgroundDefinitionController.prototype.setBackgroundClickHandler = function () {
        this.toggleSelectionMode(BackgroundDefinitionController.BACKGROUND_SELECTION_MODE);
    };
    /**
     * Run on "Unset background" button click
     */
    BackgroundDefinitionController.prototype.unsetBackgroundClickHandler = function () {
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                if (this.selected[l][c]) {
                    this.wrc.wr.wells[12 * l + c].setBackgroundWell(this.measureSubType, null);
                    this.selected[l][c] = false;
                }
            }
        }
        this.draw();
        this.updateSetBackgroundButtons();
        this.wrc.wr.resetComputedData();
        this.wrc.experimentController.saveExperiment();
    };
    /**
     * Toggle selection mode: are we selecting wells or background wells in microplate ?
     * @param mode WELLS_SELECTION_MODE or BACKGROUND_SELECTION_MODE
     */
    BackgroundDefinitionController.prototype.toggleSelectionMode = function (mode) {
        if (mode == BackgroundDefinitionController.BACKGROUND_SELECTION_MODE) {
            var sel = null;
            for (var l = 0; l < 8; l++) {
                for (var c = 0; c < 12; c++) {
                    if (this.selected[l][c]) {
                        sel = { l: l, c: c };
                        break;
                    }
                }
            }
            if (sel != null) {
                this.selectionMode = mode;
                //this.updateSetBackgroundButtons();
                $('#set-background-button').attr("disabled", "disabled");
                $('#unset-background-button').attr("disabled", "disabled");
                $('#background-definition-tip').html("Click on background well.");
            }
        }
        else {
            this.selectionMode = mode;
            $('#background-definition-tip').html("1. Select the wells for which you want to set/unset the background well: click a well, a column name or a line name, or draw rectangular selection.<br>" + "2. Click the 'Set background'/'Unset background' button to set/unset the background of selected wells");
        }
        this.wrc.wr.resetComputedData();
    };
    /**
     * Show view in tab
     */
    BackgroundDefinitionController.prototype.showView = function () {
        this.closeExistingMicroplateViews();
        this.wrc.tabController.showTab(TabController.BACKGROUND_DEFINITION_TAB);
        var bdc = this;
        $("#background-microplate").livequery(function () {
            bdc.draw();
            bdc.toggleSelectionMode(BackgroundDefinitionController.WELLS_SELECTION_MODE);
            bdc.updateSetBackgroundButtons();
            bdc.initMouseHandler();
            $("#measure-subtype").html(wrc.wr.measureSubTypes[bdc.measureSubType].name);
        });
    };
    /**
     * Close existing BackgroundDefinition and WellSet views because it would otherwise generate ID uniqueness conflicts
     * A better solution would be to use a JS template system like Mustache
     */
    BackgroundDefinitionController.prototype.closeExistingMicroplateViews = function () {
        var tc = this.wrc.tabController;
        if (tc.existsTab(TabController.BACKGROUND_DEFINITION_TAB))
            tc.closeTab(TabController.BACKGROUND_DEFINITION_TAB);
        for (var i = 0; i < this.wrc.wr.wellSets.length; i++) {
            if (tc.existsTab(TabController.WELL_SET_DEFINITION_TAB, this.wrc.wr.wellSets[i]))
                tc.closeTab(TabController.WELL_SET_DEFINITION_TAB, this.wrc.wr.wellSets[i]);
        }
    };
    // selection modes: wells or background well
    BackgroundDefinitionController.WELLS_SELECTION_MODE = 1;
    BackgroundDefinitionController.BACKGROUND_SELECTION_MODE = 2;
    return BackgroundDefinitionController;
})();
//# sourceMappingURL=BackgroundDefinitionController.js.map