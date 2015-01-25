///<reference path="WellInverter.ts" />
///<reference path="../model/Measure.ts" />

class Well {

    /**
     * 0 <= id <= 95
     */
    id: number;

    /**
     * @var Measure[]. one for each measure subtype
     */
    measures: Measure[] = [];

    /**
     * Constructor
     * @param id 0 <= id <= 95
     */
    constructor(id: number) {
        this.id = id;
    }

    /**
     * Name: 0 -> A1, 11 -> A12, 12-> B1, ...
     */
    getName(): string {
        return String.fromCharCode(65 + Math.floor(this.id / 12)) + (this.id % 12 + 1);
    }

    /**
     * Return line index in [0; 7]
     */
    getLine(): number {
        return Math.floor(this.id / 12);
    }

    /**
     * return column index in [0; 11]
     */
    getColumn(): number {
        return this.id % 12;
    }

    /**
     * Return true iif I have a measure with subtype measureSubType
     */
    hasMeasure(measureSubType: number) : boolean {
        return ( this.measures[measureSubType] != null && this.measures[measureSubType].time.length > 0 );
    }

    /**
     * Get the measures with subtype measureSubType
     */
    getMeasure(measureSubType: number): Measure {
        return this.measures[measureSubType];
    }

    /**
     * Return background well for given subtype measureSubType
     * @param measureSubType
     */
     getBackgroundWell(measureSubType: number): Well {
        var m = this.getMeasure(measureSubType);
        return ( m == null || m.backgroundReferenceWell == null || m.backgroundReferenceWell == -1 ? null : wic.wr.getWell(m.backgroundReferenceWell) );
    }

    /**
     * Set background well for given measure subtype.
     * @param measureSubType
     * @param bgWell background Well. null means no background well
     */
    setBackgroundWell(measureSubType: number, bgWell: Well): void {
        var m = this.getMeasure(measureSubType);
        if ( m == null )
            throw new Error("Error in Well.setBackgroundWell(): no measure of type '" + measureSubType + "'");

        // update isBackground of previous background well
        var prevBgWell = this.getBackgroundWell(measureSubType);
        if ( prevBgWell != null ) { // check whether prevBgWell is still a background well
            for (var w = 0; w <= 95; w++) {
                var foundWellWithBackgroundWellNumber = false;
                if ( wic.wr.getWell(w).getBackgroundWell(measureSubType) == prevBgWell && w != this.id ) {
                    foundWellWithBackgroundWellNumber = true;
                    break;
                }
            }
            prevBgWell.setIsBackground(measureSubType, foundWellWithBackgroundWellNumber);
        }

        m.backgroundReferenceWell = ( bgWell == null ? -1 : bgWell.id );

        if ( bgWell != null )
            bgWell.setIsBackground(measureSubType, true);
    }

    /**
     * Return boolean isBackground variable for measure subtype
     * @param measureSubType
     */
    isBackground(measureSubType: number): boolean {
        var m = this.getMeasure(measureSubType);
        return ( m != null && m.isBackground == 1 )
    }

    /**
     * Set isBackground variable for measure subtype
     * @param measureSubType
     * @param val iSbackground in boolean form
     */
    setIsBackground(measureSubType: number, val: boolean): void {
        var m = this.getMeasure(measureSubType);
        if ( m == null )
            throw new Error("Error in Well.setIsBackground(): no measure of type '" + measureSubType + "'");

        m.isBackground = ( val ? 1 : 0 );
    }
}
