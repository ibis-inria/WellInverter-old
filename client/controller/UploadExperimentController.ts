///<reference path="WellReaderController.ts" />
///<reference path="WindowController.ts" />

declare var $: JQueryStatic;

/**
 * Class handling experiment upload
 */
class UploadExperimentController extends WindowController {

    /**
     * Constructor
     */
    constructor(wrc: WellReaderController, url: string, title: string) {
        super(wrc, url);
        this.jqWindow().window({title: title, width: 600, height: 250});
        var jqForm: any = $('#form-upload');
        jqForm.form({
            onSubmit: function(){
            // do some check
            // return false to prevent submit;
            },
            success:function(){
            }
        });
        // submit the form
        jqForm.submit();
    }
}