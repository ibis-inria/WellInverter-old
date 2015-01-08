///<reference path="WellReaderController.ts" />
///<reference path="TabController.ts" />
/**
 * Class for handling help
 */
var HelpController = (function () {
    /**
     * Constructor
     */
    function HelpController(wrc) {
        this.wrc = wrc;
    }
    /**
     * Display help about active tab in a new help tab
     */
    HelpController.prototype.showView = function () {
        var tc = this.wrc.tabController;
        if (tc.existsTab(TabController.HELP_TAB))
            tc.closeTab(TabController.HELP_TAB);
        var selTab = tc.selectedTab();
        tc.showTab(TabController.HELP_TAB);
        $("#help").livequery(function () {
            $('.section').each(function () {
                $(this).show();
            });
            if (selTab != null) {
                var url = tc.getDisplayedTabUrl(selTab);
                var urlDivId = url.replace(".html", "-section");
                $('.section').each(function () {
                    $(this).hide();
                });
                $('#' + urlDivId).show();
            }
        });
    };
    return HelpController;
})();
//# sourceMappingURL=HelpController.js.map