///<reference path="WellInverterController.ts" />

declare var $: JQueryStatic;

/**
 * Class for handling experiment info. Associated view is experiment-info.html
 */
class ExperimentInfoController {

    /**
     * WellInverterController associated with me
     */
    public wic: WellInverterController;

    /**
     * id of the div containing experiment info in the view
     */
    public experimentInfoDivId: string;

    /**
     * Constructor
     */
    constructor(wic: WellInverterController, experimentInfoDivId: string) {
        this.wic = wic;
        this.experimentInfoDivId = experimentInfoDivId;
    }

    /**
     * Display experiment info in tab
     */
    showView(): void {
        this.wic.tabController.showTab(TabController.EXPERIMENT_INFO_TAB);
        var eic: ExperimentInfoController = this;
        $("#experiment-info").livequery(function(){ eic.generateInfo();});
    }

    /**
     * Generate HTML code from experiment info
     */
    generateInfo(): void {
        var wr = this.wic.wr;
        var s = "Initial time: " + wr.initialTime;
        var p = 0;

        for (var prog in wr.programs) {
            if ( wr.programs.hasOwnProperty(prog) ) {
                s += "<h3>" + wr.programs[prog]["Name"] + "</h3>";
                var progs = wr.programs[prog];
                for (var key in progs) {
                    if ( progs.hasOwnProperty(key) && key != "Name" )
                        s += key + ": " + progs[key] + '<br>';
                }
                p++;
            }
        }
        $('#'+ this.experimentInfoDivId).html(s);
    }
}
