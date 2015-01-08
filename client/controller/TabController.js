///<reference path="../jquery.d.ts" />
///<reference path="../model/WellReader.ts" />
///<reference path="WellReaderController.ts" />
var TabController = (function () {
    /**
     * Constructor
     */
    function TabController(wrc, tabContainerId) {
        /**
         * Object associated with the tab
         */
        this.object = null;
        this.wrc = wrc;
        this.tabContainerId = tabContainerId;
        var tc = this;
        this.jqTabs().tabs({
            onSelect: function (title) {
                wrc.plotSelector.setVisibility("plot-selector", title == TabController.tabTitle[TabController.PLOTS_TAB] || title == TabController.tabTitle[TabController.OUTLIER_DETECTION_TAB]);
            },
            onClose: function () {
                if (tc.jqTabs().tabs('tabs').length == 0)
                    wrc.plotSelector.setVisibility("plot-selector", false);
            }
        });
    }
    /**
     * JQuery object associated with the tabs container div
     */
    TabController.prototype.jqTabs = function () {
        return $('#' + this.tabContainerId);
    };
    /**
     * Return true iff tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    TabController.prototype.existsTab = function (tabType, param) {
        var title = this.getTabTitle(tabType, param);
        return (this.jqTabs().tabs('exists', title));
    };
    /**
     * Select tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    TabController.prototype.selectTab = function (tabType, param) {
        var title = this.getTabTitle(tabType, param);
        if (this.jqTabs().tabs('exists', title)) {
            this.jqTabs().tabs('select', title);
        }
    };
    /**
     * Return title of tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    TabController.prototype.getTabTitle = function (tabType, param) {
        return (param != null ? param.name + ' / ' : "") + TabController.tabTitle[tabType];
    };
    /**
     * Return URL of tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     */
    TabController.prototype.getTabUrl = function (tabType) {
        return TabController.tabUrl[tabType];
    };
    /**
     * Open/display tab with number (id) and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param
     */
    TabController.prototype.showTab = function (tabType, param) {
        if (param != null) {
            this.object = param;
        }
        var title = this.getTabTitle(tabType, param);
        var url = this.getTabUrl(tabType);
        if (this.jqTabs().tabs('exists', title))
            this.jqTabs().tabs('select', title);
        else {
            this.jqTabs().tabs('add', { title: title, href: url, closable: true });
        }
    };
    /**
     * Return the title of a displayed tab
     */
    TabController.prototype.getDisplayedTabTitle = function (tab) {
        return tab.panel('options').title;
    };
    /**
     * Return the URL of a displayed tab
     */
    TabController.prototype.getDisplayedTabUrl = function (tab) {
        return tab.panel('options').href;
    };
    /**
     * returns selected tab, if any, null otherwise
     */
    TabController.prototype.selectedTab = function () {
        return this.jqTabs().tabs('getSelected');
    };
    /**
     * Close selected tab
     */
    TabController.prototype.closeSelectedTab = function () {
        var tab = this.jqTabs().tabs('getSelected');
        var index = this.jqTabs().tabs('getTabIndex', tab);
        this.jqTabs().tabs('close', index);
    };
    /**
     * Close tab with type and parameter
     * @param tabType tab type: see constants at the top of the class
     * @param param parameter
     */
    TabController.prototype.closeTab = function (tabType, param) {
        if (param != null)
            this.object = param;
        var title = this.getTabTitle(tabType, param);
        if (this.jqTabs().tabs('exists', title))
            this.jqTabs().tabs('close', title);
    };
    /**
     * Close all tabs
     */
    TabController.prototype.closeAllTabs = function () {
        var count = this.jqTabs().tabs('tabs').length;
        for (var i = count - 1; i >= 0; i--)
            this.jqTabs().tabs('close', i);
    };
    // Different types of tab
    TabController.EXPERIMENT_INFO_TAB = 0;
    TabController.GLOBAL_PARAMETERS_TAB = 1;
    TabController.BACKGROUND_DEFINITION_TAB = 2;
    TabController.PLOTS_TAB = 3;
    TabController.WELL_SET_DEFINITION_TAB = 4;
    TabController.OUTLIER_DETECTION_TAB = 5;
    TabController.DATA_FIT_TAB = 6;
    TabController.HELP_TAB = 7;
    /**
     * Title of each tab
     */
    TabController.tabTitle = [
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
    TabController.tabUrl = [
        "experiment-info.html",
        "experiment-parameters.html",
        "background-definition.html",
        "plot.html",
        "well-set-definition.html",
        "outlier-detection.html",
        "data-fit.html",
        "help.html"
    ];
    return TabController;
})();
//# sourceMappingURL=TabController.js.map