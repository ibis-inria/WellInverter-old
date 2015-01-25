///<reference path="WellInverterController.ts" />
///<reference path="DialogController.ts" />
///<reference path="../model/Session.ts" />
///<reference path="../model/WellInverter.ts" />

declare var $: JQueryStatic;
declare var wic: WellInverterController;

/**
 * Class for controlling experiments. Methods of this class (except downloadExperiment()) involve AJAX
 * calls to the PHP server side methods.
 *
 * Experiment have a name corresponding to the prefix of the JSON file containing the experiment.
 * Suffix is .json
 * Experiment files are located in each user directory under 'experiments' directory
 */
class ExperimentController  {

    /**
     * WellInverterController associated with me
     */
    public wic: WellInverterController;

    /**
     * Currently loaded experiment name
     */
    experimentName: string = null;

    /**
     * Constructor
     */
    constructor(wic: WellInverterController) {
        this.wic = wic;
    }

    /**
     * List experiments of current user
     */
     experimentsList(): void {
        wic = this.wic;
        $.ajax({
            url:"../../server/WellInverterController.php",
            type: 'post',
            data: {action: "experimentsList", user: Session.getUserName()},
            async: false,
            success: function(output) {
                wic.experiments = JSON.parse(output); // array of string
            }
        });
    }

    /**
     * Download experiment with name expName
     *
     * @param expName experiment name
     * Note : Ajax call doesn't work for download
     */
     downloadExperiment(expName: string): void {
        window.location.href = "../../server/WellInverterController.php?action=downloadExperiment&name=" + expName + "&user=" + Session.getUserName();
    }

    /**
     * Load experiment with name expName, by reading JSON file
     *
     * @param expName experiment name
     */
    loadExperiment(expName: string) {
        if ( expName != this.experimentName  ) {console.log('loading '+expName);

            if ( this.experimentName != null )
                wic.tabController.closeAllTabs();

            $("html").addClass("wait");

            var json = '../../experiments/' + Session.getUserName() + '/' + expName + '.json';
            $.getJSON(json, {format: "json"}).done(function( data ) {
                wic.wr = new WellInverter();

                MeasureSubType.counter = 0; // necessary for generating subTypes from 0;

                WellInverter.readJSON(wic.wr, data);

                // adjust measure types
                // TODO this should be done on the server when uploading a CSV file

                for (var w: number = 0; w <= 95; w++) {
                    var well: Well = wic.wr.getWell(w);
                    for (var m: number = 0; m < well.measures.length; m++) {
                        var measure:Measure = well.getMeasure(m);
                        if (measure != null) {
                            measure.subType = wic.wr.measureSubTypes[m].id;
                            measure.type = wic.wr.measureSubTypes[m].type;
                            if ( measure.outlier.length == 0 )
                                measure.outlier = new Array(measure.time.length);
                        }
                    }
                }

                wic.wr.resetComputedData();

                // set parameters values

                wic.experimentParametersController.setParameters();

                // open experiment node in tree

                var tc = wic.treeController;
                var rootNode = tc.getRootNode();
                var nodes = tc.getChildrenNodes(rootNode);
                var expNode = null;
                for (var c = 0; c < nodes.length; c++) {
                    if ( nodes[c].text == expName ) {
                        expNode = nodes[c];
                        if ( wic.experimentController.experimentName != expName )
                            tc.selectNode(nodes[c]);
                        tc.expandNode();

                        // prepare plot selector

                        wic.plotSelector = new PlotSelector(wic);
                        wic.plotSelector.init();

                        break;
                    }
                }

                // append measure subtypes background definition nodes in tree

                var backgroundDefinitionNode = tc.getChildNodeWithType(expNode, TreeController.BACKGROUND_DEFINITION_NODE);
                for (var i=0; i < wic.wr.measureSubTypes.length; i++) {
                    var mst = wic.wr.measureSubTypes[i];
                    tc.appendNode(backgroundDefinitionNode, mst.name, null, TreeController.MEASURE_SUBTYPE_BACKGROUND_DEFINITION_NODE,
                        (function (mst1) {
                            return function() {
                                wic.backgroundDefinitionController = new BackgroundDefinitionController(wic, mst1.id, "background-microplate");
                                wic.backgroundDefinitionController.showView()
                            }
                        })(mst));
                }

                // append measure subtypes outlier detection nodes

                var outlierNode = tc.getChildNodeWithType(expNode, TreeController.OUTLIER_DETECTION_NODE);
                for(var i=0; i < wic.wr.measureSubTypes.length; i++) {
                    var mst = wic.wr.measureSubTypes[i];
                    tc.appendNode(outlierNode, mst.name, null, TreeController.MEASURE_SUBTYPE_OUTLIER_DETECTION_NODE,
                        (function (mst1) {
                            return function() {
                                this.wic.outlierDetectionController.showView(mst1.id);
                            }
                        })(mst));
                }

                wic.experimentController.experimentName = expName;
                console.log('Loaded ' + json);
                $("html").removeClass("wait");
            });
        }
    }

