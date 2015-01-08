///<reference path="../jquery.d.ts" />
///<reference path="../kineticjs.d.ts" />

class MicroplateController {

    // selection modes: wells or background well
    static WELLS_SELECTION_MODE = 1;
    static BACKGROUND_SELECTION_MODE = 2;
    static UNIQUE_SELECTION_MODE = 3;

    // div id of the canvas containing the microplate representation
    public canvasContainerId: string;

    public zoomFactor: number = 1;

    public wellSize: number = 20;

    public delta = 6;

    // selection mode: are we selecting wells or background wells in microplate ? // WELLS_SELECTION_MODE or BACKGROUND_SELECTION_MODE
    public selectionMode: number = 1;  // WELLS_SELECTION_MODE, BACKGROUND_SELECTION_MODE or UNIQUE_SELECTION_MODE

    // array indicating for each well whether it is visible
    public isVisible: boolean[] = new Array(96);

    // array indicating for each well whether it is selected
    public isSelected: boolean[] = new Array(96);

    // background well. null: no selected background well
    public isBackgoundWell: boolean[] = new Array(96);

    // background well. null: no selected background well
    public backgoundWellLabel: string[] = new Array(96);


    constructor(canvasContainerId: string) {
        this.canvasContainerId = canvasContainerId;

        for (var w = 0; w < 96; w++) {
            this.isVisible[w] = false;
            this.isSelected[w] = false;
            this.isBackgoundWell[w] = false;
            this.backgoundWellLabel[w] = null;
        }
    }

    microplateLayerWidth(): number {
        return 12 * this.wellSize + 13 * this.delta;
    }

    microplateLayerHeight(): number {
        return 8 * this.wellSize + 9 * this.delta;
    }

    zoom(val: number): number {
        return  Math.floor(val * this.zoomFactor);
    }

    /**
     * Name: 0 -> A1, 11 -> A12, 12-> B1, ...
     */
    getWellName(wellId: number): string {
        return String.fromCharCode(65 + Math.floor(wellId / 12)) + (wellId % 12 + 1);
    }

    /**
     * Return line index in [0; 7]
     */
    getLine(wellId: number): number {
        return Math.floor(wellId / 12);
    }

    /**
     * return column index in [0; 11]
     */
    getColumn(wellId: number): number {
        return wellId % 12;
    }

