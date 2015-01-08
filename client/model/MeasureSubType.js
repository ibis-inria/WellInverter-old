var MeasureSubType = (function () {
    /**
     * Constructor
     *
     * @param name name of subType
     * @param type 0: abs, 1: RFU, 2: RLU
     */
    function MeasureSubType(name, type) {
        this.id = MeasureSubType.counter++;
        this.name = name;
        this.type = type;
    }
    /**
     * MeasureSubtype counter
     */
    MeasureSubType.counter = 0;
    return MeasureSubType;
})();
//# sourceMappingURL=MeasureSubType.js.map