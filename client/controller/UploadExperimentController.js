///<reference path="WellReaderController.ts" />
///<reference path="WindowController.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Class handling experiment upload
 */
var UploadExperimentController = (function (_super) {
    __extends(UploadExperimentController, _super);
    /**
     * Constructor
     */
    function UploadExperimentController(wrc, url, title) {
        _super.call(this, wrc, url);
        this.jqWindow().window({ title: title, width: 600, height: 250 });
        var jqForm = $('#form-upload');
        jqForm.form({
            onSubmit: function () {
                // do some check
                // return false to prevent submit;
            },
            success: function () {
            }
        });
        // submit the form
        jqForm.submit();
    }
    return UploadExperimentController;
})(WindowController);
//# sourceMappingURL=UploadExperimentController.js.map