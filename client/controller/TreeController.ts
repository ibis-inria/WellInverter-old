///<reference path="../jquery.d.ts" />
///<reference path="WellReaderController.ts" />
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
class TreeController {

    // Node types
    public static EXPERIMENTS_NODE = 0;
    public static EXPERIMENT_NODE = 1;
    public static EXPERIMENT_INFO_NODE = 2;
    public static GLOBAL_PARAMETERS_NODE = 3;
    public static BACKGROUND_DEFINITION_NODE = 4;
    public static MEASURE_SUBTYPE_BACKGROUND_DEFINITION_NODE = 5;
    public static OUTLIER_DETECTION_NODE = 6;
    public static MEASURE_SUBTYPE_OUTLIER_DETECTION_NODE = 7;
    public static WELL_SETS_NODE = 8;
    public static WELL_SET_NODE = 9;
    public static PLOTS_NODE = 10;
    public static ABS_PLOTS_NODE = 11;
    public static RFU_PLOTS_NODE = 12;
    public static RLU_PLOTS_NODE = 13;

    /**
     * used for giving unique ID to nodes
     */
    public static nodeCounter = 1;

    /**
     * WellReaderController associated with me
     */
    wrc: WellReaderController;

    /**
     * ContextMenuController
     */
    public contextMenuController: ContextMenuController;

    /**
     * id of the div containing the tree
     */
    treeContainerId: string;

    /**
     * Previous text of node. Used with editing node text
     */
    oldName: string;

    /**
     * Constructor
     */
    constructor( wrc: WellReaderController, treeContainerId: string) {
        this.wrc = wrc;
        this.treeContainerId = treeContainerId;
        this.contextMenuController = new ContextMenuController(this.wrc, 'context-menu');
    }

    /**
     * JQuery selector for the tree
     */
    jqTree(): any {
        return $('#'+this.treeContainerId);
    }

    /**
     * Setup the tree
     */
    init(): void {
        var tc = this;
        this.jqTree().tree({
            data: this.tree(),
            animate: true,
            onContextMenu: function(e, node){tc.contextMenuController.show(e, node)},
            onClick: function(){ tc.getSelectedNode().attributes.onclick.call(null);},  // MP 10-03-2014
            onDblClick: function(){ tc.getSelectedNode().attributes.onclick.call(null);},  // MP 10-03-2014
            onAfterEdit: function(){wrc.treeController.updateNodeName()},
            onExpand: function(node) {
                        if ( tc.nodeType(node) == TreeController.EXPERIMENT_NODE) {
                            //tc.selectNode(node);
                            tc.selectExperiment(tc.nodeObject(node));
                        }
            }
        });
    }
// ---------------------------------------------------------------------------------------------
// JQuery-easyUI Tree API wrapping

    /**
     * Contains the type of object: see static variables ..._NODE at the top of the class
     */
     nodeType(node: any): number {
        if ( node != null && node.hasOwnProperty("attributes") )
            return node.attributes.type;
        else return null;
    }

    /**
     *  WellReader object associated to the node
     */
     nodeObject(node): any {
        if ( node != null && node.hasOwnProperty("attributes") )
            return node.attributes.object;
        else return null;
    }

    getSelectedNode(): any {
        return this.jqTree().tree('getSelected');
    }

    isLeaf(node): boolean {
        return this.jqTree().tree('isLeaf', node.target);
    }

    selectNode(node): void {
        this.jqTree().tree('select', node.target);
    }

    findNode(id: number): any {
        return this.jqTree().tree('find', id);
    }

    getChildNodeWithType(node: any, type: number) {
        var children = this.getChildrenNodes(node);
        for (var c = 0; c < children.length; c++) {
            if (children[c].attributes.type == type) {
                return children[c];
            }
        }
        return null
    }

    getRootNode(): any {
        return this.jqTree().tree('getRoot');
    }

    getParentNode(node): any {
        return this.jqTree().tree('getParent', node.target);
    }

    getChildrenNodes(node): any {
        return this.jqTree().tree('getChildren', node.target);
    }

    beginEdit(node: any): void {
        this.jqTree().tree('beginEdit', node.target);
    }

    appendNode(parent: any, text: string, obj: any, type: number, onclick: any): void {
        this.jqTree().tree('append', {
            parent: parent.target,
            data: [{id: TreeController.nodeCounter++, text: text, attributes: {object: obj, type: type, onclick: onclick}}]
        });
    }

    removeNode(): void {
        var node = this.getSelectedNode();
        this.jqTree().tree('remove', node.target);
    }

    renameNode(): void {
        var node = this.getSelectedNode();
        this.oldName = node.text;
        this.jqTree().tree('beginEdit', node.target);
    }

    resetNodeName() {
        var node = this.getSelectedNode();
        this.jqTree().tree('update', {
            target: node.target,
            text: this.oldName
        });
    }

    expandNode(): void {
        var node = this.getSelectedNode();
        this.jqTree().tree('expand', node.target);
    }

    collapseNode(node): void {
        this.jqTree().tree('collapse', node.target);
    }

    expandAll(): void {
        this.jqTree().tree('expandAll');
    }

    collapseAll(): void {
        this.jqTree().tree('collapseAll');
    }

