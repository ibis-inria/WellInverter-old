///<reference path="WellReaderController.ts" />
///<reference path="UploadExperimentController.ts" />
/**
 * Class controlling context menu launched with right click in Tree
 */
var ContextMenuController = (function () {
    /**
     * Constructor
     */
    function ContextMenuController(wrc, contextMenuContainerId) {
        /**
         * Array giving for each tree node type the list of options of the context menu
         */
        this.contextMenu = [];
        this.wrc = wrc;
        this.contextMenuContainerId = contextMenuContainerId;
        // method clear on menus: remove every options
        $.extend($.fn.menu.methods, {
            clear: function (jq) {
                return jq.each(function () {
                    var m = $(this);
                    var children = m.children('div.menu-item');
                    children.each(function () {
                        m.menu('removeItem', this);
                    });
                });
            }
        });
        for (var i = 0; i <= TreeController.RLU_PLOTS_NODE; i++)
            this.contextMenu[i] = [];
        this.contextMenu[TreeController.EXPERIMENTS_NODE] = [
            { text: 'Upload a Well Reader (JSON) experiment file', onclick: function () {
                new UploadExperimentController(wrc, "upload-json.html", "Upload JSON experiment file").open();
            }, iconCls: 'icon-reload' },
            { text: 'Upload a Tecan Excel (XLSX) experiment file', onclick: function () {
                new UploadExperimentController(wrc, "upload-xlsx-tecan.html", "Upload Tecan experiment").open();
            }, iconCls: 'icon-reload' }
        ];
        this.contextMenu[TreeController.EXPERIMENT_NODE] = [
            { text: 'Download Well Reader (JSON) experiment file', onclick: function () {
                wrc.treeController.downloadExperiment();
            }, iconCls: 'icon-save' },
            { text: 'Export computed data', onclick: function () {
                wrc.treeController.exportCurves();
            }, iconCls: 'icon-redo' },
            { text: 'Rename experiment', onclick: function () {
                wrc.treeController.renameNode();
            }, iconCls: 'icon-sum' },
            { text: 'Delete experiment', onclick: function () {
                wrc.treeController.deleteExperiment();
            }, iconCls: 'icon-no' }
        ];
        this.contextMenu[TreeController.WELL_SETS_NODE] = [
            { text: 'New WellSet', onclick: function () {
                wrc.treeController.appendWellSet();
            }, iconCls: 'icon-add' }
        ];
        this.contextMenu[TreeController.WELL_SET_NODE] = [
            { text: 'Modify well set', onclick: function () {
                wrc.treeController.modifyWellSet();
            }, iconCls: 'icon-edit' },
            { text: 'Rename well set', onclick: function () {
                wrc.treeController.renameNode();
            }, iconCls: 'icon-sum' },
            { text: 'Delete well set', onclick: function () {
                wrc.treeController.deleteWellSet();
            }, iconCls: 'icon-no' }
        ];
    }
    /**
     * Return JQuery object associated with div containing the context menu
     */
    ContextMenuController.prototype.jqContextMenu = function () {
        return $('#' + this.contextMenuContainerId);
    };
    /**
     * Build menu associated with tree node.
     * Return true iff built menu contains at least one option.
     */
    ContextMenuController.prototype.buildMenu = function (node) {
        var options = this.contextMenu[this.wrc.treeController.nodeType(node)];
        this.jqContextMenu().menu('clear');
        options.forEach(function (o) {
            this.jqContextMenu().menu('appendItem', o);
        }, this); // this necessary
        return (options.length > 0);
    };
    /**
     * Display context menu associated with tree node.
     * @param e launching event
     * @param node tree node
     */
    ContextMenuController.prototype.show = function (e, node) {
        e.preventDefault();
        this.wrc.treeController.selectNode(node);
        if (this.buildMenu(node))
            this.jqContextMenu().menu('show', { left: e.pageX, top: e.pageY });
    };
    return ContextMenuController;
})();
//# sourceMappingURL=ContextMenuController.js.map