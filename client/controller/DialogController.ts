///<reference path="WellInverterController.ts" />
///<reference path="WindowController.ts" />

declare var $: JQueryStatic;

/**
 * Class controlling dialog boxes
 */
class DialogController extends WindowController {

    /**
     * HTML Content of the dialog
     */
    content: string;

    /**
     * Constructor
     */
    constructor(wic: WellInverterController, content: string) {
        super(wic, null);
        this.content = content;
    }

    /**
     * Display dialog
     */
    open(params?: any): void {
        this.jqWindow().html("<div style='text-align: center; margin-top: 20px'>" + this.content + "</div><div style='text-align: center; margin-top: 50px; margin-bottom: 10px'><input type='button' value='Close' onclick='$(\"#window\").window(\"close\");'></div>");

        if ( params != null)
            this.jqWindow().window(params);
        this.jqWindow().window('center');
        this.jqWindow().window('open');
    }

    /**
     * Close dialog
     */
    close(): void {
        this.jqWindow().window('close');
    }
}

