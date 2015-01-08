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

declare var $: JQueryStatic;
declare var wrc: WellReaderController;

/**
 * Application controller
 */
class WellReaderController {

    /**
     * WellReader: model of the application data
     */
    wr: WellReader;

    public config = {
        "wellfarePort": "9999"
    };

    /**
     * Set of available experiment names for current user
     */
    experiments: string[];

    // all controllers are accessible from WellReaderController unique instance

    public experimentController: ExperimentController;

    public treeController: TreeController;

    public tabController: TabController;

    public authenticationController: AuthenticationController;

    public plotSelector: PlotSelector;

    public plotController: PlotController;

    public outlierDetectionController: OutlierDetectionController;

    public backgroundDefinitionController: BackgroundDefinitionController;

    public experimentParametersController: ExperimentParametersController;

    public wellSetController: WellSetController;

    public helpController: HelpController;

    /**
     * Constructor
     */
    constructor() {
        this.wr = new WellReader();

        this.treeController = new TreeController(this, 'tree-container');
        this.tabController = new TabController(this, 'tabs-container');
        this.authenticationController = new AuthenticationController(this);
        this.plotController = new PlotController(this);
        this.outlierDetectionController = new OutlierDetectionController(this);
        this.experimentController = new ExperimentController(this);
        this.experimentParametersController = new ExperimentParametersController(this);
        this.helpController = new HelpController(this);

        if ( ! this.authenticationController.isAuthenticated() )
            this.authenticationController.authenticate();
        else this.init();
    }

    /**
     * Initialize
     */
    init(): void {
        this.getExperiments(); // otherwise may be problematic (sync load)
        this.tabController.closeAllTabs();
        this.treeController.init();
    }

    /**
     * Refresh view
     * @param experimentName
     */
    refresh(experimentName): void {
        wrc.treeController.init();
        wrc.treeController.selectExperiment(experimentName);
        wrc.tabController.closeAllTabs();
    }

    /**
     * Compute and return the set of available experiment names for current user
     */
    getExperiments(): string[] {
        this.experimentController.experimentsList();
        if ( Session.getUserName() != "" )
            return this.experiments;
        else return [];
    }

    /**
     * Show help page in a tab
     * @param helpPage URL of help page
     */
    help(helpPage: string): void {
        this.tabController.showTab(helpPage);
    }
}
