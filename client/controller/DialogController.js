///<reference path="WellReaderController.ts" />
///<reference path="WindowController.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Class controlling dialog boxes
 */
var DialogController = (function (_super) {
    __extends(DialogController, _super);
    /**
     * Constructor
     */
    function DialogController(wrc, content) {
        _super.call(this, wrc, null);
        this.content = content;
    }
    /**
     * Display dialog
     */
    DialogController.prototype.open = function (params) {
        this.jqWindow().html("<div style='text-align: center; margin-top: 20px'>" + this.content + "</div><div style='text-align: center; margin-top: 50px; margin-bottom: 10px'><input type='button' value='Close' onclick='$(\"#window\").window(\"close\");'></div>");
        if (params != null)
            this.jqWindow().window(params);
        this.jqWindow().window('center');
        this.jqWindow().window('open');
    };
    /**
     * Close dialog
     */
    DialogController.prototype.close = function () {
        this.jqWindow().window('close');
    };
    return DialogController;
})(WindowController);
//# sourceMappingURL=DialogController.js.map