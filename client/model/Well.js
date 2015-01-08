///<reference path="../model/WellReader.ts" />
///<reference path="../model/Measure.ts" />
var Well = (function () {
    /**
     * Constructor
     * @param id 0 <= id <= 95
     */
    function Well(id) {
        /**
         * @var Measure[]. one for each measure subtype
         */
        this.measures = [];
        this.id = id;
    }
    /**
     * Name: 0 -> A1, 11 -> A12, 12-> B1, ...
     */
    Well.prototype.getName = function () {
        return String.fromCharCode(65 + Math.floor(this.id / 12)) + (this.id % 12 + 1);
    };
    /**
     * Return line index in [0; 7]
     */
    Well.prototype.getLine = function () {
        return Math.floor(this.id / 12);
    };
    /**
     * return column index in [0; 11]
     */
    Well.prototype.getColumn = function () {
        return this.id % 12;
    };
    /**
     * Return true iif I have a measure with subtype measureSubType
     */
    Well.prototype.hasMeasure = function (measureSubType) {
        return (this.measures[measureSubType] != null && this.measures[measureSubType].time.length > 0);
    };
    /**
     * Get the measures with subtype measureSubType
     */
    Well.prototype.getMeasure = function (measureSubType) {
        return this.measures[measureSubType];
    };
    /**
     * Return background well for given subtype measureSubType
     * @param measureSubType
     */
    Well.prototype.getBackgroundWell = function (measureSubType) {
        var m = this.getMeasure(measureSubType);
        return (m == null || m.backgroundReferenceWell == null || m.backgroundReferenceWell == -1 ? null : wrc.wr.getWell(m.backgroundReferenceWell));
    };
    /**
     * Set background well for given measure subtype.
     * @param measureSubType
     * @param bgWell background Well. null means no background well
     */
    Well.prototype.setBackgroundWell = function (measureSubType, bgWell) {
        var m = this.getMeasure(measureSubType);
        if (m == null)
            throw new Error("Error in Well.setBackgroundWell(): no measure of type '" + measureSubType + "'");
        // update isBackground of previous background well
        var prevBgWell = this.getBackgroundWell(measureSubType);
        if (prevBgWell != null) {
            for (var w = 0; w <= 95; w++) {
                var foundWellWithBackgroundWellNumber = false;
                if (wrc.wr.getWell(w).getBackgroundWell(measureSubType) == prevBgWell && w != this.id) {
                    foundWellWithBackgroundWellNumber = true;
                    break;
                }
            }
            prevBgWell.setIsBackground(measureSubType, foundWellWithBackgroundWellNumber);
        }
        m.backgroundReferenceWell = (bgWell == null ? -1 : bgWell.id);
        if (bgWell != null)
            bgWell.setIsBackground(measureSubType, true);
    };
    /**
     * Return boolean isBackground variable for measure subtype
     * @param measureSubType
     */
    Well.prototype.isBackground = function (measureSubType) {
        var m = this.getMeasure(measureSubType);
        return (m != null && m.isBackground == 1);
    };
    /**
     * Set isBackground variable for measure subtype
     * @param measureSubType
     * @param val iSbackground in boolean form
     */
    Well.prototype.setIsBackground = function (measureSubType, val) {
        var m = this.getMeasure(measureSubType);
        if (m == null)
            throw new Error("Error in Well.setIsBackground(): no measure of type '" + measureSubType + "'");
        m.isBackground = (val ? 1 : 0);
    };
    return Well;
})();
//# sourceMappingURL=Well.js.map