    draw(): void {

        var well = new Array(8);

        var stage = new Kinetic.Stage({
            container: this.canvasContainerId,
            width: this.zoom(this.microplateLayerWidth() + 30),
            height: this.zoom(this.microplateLayerHeight() + 30)
        });


        var bgLayer = new Kinetic.Layer();
        stage.add(bgLayer);

        bgLayer.add(new Kinetic.Rect({width: this.zoom(this.microplateLayerWidth() + 30), height: this.zoom(this.microplateLayerHeight() + 30), fill: "#e82"}));

        var fontSize = 12 ;
        for (var l = 0; l < 8; l++) {
            var char = String.fromCharCode(65 + l);
            bgLayer.add(new Kinetic.Text({
                x: this.zoom(5),
                y: this.zoom(20 - fontSize/2 + this.delta + this.wellSize/2 + l * (this.wellSize + this.delta)),
                text: char,
                fontSize: this.zoom(fontSize),
                fontFamily: 'Arial',
                fontStyle: "bold",
                fill: '#333'}));
        }

        for (var c = 0; c < 12; c++) {
            bgLayer.add(new Kinetic.Text({
                x: this.zoom(20 - fontSize/2  + this.delta + this.wellSize/2 + c * (this.wellSize + this.delta)),
                y: this.zoom(5),
                text: "" + (c+1),
                fontSize: this.zoom(fontSize),
                fontFamily: 'Arial',
                fontStyle: "bold",
                fill: '#333'}));
        }

        bgLayer.draw();

        var mpLayer = new Kinetic.Layer({x: this.zoom(20), y: this.zoom(20)});
        stage.add(mpLayer);

        mpLayer.add(new Kinetic.Rect({width: this.zoom(this.microplateLayerWidth()), height: this.zoom(this.microplateLayerHeight()), fill: "#eee"}));
        var mp = this;
        var well = [];
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++) {
                var w = 12 * l + c;
                if ( this.isVisible[w] ) {
                    well[w] = new Kinetic.Circle({
                        x: this.zoom(this.delta + this.wellSize / 2 + c * (this.wellSize + this.delta)),
                        y: this.zoom(this.delta + this.wellSize / 2 + l * (this.wellSize + this.delta)),
                        radius: this.zoom(this.wellSize / 2),
                        stroke: ( this.isBackgoundWell[w] ? 'green' : '#666'),
                        strokeWidth: ( this.isSelected[w] ? 5 : 2 ),
                        fill: ( this.backgoundWellLabel[w] != null ? 'lightgreen' : 'lightgray' )
                    });
                    well[w].w = w;
                    well[w].on('click', function () {mp.clickHandler(this);});
                    mpLayer.add(well[w]);

                    if (this.backgoundWellLabel[w] != null) {
                        var dx = ( this.backgoundWellLabel[w].length >= 3 ? 7 : 4 );
                        mpLayer.add(new Kinetic.Text({
                            x: this.zoom(this.delta - dx + this.wellSize / 2 + c * (this.wellSize + this.delta)),
                            y: this.zoom(this.delta - 4 + this.wellSize / 2 + l * (this.wellSize + this.delta)),
                            text: this.backgoundWellLabel[w],
                            fontSize: 12,
                            fontFamily: 'Arial',
                            fill: 'black'
                        }));
                    }
                }
            }
        }
        mpLayer.draw();

    }

    /**
     * Handle click on the microplate
     */
    clickHandler(well: any): void {
        if ( this.selectionMode == BackgroundDefinitionController.WELLS_SELECTION_MODE )
            this.selected[well.w] = ! this.selected[well.w];
        else if ( this.selectionMode == BACKGROUND_SELECTION_MODE ) {
            this.selectedBackGroundWell = wrc.wr.getWell(12 * w.l + w.c);
            this.setBackgroundWell();
        }
        this.draw();
        this.updateSetBackgroundButtons();
    }

    /**
     * Update the 'disabled' status of 'Set background' and 'Unset background' buttons
     */
    updateSetBackgroundButtons() {
        var setBackgroundButton = $('#set-background-button');
        var unsetBackgroundButton = $('#unset-background-button');
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++)  {
                if ( this.selected[l][c] ) {
                    setBackgroundButton.removeAttr("disabled");
                    unsetBackgroundButton.removeAttr("disabled");
                    return;
                }
            }
        }
        setBackgroundButton.attr("disabled", "disabled");
        unsetBackgroundButton.attr("disabled", "disabled");
    }

    /**
     * Set background well of selected Wells
     */
    setBackgroundWell(): void {
        for (var l = 0; l < 8; l++) {
            for (var c = 0; c < 12; c++)  {
                if ( this.selected[l][c] ) {
                    this.wrc.wr.wells[12*l + c].setBackgroundWell(this.measureSubType, this.selectedBackGroundWell);
                    this.selected[l][c] = false;
                }
            }
        }
        this.selectedBackGroundWell = null;
        this.toggleSelectionMode(BackgroundDefinitionController.WELLS_SELECTION_MODE);
        this.wrc.experimentController.saveExperiment();
    }

    /**
     * Toggle selection mode: are we selecting wells or background wells in microplate ?
     * @param mode WELLS_SELECTION_MODE or BACKGROUND_SELECTION_MODE
     */
    toggleSelectionMode(mode): void {
        if ( mode == BackgroundDefinitionController.BACKGROUND_SELECTION_MODE ) {
            var sel: any = null;
            for (var l = 0; l < 8; l++) {
                for (var c = 0; c < 12; c++)  {
                    if ( this.selected[l][c] ) {
                        sel = {l: l, c: c};
                        break;
                    }
                }
            }
            if ( sel != null ) {
                this.selectionMode = mode;
                //this.updateSetBackgroundButtons();
                $('#set-background-button').attr("disabled", "disabled");
                $('#unset-background-button').attr("disabled", "disabled");
                $('#background-definition-tip').html("Click on background well.");
            }
        }
        else {
            this.selectionMode = mode;
            $('#background-definition-tip').html(
                "1. Select the wells for which you want to set/unset the background well: click a well, a column name or a line name, or draw rectangular selection.<br>" +
                "2. Click the 'Set background'/'Unset background' button to set/unset the background of selected wells");
        }

        this.wrc.wr.resetComputedData();
    }

    /**
     * Show view in tab
     */
    showView(): void {

        //this.closeExistingMicroplateViews();

        this.wrc.tabController.showTab(TabController.BACKGROUND_DEFINITION_TAB);

        var bdc: BackgroundDefinitionController = this;
        $("#background-microplate").livequery(function(){    // livequery() waits for view complete loading
            bdc.draw();
            //bdc.toggleSelectionMode(BackgroundDefinitionController.WELLS_SELECTION_MODE);
            //bdc.updateSetBackgroundButtons();
            //bdc.initMouseHandler();
            //$("#measure-subtype").html(wrc.wr.measureSubTypes[bdc.measureSubType].name);
        });

    }

    /**
     * Close existing BackgroundDefinition and WellSet views because it would otherwise generate ID uniqueness conflicts
     * A better solution would be to use a JS template system like Mustache
     */
    closeExistingMicroplateViews(): void {
/*
        var tc = this.wrc.tabController;
        if ( tc.existsTab(TabController.BACKGROUND_DEFINITION_TAB) )
            tc.closeTab(TabController.BACKGROUND_DEFINITION_TAB);

        for(var i=0; i < this.wrc.wr.wellSets.length; i++) {
            if ( tc.existsTab(TabController.WELL_SET_DEFINITION_TAB, this.wrc.wr.wellSets[i]) )
                tc.closeTab(TabController.WELL_SET_DEFINITION_TAB, this.wrc.wr.wellSets[i]);
        }
 */
    }
}