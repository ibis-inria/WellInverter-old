///<reference path="WellReaderController.ts" />
///<reference path="DialogController.ts" />
///<reference path="../model/Session.ts" />
///<reference path="../model/WellReader.ts" />
/**
 * Class for controlling experiments. Methods of this class (except downloadExperiment()) involve AJAX
 * calls to the PHP server side methods.
 *
 * Experiment have a name corresponding to the prefix of the JSON file containing the experiment.
 * Suffix is .json
 * Experiment files are located in each user directory under 'experiments' directory
 */
var ExperimentController = (function () {
    /**
     * Constructor
     */
    function ExperimentController(wrc) {
        /**
         * Currently loaded experiment name
         */
        this.experimentName = null;
        this.wrc = wrc;
    }
    /**
     * List experiments of current user
     */
    ExperimentController.prototype.experimentsList = function () {
        wrc = this.wrc;
        $.ajax({
            url: "../../server/WellReaderController.php",
            type: 'post',
            data: { action: "experimentsList", user: Session.getUserName() },
            async: false,
            success: function (output) {
                wrc.experiments = JSON.parse(output); // array of string
            }
        });
    };
    /**
     * Download experiment with name expName
     *
     * @param expName experiment name
     * Note : Ajax call doesn't work for download
     */
    ExperimentController.prototype.downloadExperiment = function (expName) {
        window.location.href = "../../server/WellReaderController.php?action=downloadExperiment&name=" + expName + "&user=" + Session.getUserName();
    };
    /**
     * Load experiment with name expName, by reading JSON file
     *
     * @param expName experiment name
     */
    ExperimentController.prototype.loadExperiment = function (expName) {
        if (expName != this.experimentName) {
            console.log('loading ' + expName);
            if (this.experimentName != null)
                wrc.tabController.closeAllTabs();
            $("html").addClass("wait");
            var json = '../../experiments/' + Session.getUserName() + '/' + expName + '.json';
            $.getJSON(json, { format: "json" }).done(function (data) {
                wrc.wr = new WellReader();
                MeasureSubType.counter = 0; // necessary for generating subTypes from 0;
                WellReader.readJSON(wrc.wr, data);
                for (var w = 0; w <= 95; w++) {
                    var well = wrc.wr.getWell(w);
                    for (var m = 0; m < well.measures.length; m++) {
                        var measure = well.getMeasure(m);
                        if (measure != null) {
                            measure.subType = wrc.wr.measureSubTypes[m].id;
                            measure.type = wrc.wr.measureSubTypes[m].type;
                            if (measure.outlier.length == 0)
                                measure.outlier = new Array(measure.time.length);
                        }
                    }
                }
                wrc.wr.resetComputedData();
                // set parameters values
                wrc.experimentParametersController.setParameters();
                // open experiment node in tree
                var tc = wrc.treeController;
                var rootNode = tc.getRootNode();
                var nodes = tc.getChildrenNodes(rootNode);
                var expNode = null;
                for (var c = 0; c < nodes.length; c++) {
                    if (nodes[c].text == expName) {
                        expNode = nodes[c];
                        if (wrc.experimentController.experimentName != expName)
                            tc.selectNode(nodes[c]);
                        tc.expandNode();
                        // prepare plot selector
                        wrc.plotSelector = new PlotSelector(wrc);
                        wrc.plotSelector.init();
                        break;
                    }
                }
                // append measure subtypes background definition nodes in tree
                var backgroundDefinitionNode = tc.getChildNodeWithType(expNode, TreeController.BACKGROUND_DEFINITION_NODE);
                for (var i = 0; i < wrc.wr.measureSubTypes.length; i++) {
                    var mst = wrc.wr.measureSubTypes[i];
                    tc.appendNode(backgroundDefinitionNode, mst.name, null, TreeController.MEASURE_SUBTYPE_BACKGROUND_DEFINITION_NODE, (function (mst1) {
                        return function () {
                            wrc.backgroundDefinitionController = new BackgroundDefinitionController(wrc, mst1.id, "background-microplate");
                            wrc.backgroundDefinitionController.showView();
                        };
                    })(mst));
                }
                // append measure subtypes outlier detection nodes
                var outlierNode = tc.getChildNodeWithType(expNode, TreeController.OUTLIER_DETECTION_NODE);
                for (var i = 0; i < wrc.wr.measureSubTypes.length; i++) {
                    var mst = wrc.wr.measureSubTypes[i];
                    tc.appendNode(outlierNode, mst.name, null, TreeController.MEASURE_SUBTYPE_OUTLIER_DETECTION_NODE, (function (mst1) {
                        return function () {
                            this.wrc.outlierDetectionController.showView(mst1.id);
                        };
                    })(mst));
                }
                wrc.experimentController.experimentName = expName;
                console.log('Loaded ' + json);
                $("html").removeClass("wait");
            });
        }
    };
    /**
     * Delete experiment with name expName
     *
     * @param expName experiment name
     */
    ExperimentController.prototype.deleteExperiment = function (expName) {
        if (expName == this.experimentName) {
            this.wrc.tabController.closeAllTabs();
            this.experimentName = null;
            this.wrc.wr = new WellReader();
        }
        $.ajax({
            url: "../../server/WellReaderController.php",
            type: 'post',
            data: { action: "deleteExperiment", name: expName, user: Session.getUserName() },
            success: function (output) {
                if (output != "")
                    new DialogController(wrc, output).open({ title: "Delete experiment", width: 600, height: 160 });
            }
        });
    };
    /**
     * Rename experiment with name expName
     *
     * @param oldName old experiment name
     * @param newName new experiment name
     */
    ExperimentController.prototype.renameExperiment = function (oldName, newName) {
        $.ajax({
            url: "../../server/WellReaderController.php",
            type: 'post',
            data: { action: "renameExperiment", oldName: oldName, newName: newName, user: Session.getUserName() },
            success: function (output) {
                if (false && output != "") {
                    new DialogController(wrc, output).open({ title: "Rename experiment", width: 600, height: 160 });
                    wrc.treeController.resetNodeName();
                }
                else
                    wrc.experimentController.experimentName = newName;
            }
        });
    };
    /**
     * Save currently loaded experiment
     */
    ExperimentController.prototype.saveExperiment = function () {
        $.ajax({
            url: "../../server/WellReaderController.php",
            type: 'post',
            global: false,
            contentType: 'application/json',
            data: JSON.stringify({
                "action": "saveExperiment",
                "name": wrc.experimentController.experimentName,
                "user": Session.getUserName(),
                "wr": wrc.wr.generateJSON()
            }),
            success: function (output) {
                if (output != "") {
                    new DialogController(wrc, output).open({ title: "Save experiment", width: 600, height: 160 });
                }
                console.log("Saved " + wrc.experimentController.experimentName + ".json");
            },
            error: function () {
                alert("Cannot save experiment to server");
            }
        });
    };
    /**
     * Exports curves of computed data
     */
    ExperimentController.prototype.exportCurves = function () {
        var curves = [];
        for (var w = 0; w < 96; w++) {
            var well = wrc.wr.getWell(w);
            for (var t = 0; t < wrc.wr.measureSubTypes.length; t++) {
                var m = well.getMeasure(t);
                if (m != null && (m.originalCurve != null || m.outlierFreeCurve != null || m.subtractedBackgroundCurve != null)) {
                    curves.push({
                        well: w,
                        type: m.subTypeName(),
                        originalCurve: m.originalCurve,
                        outlierFreeCurve: m.outlierFreeCurve,
                        subtractedBackgroundCurve: m.subtractedBackgroundCurve
                    });
                }
            }
        }
        wrc = this.wrc;
        $.ajax({
            url: "../../server/WellReaderController.php",
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify({
                "action": "exportCurves",
                "curves": curves,
                "user": Session.getUserName()
            }),
            success: function (result) {
                if (result == "")
                    window.location.href = '../../experiments/' + Session.getUserName() + '/curves.zip';
                else
                    new DialogController(wrc, result).open({ title: "Export curves", width: 600, height: 160 });
            }
        });
    };
    return ExperimentController;
})();
//# sourceMappingURL=ExperimentController.js.map