///<reference path='../model/WellReader.ts'/>
///<reference path='TreeController.ts'/>
///<reference path='TabController.ts'/>
///<reference path='AuthenticationController.ts'/>
///<reference path='PlotSelector.ts'/>
///<reference path='PlotController.ts'/>
///<reference path='OutlierDetectionController.ts'/>
///<reference path='BackgroundDefinitionController.ts'/>
///<reference path='ExperimentController.ts'/>
///<reference path='WellSetController.ts'/>
///<reference path='HelpController.ts'/>
/**
 * Application controller
 */
var WellReaderController = (function () {
    /**
     * Constructor
     */
    function WellReaderController() {
        this.config = {
            "wellfarePort": "9999"
        };
        this.wr = new WellReader();
        this.treeController = new TreeController(this, 'tree-container');
        this.tabController = new TabController(this, 'tabs-container');
        this.authenticationController = new AuthenticationController(this);
        this.plotController = new PlotController(this);
        this.outlierDetectionController = new OutlierDetectionController(this);
        this.experimentController = new ExperimentController(this);
        this.experimentParametersController = new ExperimentParametersController(this);
        this.helpController = new HelpController(this);
        if (!this.authenticationController.isAuthenticated())
            this.authenticationController.authenticate();
        else
            this.init();
    }
    /**
     * Initialize
     */
    WellReaderController.prototype.init = function () {
        this.getExperiments(); // otherwise may be problematic (sync load)
        this.tabController.closeAllTabs();
        this.treeController.init();
    };
    /**
     * Refresh view
     * @param experimentName
     */
    WellReaderController.prototype.refresh = function (experimentName) {
        wrc.treeController.init();
        wrc.treeController.selectExperiment(experimentName);
        wrc.tabController.closeAllTabs();
    };
    /**
     * Compute and return the set of available experiment names for current user
     */
    WellReaderController.prototype.getExperiments = function () {
        this.experimentController.experimentsList();
        if (Session.getUserName() != "")
            return this.experiments;
        else
            return [];
    };
    /**
     * Show help page in a tab
     * @param helpPage URL of help page
     */
    WellReaderController.prototype.help = function (helpPage) {
        this.tabController.showTab(helpPage);
    };
    return WellReaderController;
})();
//# sourceMappingURL=WellReaderController.js.map