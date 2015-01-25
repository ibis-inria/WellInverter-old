///<reference path="../jquery.d.ts" />
///<reference path="WellInverterController.ts" />
///<reference path="WellSetController.ts" />
///<reference path='ExperimentController.ts'/>
///<reference path='ExperimentInfoController.ts'/>
///<reference path='ExperimentParametersController.ts'/>
///<reference path='BackgroundDefinitionController.ts'/>
///<reference path='ContextMenuController.ts'/>
///<reference path='../model/WellSet.ts'/>
/**
 * Controller of the Jquery easyui tree
 */
var TreeController = (function () {
    /**
     * Constructor
     */
    function TreeController(wic, treeContainerId) {
        this.wic = wic;
        this.treeContainerId = treeContainerId;
        this.contextMenuController = new ContextMenuController(this.wic, 'context-menu');
    }
    /**
     * JQuery selector for the tree
     */
    TreeController.prototype.jqTree = function () {
        return $('#' + this.treeContainerId);
    };
    /**
     * Setup the tree
     */
    TreeController.prototype.init = function () {
        var tc = this;
        this.jqTree().tree({
            data: this.tree(),
            animate: true,
            onContextMenu: function (e, node) {
                tc.contextMenuController.show(e, node);
            },
            onClick: function () {
                tc.getSelectedNode().attributes.onclick.call(null);
            },
            onDblClick: function () {
                tc.getSelectedNode().attributes.onclick.call(null);
            },
            onAfterEdit: function () {
                wic.treeController.updateNodeName();
            },
            onExpand: function (node) {
                if (tc.nodeType(node) == TreeController.EXPERIMENT_NODE) {
                    //tc.selectNode(node);
                    tc.selectExperiment(tc.nodeObject(node));
                }
            }
        });
    };
    // ---------------------------------------------------------------------------------------------
    // JQuery-easyUI Tree API wrapping
    /**
     * Contains the type of object: see static variables ..._NODE at the top of the class
     */
    TreeController.prototype.nodeType = function (node) {
        if (node != null && node.hasOwnProperty("attributes"))
            return node.attributes.type;
        else
            return null;
    };
    /**
     *  WellInverter object associated to the node
     */
    TreeController.prototype.nodeObject = function (node) {
        if (node != null && node.hasOwnProperty("attributes"))
            return node.attributes.object;
        else
            return null;
    };
    TreeController.prototype.getSelectedNode = function () {
        return this.jqTree().tree('getSelected');
    };
    TreeController.prototype.isLeaf = function (node) {
        return this.jqTree().tree('isLeaf', node.target);
    };
    TreeController.prototype.selectNode = function (node) {
        this.jqTree().tree('select', node.target);
    };
    TreeController.prototype.findNode = function (id) {
        return this.jqTree().tree('find', id);
    };
    TreeController.prototype.getChildNodeWithType = function (node, type) {
        var children = this.getChildrenNodes(node);
        for (var c = 0; c < children.length; c++) {
            if (children[c].attributes.type == type) {
                return children[c];
            }
        }
        return null;
    };
    TreeController.prototype.getRootNode = function () {
        return this.jqTree().tree('getRoot');
    };
    TreeController.prototype.getParentNode = function (node) {
        return this.jqTree().tree('getParent', node.target);
    };
    TreeController.prototype.getChildrenNodes = function (node) {
        return this.jqTree().tree('getChildren', node.target);
    };
    TreeController.prototype.beginEdit = function (node) {
        this.jqTree().tree('beginEdit', node.target);
    };
    TreeController.prototype.appendNode = function (parent, text, obj, type, onclick) {
        this.jqTree().tree('append', {
            parent: parent.target,
            data: [{ id: TreeController.nodeCounter++, text: text, attributes: { object: obj, type: type, onclick: onclick } }]
        });
    };
    TreeController.prototype.removeNode = function () {
        var node = this.getSelectedNode();
        this.jqTree().tree('remove', node.target);
    };
    TreeController.prototype.renameNode = function () {
        var node = this.getSelectedNode();
        this.oldName = node.text;
        this.jqTree().tree('beginEdit', node.target);
    };
    TreeController.prototype.resetNodeName = function () {
        var node = this.getSelectedNode();
        this.jqTree().tree('update', {
            target: node.target,
            text: this.oldName
        });
    };
    TreeController.prototype.expandNode = function () {
        var node = this.getSelectedNode();
        this.jqTree().tree('expand', node.target);
    };
    TreeController.prototype.collapseNode = function (node) {
        this.jqTree().tree('collapse', node.target);
    };
    TreeController.prototype.expandAll = function () {
        this.jqTree().tree('expandAll');
    };
    TreeController.prototype.collapseAll = function () {
        this.jqTree().tree('collapseAll');
    };
    /**
     * run on AfterEdit
     */
    TreeController.prototype.updateNodeName = function () {
        var node = this.getSelectedNode();
        var type = this.nodeType(node);
        if (type == TreeController.EXPERIMENT_NODE)
            wic.experimentController.renameExperiment(this.oldName, node.text);
        else if (type == TreeController.WELL_SET_NODE) {
            this.nodeObject(node).setName(this.oldName, node.text);
            this.wic.plotSelector.refreshWellSets();
        }
    };
    // ---------------------------------------------------------------------------------------------
    // tree description
    /**
     * Tree constructor
     */
    TreeController.prototype.tree = function () {
        var experiments = this.wic.experiments.map(function (e) {
            return {
                "id": TreeController.nodeCounter++,
                "text": e,
                "state": "closed",
                "attributes": { "object": e, "type": TreeController.EXPERIMENT_NODE, "iconCls": "icon-experiment", "onclick": function () {
                    wic.treeController.selectExperiment(e);
                } },
                "children": [
                    { "id": TreeController.nodeCounter++, "text": "Info", "iconCls": "icon-info", "attributes": { "object": null, "type": TreeController.EXPERIMENT_INFO_NODE, "onclick": function () {
                        new ExperimentInfoController(wic, "experiment-info").showView();
                    } } },
                    { "id": TreeController.nodeCounter++, "text": "Parameters", "iconCls": "icon-settings", "attributes": { "object": null, "type": TreeController.GLOBAL_PARAMETERS_NODE, "onclick": function () {
                        wic.experimentParametersController = new ExperimentParametersController(wic);
                        wic.experimentParametersController.showView();
                    } } },
                    { "id": TreeController.nodeCounter++, "text": "Background", "iconCls": "icon-background", "attributes": { "object": null, "type": TreeController.BACKGROUND_DEFINITION_NODE, "onclick": function () {
                        wic.treeController.expandNode();
                    } } },
                    { "id": TreeController.nodeCounter++, "text": "Outliers", "iconCls": "icon-outliers", "attributes": { "object": null, "type": TreeController.OUTLIER_DETECTION_NODE, "onclick": function () {
                        console.log(wic.treeController.getSelectedNode()); /*wic.treeController.expandNode();*/
                    } } },
                    { "id": TreeController.nodeCounter++, "text": "Plots", "iconCls": "icon-plot", "attributes": { "object": null, "type": TreeController.PLOTS_NODE, "onclick": function () {
                        this.wic.plotController.showView();
                    } } }
                ]
            };
        }, this);
        return [{ "id": 0, "text": "Experiments", "attributes": { "object": null, "type": TreeController.EXPERIMENTS_NODE, "onclick": function () {
            wic.treeController.expandNode();
        } }, "children": experiments }];
    };
    // ---------------------------------------------------------------------------------------------
    // WellInverter operations associated with tree node click handling
    /**
     * Select and open experiment expName in the tree
     */
    TreeController.prototype.selectExperiment = function (expName) {
        if (this.wic.experimentController.experimentName != expName) {
            var rootNode = this.getRootNode();
            var nodes = this.getChildrenNodes(rootNode);
            for (var c = 0; c < nodes.length; c++) {
                if (this.wic.experimentController.experimentName == nodes[c].text) {
                    this.collapseNode(nodes[c]);
                    break;
                }
            }
            this.wic.experimentController.loadExperiment(expName);
        }
    };
    /**
     * Delete selected experiment
     */
    TreeController.prototype.deleteExperiment = function () {
        wic.experimentController.deleteExperiment(this.getSelectedNode().text);
        this.removeNode();
    };
    /**
     * Download selected experiment
     */
    TreeController.prototype.downloadExperiment = function () {
        new ExperimentController(this.wic).downloadExperiment(this.getSelectedNode().text);
    };
    /**
     * Export a zip file containing computed data
     */
    TreeController.prototype.exportCurves = function () {
        wic.experimentController.exportCurves();
    };
    /**
     * Create a new WellSet
     */
    TreeController.prototype.appendWellSet = function () {
        this.oldName = this.wic.wr.generateUniqueName("wellSet", "New wellSet");
        var ws = new WellSet(this.wic, this.oldName);
        var node = this.getSelectedNode();
        this.appendNode(node.target, this.oldName, ws, TreeController.WELL_SET_NODE, function () {
            wic.treeController.modifyWellSet();
        });
        var newNode = this.findNode(TreeController.nodeCounter - 1);
        this.selectNode(newNode); // otherwise parent node remains selected
        this.beginEdit(newNode);
    };
    /**
     * Modify selected WellSet
     */
    TreeController.prototype.modifyWellSet = function () {
        var node = this.getSelectedNode();
        var ws = this.nodeObject(node);
        wic.wellSetController = new WellSetController(wic, "well-set-microplate", ws);
        wic.wellSetController.showView();
    };
    /**
     * Delete selected WellSet
     */
    TreeController.prototype.deleteWellSet = function () {
        var node = this.getSelectedNode();
        var ws = this.nodeObject(node);
        this.wic.wr.removeWellSet(ws);
        this.removeNode();
        wic.wellSetController.closeView();
    };
    // Node types
    TreeController.EXPERIMENTS_NODE = 0;
    TreeController.EXPERIMENT_NODE = 1;
    TreeController.EXPERIMENT_INFO_NODE = 2;
    TreeController.GLOBAL_PARAMETERS_NODE = 3;
    TreeController.BACKGROUND_DEFINITION_NODE = 4;
    TreeController.MEASURE_SUBTYPE_BACKGROUND_DEFINITION_NODE = 5;
    TreeController.OUTLIER_DETECTION_NODE = 6;
    TreeController.MEASURE_SUBTYPE_OUTLIER_DETECTION_NODE = 7;
    TreeController.WELL_SETS_NODE = 8;
    TreeController.WELL_SET_NODE = 9;
    TreeController.PLOTS_NODE = 10;
    TreeController.ABS_PLOTS_NODE = 11;
    TreeController.RFU_PLOTS_NODE = 12;
    TreeController.RLU_PLOTS_NODE = 13;
    /**
     * used for giving unique ID to nodes
     */
    TreeController.nodeCounter = 1;
    return TreeController;
})();
//# sourceMappingURL=TreeController.js.map