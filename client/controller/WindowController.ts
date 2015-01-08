///<reference path="../easyui.d.ts" />
///<reference path="WellReaderController.ts" />

declare var $: JQueryStatic;

/**
 * Class controlling a JQuery easyUI window
 */
class WindowController {

    /**
     * WellReaderController associated with me
     */
    public wrc: WellReaderController;

    /**
     * id of the div containing the window
     */
    windowId: string;

    /**
     * URL of the HTML page displayed in the window. null if no URL associated
     */
    url: string;

    /**
     * As alternative to 'url', content allows one to specify HTML content
     */
    content: string;

    /**
     * Constructor
     */
    constructor(wrc: WellReaderController, url: string, content?: string) {
        this.wrc = wrc;
        this.windowId = "window";
        this.url = url;
        this.content = url;
    }

    /**
     * Return JQuery object associated with window div
     */
    jqWindow(): any {
        return <any>$('#' + this.windowId);
    }

    /**
     * Display window
     * @param params JQuery easyUI parameters
     */
    open(params?: any): void {
        if ( this.url != null )
            this.jqWindow().load(this.url);
        else this.jqWindow().html(this.content);

        if ( params != null)
            this.jqWindow().window(params);
        this.jqWindow().window('center');
        this.jqWindow().window('open');
    }

    /**
     * Close window
     */
    close(): void {
        this.jqWindow().window('close');
    }
}