    /**
     * Delete experiment with name expName
     *
     * @param expName experiment name
     */
    deleteExperiment(expName: string) {
        if ( expName == this.experimentName ) {
            this.wic.tabController.closeAllTabs();
            this.experimentName = null;
            this.wic.wr = new WellInverter();
        }

        $.ajax({
            url:"../../server/WellInverterController.php",
            type: 'post',
            data: {action: "deleteExperiment", name: expName, user: Session.getUserName()},
            success: function(output) {
                if ( output != "" )
                    new DialogController(wic, output).open({title: "Delete experiment", width: 600, height: 160});
            }
        });
    }

    /**
     * Rename experiment with name expName
     *
     * @param oldName old experiment name
     * @param newName new experiment name
     */
    renameExperiment(oldName: string, newName: string): void {
        $.ajax({
            url:"../../server/WellInverterController.php",
            type: 'post',
            data: {action: "renameExperiment", oldName: oldName, newName: newName, user: Session.getUserName()},
            success: function(output) {
                if ( false && output != "" ) {
                    new DialogController(wic, output).open({title: "Rename experiment", width: 600, height: 160});
                    wic.treeController.resetNodeName();
                }
                else wic.experimentController.experimentName = newName;
            }
        });
    }

    /**
     * Save currently loaded experiment
     */
    saveExperiment(): void {
        $.ajax({
            url:"../../server/WellInverterController.php",
            type: 'post',
            global: false,     // ajaxStart() is not triggered
            contentType:'application/json',
            data: JSON.stringify({
                "action": "saveExperiment",
                "name": wic.experimentController.experimentName,
                "user": Session.getUserName(),
                "wr": wic.wr.generateJSON()
            }),
            success: function(output) {
                if ( output != "" ) {
                    new DialogController(wic, output).open({title: "Save experiment", width: 600, height: 160});
                }
                console.log("Saved " + wic.experimentController.experimentName + ".json");
            },
            error: function(){
                alert("Cannot save experiment to server");
            }
        });
    }

    /**
     * Exports curves of computed data
     */
    exportCurves(): void {
        var curves = [];
        for(var w = 0; w < 96; w++) {
            var well: Well = wic.wr.getWell(w);
            for (var t = 0; t < wic.wr.measureSubTypes.length; t++) {
                var m: Measure = well.getMeasure(t);
                if ( m != null && (m.originalCurve != null || m.outlierFreeCurve != null || m.subtractedBackgroundCurve != null) ) {

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

        wic = this.wic;
        $.ajax({
            url:"../../server/WellInverterController.php",
            type: 'post',
            contentType:'application/json',
            data: JSON.stringify({
                "action": "exportCurves",
                "curves": curves,
                "user": Session.getUserName()
            }),
            success: function(result) {
                if ( result == "" )
                    window.location.href = '../../experiments/' + Session.getUserName() + '/curves.zip';
                else new DialogController(wic, result).open({title: "Export curves", width: 600, height: 160});
            }
        });
    }
}