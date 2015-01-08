///<reference path="../jquery.d.ts" />
///<reference path="../model/WellReader.ts" />
///<reference path="WellReaderController.ts" />

class TabController {

    // Different types of tab
    static EXPERIMENT_INFO_TAB = 0;
    static GLOBAL_PARAMETERS_TAB = 1;
    static BACKGROUND_DEFINITION_TAB = 2;
    static PLOTS_TAB = 3;
    static WELL_SET_DEFINITION_TAB = 4;
    static OUTLIER_DETECTION_TAB = 5;
    static DATA_FIT_TAB = 6;
    static HELP_TAB = 7;

    /**
     * Title of each tab
     */
    static tabTitle = [
        "Experiment info.",
        "Experimental parameters",
        "Background definition",
        "Plots",
        "WellSet definition",
        "Outliers detection",
        "Data fit",
        "Help"
    ];

    /**
     * URL of each tab
     */
    static tabUrl = [
        "experiment-info.html",
        "experiment-parameters.html",
        "background-definition.html",
        "plot.html",
        "well-set-definition.html",
        "outlier-detection.html",
        "data-fit.html",
        "help.html"
    ];

    /**
     * WellReaderController associated with me
     */
    wrc: WellReaderController;

    /**
     * Object associated with the tab
     */
    object = null;

    /**
     * id of the tabs container div
     */
    tabContainerId: string;


    /**
     * Constructor
     */
    constructor(wrc: WellReaderController, tabContainerId: string) {
        this.wrc = wrc;
        this.tabContainerId = tabContainerId;

        var tc = this;
        this.jqTabs().tabs({
            onSelect: function(title) {
                    wrc.plotSelector.setVisibility("plot-selector", title == TabController.tabTitle[TabController.PLOTS_TAB] || title == TabController.tabTitle[TabController.OUTLIER_DETECTION_TAB]);
                },
            onClose:  function() {if ( tc.jqTabs().tabs('tabs').length == 0 ) wrc.plotSelector.setVisibility("plot-selector", false);}
        });
    }

    /**
     * JQuery object associated with the tabs container div
     */
    jqTabs(): any {
        return $('#'+this.tabContainerId);
    }

    /**
     * Return true iff tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    existsTab(tabType: number, param?: any) {
        var title = this.getTabTitle(tabType, param);
        return ( this.jqTabs().tabs('exists', title) );
    }

    /**
     * Select tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    selectTab(tabType: number, param: any) {
        var title = this.getTabTitle(tabType, param);
        if ( this.jqTabs().tabs('exists', title) ) {
            this.jqTabs().tabs('select', title);
        }
    }

    /**
     * Return title of tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    getTabTitle(tabType: number, param: any): any {
        return ( param != null ? param.name + ' / ' : "" ) + TabController.tabTitle[tabType];
    }

    /**
     * Return URL of tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     */
    getTabUrl(tabType: number) {
        return TabController.tabUrl[tabType];
    }

    /**
     * Open/display tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param
     */
    showTab(tabType, param?): void {
        if ( param != null ) {
            this.object = param;
        }
        var title = this.getTabTitle(tabType, param);
        var url = this.getTabUrl(tabType);

        if ( this.jqTabs().tabs('exists', title) )
            this.jqTabs().tabs('select', title);
        else {
            this.jqTabs().tabs('add',{ title: title, href: url , closable: true });
        }
    }

    /**
     * Return the title of a displayed tab
     */
    getDisplayedTabTitle(tab: any) {
        return tab.panel('options').title;
    }

    /**
     * Return the URL of a displayed tab
     */
    getDisplayedTabUrl(tab: any) {
        return tab.panel('options').href;
    }

    /**
     * returns selected tab, if any, null otherwise
     */
    selectedTab(): any {
        return this.jqTabs().tabs('getSelected');
    }

    /**
     * Close selected tab
     */
    closeSelectedTab(): void {
        var tab = this.jqTabs().tabs('getSelected');
        var index = this.jqTabs().tabs('getTabIndex',tab);
        this.jqTabs().tabs('close', index);
    }

    /**
     * Close tab with type and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    closeTab(tabType, param?): void {
        if ( param != null )
            this.object = param;
        var title = this.getTabTitle(tabType, param);

        if ( this.jqTabs().tabs('exists', title) )
            this.jqTabs().tabs('close', title);
    }

    /**
     * Close all tabs
     */
    closeAllTabs(): void {
        var count = this.jqTabs().tabs('tabs').length;
        for(var i = count-1; i >= 0; i--)
            this.jqTabs().tabs('close', i);
    }
}