    /**
     * run on AfterEdit
     */
    updateNodeName(): void {
        var node = this.getSelectedNode();
        var type = this.nodeType(node);
        if ( type == TreeController.EXPERIMENT_NODE )
            wrc.experimentController.renameExperiment(this.oldName, node.text);
        else if ( type == TreeController.WELL_SET_NODE ) {
            this.nodeObject(node).setName(this.oldName, node.text);
            this.wrc.plotSelector.refreshWellSets();
        }
    }

// ---------------------------------------------------------------------------------------------
// tree description

    /**
     * Tree constructor
     */
    tree(): any {
        var experiments = this.wrc.experiments.map(function(e) {
            return {
                "id": TreeController.nodeCounter++, "text": e, "state": "closed",
                "attributes": {"object": e, "type": TreeController.EXPERIMENT_NODE, "iconCls": "icon-experiment", "onclick":
                    function() {
                        wrc.treeController.selectExperiment(e);
                    }
                },
                "children":  [
                    {"id": TreeController.nodeCounter++, "text": "Info", "iconCls": "icon-info",
                        "attributes": {"object": null, "type": TreeController.EXPERIMENT_INFO_NODE, "onclick":
                            function() {new ExperimentInfoController(wrc, "experiment-info").showView();}
                        }
                    },
                    {"id": TreeController.nodeCounter++, "text": "Parameters", "iconCls": "icon-settings",
                        "attributes": {"object": null, "type": TreeController.GLOBAL_PARAMETERS_NODE, "onclick":
                            function() {
                                wrc.experimentParametersController = new ExperimentParametersController(wrc);
                                wrc.experimentParametersController.showView();}
                        }
                    },
                    {"id": TreeController.nodeCounter++, "text": "Background", "iconCls": "icon-background",
                        "attributes": {"object": null, "type": TreeController.BACKGROUND_DEFINITION_NODE, "onclick":
                            function() {wrc.treeController.expandNode();}
                        }
                    },
                    {"id": TreeController.nodeCounter++, "text": "Outliers", "iconCls": "icon-outliers",
                        "attributes": {"object": null, "type": TreeController.OUTLIER_DETECTION_NODE, "onclick":
                            function() {console.log(wrc.treeController.getSelectedNode()); /*wrc.treeController.expandNode();*/}
                        }
                    },
                    {"id": TreeController.nodeCounter++, "text": "Plots", "iconCls": "icon-plot",
                        "attributes": {"object": null, "type": TreeController.PLOTS_NODE, "onclick":
                            function() {this.wrc.plotController.showView();}
                        }
                    }
                ]
            }
        }, this);
        return [{"id": 0, "text": "Experiments", "attributes": {"object": null, "type": TreeController.EXPERIMENTS_NODE, "onclick":
                    function() {wrc.treeController.expandNode();}}, "children": experiments}];
    }

// ---------------------------------------------------------------------------------------------
// WellReader operations associated with tree node click handling

    /**
     * Select and open experiment expName in the tree
     */
    selectExperiment(expName): void {
        if ( this.wrc.experimentController.experimentName != expName ) {

            var rootNode = this.getRootNode();
            var nodes = this.getChildrenNodes(rootNode);

            // collapse node of previous selected experiment
            for (var c = 0; c < nodes.length; c++) {
                if ( this.wrc.experimentController.experimentName == nodes[c].text ) {
                    this.collapseNode(nodes[c]);
                    break;
                }
            }

            this.wrc.experimentController.loadExperiment(expName);
        }
    }

    /**
     * Delete selected experiment
     */
    deleteExperiment(): void {
        wrc.experimentController.deleteExperiment(this.getSelectedNode().text);
        this.removeNode();
    }

    /**
     * Download selected experiment
     */
    downloadExperiment(): void {
        new ExperimentController(this.wrc).downloadExperiment(this.getSelectedNode().text);
    }

    /**
     * Export a zip file containing computed data
     */
    exportCurves(): void {
        wrc.experimentController.exportCurves();
    }

    /**
     * Create a new WellSet
     */
    appendWellSet(): void {

        this.oldName = this.wrc.wr.generateUniqueName("wellSet", "New wellSet");
        var ws = new WellSet(this.wrc, this.oldName);

        var node = this.getSelectedNode();
        this.appendNode(node.target, this.oldName, ws, TreeController.WELL_SET_NODE, function() {wrc.treeController.modifyWellSet();});
        var newNode = this.findNode(TreeController.nodeCounter - 1);
        this.selectNode(newNode); // otherwise parent node remains selected
        this.beginEdit(newNode);
    }

    /**
     * Modify selected WellSet
     */
    modifyWellSet(): void {
        var node = this.getSelectedNode();
        var ws = this.nodeObject(node);
        wrc.wellSetController = new WellSetController(wrc, "well-set-microplate", ws);
        wrc.wellSetController.showView();
    }

    /**
     * Delete selected WellSet
     */
    deleteWellSet(): void {
        var node = this.getSelectedNode();
        var ws: WellSet = this.nodeObject(node);
        this.wrc.wr.removeWellSet(ws);

        this.removeNode();
        wrc.wellSetController.closeView();
    }
}