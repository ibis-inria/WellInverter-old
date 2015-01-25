///<reference path="../easyui.d.ts" />
///<reference path="WellInverterController.ts" />
/**
 * Class controlling a JQuery easyUI window
 */
var WindowController = (function () {
    /**
     * Constructor
     */
    function WindowController(wic, url, content) {
        this.wic = wic;
        this.windowId = "window";
        this.url = url;
        this.content = url;
    }
    /**
     * Return JQuery object associated with window div
     */
    WindowController.prototype.jqWindow = function () {
        return $('#' + this.windowId);
    };
    /**
     * Display window
     * @param params JQuery easyUI parameters
     */
    WindowController.prototype.open = function (params) {
        if (this.url != null)
            this.jqWindow().load(this.url);
        else
            this.jqWindow().html(this.content);
        if (params != null)
            this.jqWindow().window(params);
        this.jqWindow().window('center');
        this.jqWindow().window('open');
    };
    /**
     * Close window
     */
    WindowController.prototype.close = function () {
        this.jqWindow().window('close');
    };
    return WindowController;
})();
//# sourceMappingURL=WindowController.js.map