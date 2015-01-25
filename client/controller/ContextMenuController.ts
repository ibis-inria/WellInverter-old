///<reference path="WellInverterController.ts" />
///<reference path="UploadExperimentController.ts" />

/**
 * Class controlling context menu launched with right click in Tree
 */
class ContextMenuController {

    /**
     * Array giving for each tree node type the list of options of the context menu
     */
    contextMenu: any[] = [];

    /**
     * WellInverterController associated with me
     */
    wic: WellInverterController;

    /**
     * id of the div containing the context menu
     */
    contextMenuContainerId: string;

    /**
     * Constructor
     */
    constructor(wic: WellInverterController, contextMenuContainerId: string) {
        this.wic = wic;
        this.contextMenuContainerId = contextMenuContainerId;

        // method clear on menus: remove every options
        $.extend($.fn.menu.methods,{
            clear: function(jq){
                return jq.each(function(){
                    var m: any = $(this);
                    var children: any = m.children('div.menu-item');
                    children.each(function(){
                        m.menu('removeItem',this);
                    });
                });
            }
        });

        // construction of context menu
        for (var i = 0; i <= TreeController.RLU_PLOTS_NODE; i++)
            this.contextMenu[i] = [];
        this.contextMenu[TreeController.EXPERIMENTS_NODE] = [
           /* {text: 'Upload a WellInverter XML experiment file', onclick: function(){new UploadExperimentController(wic, "upload-xml-experiment.html", "Upload WellInverter experiment").open();}, iconCls:'icon-reload'},
            {text: 'Upload a Fusion CSV experiment file', onclick: function(){new UploadExperimentController(wic, "upload-csv-fusion.html", "Upload Fusion experiment").open();}, iconCls:'icon-reload'},*/
            {text: 'Upload a WellInverter (JSON) experiment file', onclick: function(){new UploadExperimentController(wic, "upload-json.html", "Upload JSON experiment file").open();}, iconCls:'icon-reload'},
            {text: 'Upload a Tecan Excel (XLSX) data file', onclick: function(){new UploadExperimentController(wic, "upload-xlsx-tecan.html", "Upload Tecan experiment").open();}, iconCls:'icon-reload'}
        ];
        this.contextMenu[TreeController.EXPERIMENT_NODE] = [
            {text: 'Download a WellInverter (JSON) experiment file', onclick: function(){wic.treeController.downloadExperiment();}, iconCls:'icon-save'},
            {text: 'Export data and analysis results', onclick: function(){wic.treeController.exportCurves();}, iconCls:'icon-redo'},
            {text: 'Rename experiment', onclick: function(){wic.treeController.renameNode();}, iconCls:'icon-sum'},
            {text: 'Delete experiment', onclick: function(){wic.treeController.deleteExperiment();}, iconCls:'icon-no'}
        ];
        this.contextMenu[TreeController.WELL_SETS_NODE] = [
            {text: 'New WellSet', onclick: function(){wic.treeController.appendWellSet();}, iconCls:'icon-add'}
        ];
        this.contextMenu[TreeController.WELL_SET_NODE] = [
            {text: 'Modify well set', onclick: function(){wic.treeController.modifyWellSet();}, iconCls:'icon-edit'},
            {text: 'Rename well set', onclick: function(){wic.treeController.renameNode();}, iconCls:'icon-sum'},
            {text: 'Delete well set', onclick: function(){wic.treeController.deleteWellSet();}, iconCls:'icon-no'}
        ];
    }

    /**
     * Return JQuery object associated with div containing the context menu
     */
    jqContextMenu(): any {
        return <any>$('#' + this.contextMenuContainerId);
    }

    /**
     * Build menu associated with tree node.
     * Return true iff built menu contains at least one option.
     */
    buildMenu(node): boolean {
       var options = this.contextMenu[this.wic.treeController.nodeType(node)];
       this.jqContextMenu().menu('clear');
       options.forEach(function(o) {
               this.jqContextMenu().menu('appendItem', o);
       }, this); // this necessary
       return ( options.length > 0 );
    }

    /**
     * Display context menu associated with tree node.
     * @param e launching event
     * @param node tree node
     */
    show(e, node): void {
        e.preventDefault();
        this.wic.treeController.selectNode(node);
        if ( this.buildMenu(node) )
            this.jqContextMenu().menu('show', {left: e.pageX, top: e.pageY});
    }
}

