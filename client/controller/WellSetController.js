///<reference path="../jquery.d.ts" />
///<reference path="WellInverterController.ts" />
///<reference path="BackgroundDefinitionController.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Class controlling well sets. A WellSet is a names set of wells
 * Associated view is well-set-definition.html
 *
 * This class extends BackgroundDefinitionController because it appears to be a variation of the latter.
 * Subclassing is not really appropriate here.
 */
var WellSetController = (function (_super) {
    __extends(WellSetController, _super);
    /**
     * Constructor
     */
    function WellSetController(wic, canvasContainerId, wellSet) {
        _super.call(this, wic, null, canvasContainerId);
        this.wellSet = wellSet;
        this.selectionMode = BackgroundDefinitionController.WELLS_SELECTION_MODE;
        this.wellSet.wells.forEach(function (w) {
            this.selected[w.getLine()][w.getColumn()] = true;
        }, this);
    }
    /**
     * Handle click on "define" button
     */
    WellSetController.prototype.defineSetClickHandler = function () {
        var wells = [];
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                if (this.selected[l][c]) {
                    wells.push(this.wic.wr.getWell(l * 12 + c));
                }
            }
        }
        this.wellSet.wells = wells;
        this.wic.tabController.closeSelectedTab();
        this.wic.plotSelector.refreshWellSets();
    };
    /**
     * Display Outlier detection tab
     */
    WellSetController.prototype.showView = function () {
        // because ID in HTML code need to be unique
        this.closeExistingMicroplateViews();
        this.wic.tabController.showTab(TabController.WELL_SET_DEFINITION_TAB, this.wellSet);
        // init view
        $("#well-set-microplate").livequery(function () {
            wic.wellSetController.draw();
            $('#well-set-tip').html("1. Select the wells in the wells set: click a well, a column name or a line name or draw rectangular selection.<br>" + "2. Click the 'Define set' button.");
            wic.wellSetController.initMouseHandler();
        });
    };
    /**
     * Close Well set definition tab
     */
    WellSetController.prototype.closeView = function () {
        var tc = this.wic.tabController;
        if (tc.existsTab(TabController.WELL_SET_DEFINITION_TAB, this.wellSet)) {
            tc.selectTab(TabController.WELL_SET_DEFINITION_TAB, this.wellSet);
            tc.closeSelectedTab();
        }
        this.wic.plotSelector.refreshWellSets();
    };
    return WellSetController;
})(BackgroundDefinitionController);
//# sourceMappingURL=WellSetController.js.map