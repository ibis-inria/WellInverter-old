///<reference path="WellInverterController.ts" />

declare var $: JQueryStatic;

/**
 * Class for handling experiment parameters. Associated view is experiment-parameters.html
 */
class ExperimentParametersController {

    /**
     * list of params. each of these params is duplicated for each measure subtype
     * Additionally, default value for each measure subtype param depends only on measure type (abs, RFU, RLU)
     */
    subtypeParameters = ["outlier_marks_tolerance", "percentile_above", "percentile_below", "niter_above", "niter_below", "goal_above",
        "goal_below", "smoothing_win", "nstd", "background_value"];

    // 1st value: fluo; 2nd value: RFU; 3rd value: RLU
    defaultValues = {
        outlier_marks_tolerance: [0.1, 10, 10],
        percentile_above: [50, 90, 0],
        percentile_below: [50, 90, 0],
        niter_above: [4, 2, 0],
        niter_below: [3, 2, 0],
        goal_above: [0.001, 1, 0],
        goal_below: [0.001, 5, 0],
        smoothing_win: [4, 4, 4],
        nstd: [1, 1.5, 0],
        background_value: [0, 0, 0]
    };

    /**
     * WellInverterController associated with me
     */
    wic: WellInverterController;

    /**
     * Constructor
     */
    constructor(wic: WellInverterController) {
        this.wic = wic;
    }

    /**
     * Set parameters value.
     * precondition: current experiment should have measure subtypes
     *
     * A parameter value is set only if it does not already have a value
     */
    setParameters(): void {

        // check that there exist measure subtypes (not strictly required but likely to
        // indicate that this method is called before an experiment is loaded)

        if ( this.wic.wr.measureSubTypes.length == 0 ) {
            throw new Error("Invalid call to ExperimentParametersController.setParameters(): no measure sub-type is defined");
        }

        if ( ! this.wic.wr.experimentParameters.hasOwnProperty("max_shift") ) {
            this.wic.wr.experimentParameters["max_shift"] = 500;
        }

        // duplicate each param for each measure subtype

        for (var i = 0; i < this.wic.wr.measureSubTypes.length; i++) {
            var mst = this.wic.wr.measureSubTypes[i];
            for (var p = 0; p < this.subtypeParameters.length; p++) {
                var key = mst.name + "_" + this.subtypeParameters[p];
                if ( ! this.wic.wr.experimentParameters.hasOwnProperty(key) ) {
                    this.wic.wr.experimentParameters[key] = this.defaultValues[this.subtypeParameters[p]][mst.type];
                }
            }
        }
    }

    /**
     * Set up form for editing experiment parameters
     */
    initForm(): void {

        // validation rules

        $.extend($.fn.validatebox.defaults.rules, {
            numberBetween: {
                validator: function(value,param){
                    return ! isNaN(value) && parseFloat(value) >= parseFloat(param[0]) && parseFloat(value) <= parseFloat(param[1]);
                },
                message: 'Value must be between {0} and {1}'
            }
        });

        // populate form

        for (var p in this.wic.wr.experimentParameters) {
            if (this.wic.wr.experimentParameters.hasOwnProperty(p) )
                $("#" + p).val(this.getParameterValue(p));
        }
    }

    /**
     * Return parameter value
     */
    getParameterValue(p: any): any {
        return this.wic.wr.experimentParameters[p];
    }

    /**
     * Run on "Save" button click
     */
    submitForm(): void {

        // store form data in the model

        for (var p in this.wic.wr.experimentParameters) {
            if (this.wic.wr.experimentParameters.hasOwnProperty(p))
                this.wic.wr.experimentParameters[p] = +($("#" + p).val());   // +: forces conversion to numeric type
        }

        this.wic.tabController.closeSelectedTab();
        this.wic.wr.resetComputedData();
        this.wic.experimentController.saveExperiment();
    }

    /**
     * Show form in tab
     */
    showView(): void {
        this.wic.tabController.showTab(TabController.GLOBAL_PARAMETERS_TAB);
        $("#experiment-parameters").livequery(function(){   // livequery() waits for view complete loading
            wic.experimentParametersController.initForm();
        });
    }

    /**
     * Run on "Cancel" button click
     */
    closeForm(): void {
        this.wic.tabController.closeSelectedTab();
    }
}

