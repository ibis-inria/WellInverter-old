///<reference path="WellReaderController.ts" />
/**
 * Class for handling experiment info. Associated view is experiment-info.html
 */
var ExperimentInfoController = (function () {
    /**
     * Constructor
     */
    function ExperimentInfoController(wrc, experimentInfoDivId) {
        this.wrc = wrc;
        this.experimentInfoDivId = experimentInfoDivId;
    }
    /**
     * Display experiment info in tab
     */
    ExperimentInfoController.prototype.showView = function () {
        this.wrc.tabController.showTab(TabController.EXPERIMENT_INFO_TAB);
        var eic = this;
        $("#experiment-info").livequery(function () {
            eic.generateInfo();
        });
    };
    /**
     * Generate HTML code from experiment info
     */
    ExperimentInfoController.prototype.generateInfo = function () {
        var wr = this.wrc.wr;
        var s = "Initial time: " + wr.initialTime;
        var p = 0;
        for (var prog in wr.programs) {
            if (wr.programs.hasOwnProperty(prog)) {
                s += "<h3>" + wr.programs[prog]["Name"] + "</h3>";
                var progs = wr.programs[prog];
                for (var key in progs) {
                    if (progs.hasOwnProperty(key) && key != "Name")
                        s += key + ": " + progs[key] + '<br>';
                }
                p++;
            }
        }
        $('#' + this.experimentInfoDivId).html(s);
    };
    return ExperimentInfoController;
})();
//# sourceMappingURL=ExperimentInfoController.js.map