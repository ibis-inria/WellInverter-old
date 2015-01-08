///<reference path="../jquery.d.ts" />
///<reference path="WellReaderController.ts" />
///<reference path="BackgroundDefinitionController.ts" />

declare var wrc: WellReaderController;
/**
 * Class controlling well sets. A WellSet is a names set of wells
 * Associated view is well-set-definition.html
 *
 * This class extends BackgroundDefinitionController because it appears to be a variation of the latter.
 * Subclassing is not really appropriate here.
 */
class WellSetController extends BackgroundDefinitionController {

    /**
     * WellSet associated with me
     */
    wellSet: WellSet;

    /**
     * Constructor
     */
    constructor(wrc: WellReaderController, canvasContainerId: string, wellSet: WellSet) {
        super(wrc, null, canvasContainerId);
        this.wellSet = wellSet;
        this.selectionMode = BackgroundDefinitionController.WELLS_SELECTION_MODE;

        this.wellSet.wells.forEach(
            function(w) {
                this.selected[w.getLine()][w.getColumn()] = true;
            }, this
        );
    }

    /**
     * Handle click on "define" button
     */
    defineSetClickHandler() {
        var wells = [];
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++)  {
                if ( this.selected[l][c] ) {
                    wells.push(this.wrc.wr.getWell(l*12+c));
                }
            }
        }
        this.wellSet.wells = wells;

        this.wrc.tabController.closeSelectedTab();
        this.wrc.plotSelector.refreshWellSets();
    }

    /**
     * Display Outlier detection tab
     */
    showView(): void {

        // because ID in HTML code need to be unique
        this.closeExistingMicroplateViews();

        this.wrc.tabController.showTab(TabController.WELL_SET_DEFINITION_TAB, this.wellSet);

        // init view
        $("#well-set-microplate").livequery(function(){ // livequery() waits for view complete loading
            wrc.wellSetController.draw();
            $('#well-set-tip').html(
                "1. Select the wells in the wells set: click a well, a column name or a line name or draw rectangular selection.<br>" +
                "2. Click the 'Define set' button.");
            wrc.wellSetController.initMouseHandler();
        });
    }

    /**
     * Close Well set definition tab
     */
    closeView(): void {
        var tc = this.wrc.tabController;
        if ( tc.existsTab(TabController.WELL_SET_DEFINITION_TAB, this.wellSet) ) {
            tc.selectTab(TabController.WELL_SET_DEFINITION_TAB, this.wellSet);
            tc.closeSelectedTab();
        }
        this.wrc.plotSelector.refreshWellSets();
    }
}
