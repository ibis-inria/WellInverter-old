class MeasureSubType {

    /**
     * MeasureSubtype counter
     */
    static counter: number = 0;

    /**
     * Index >= 0
     */
    id: number;

    /**
     * name of subType
     */
    name: string;

    /**
     * type: 0: abs, 1: RFU, 2: RLU
     */
    type: number;

    /**
     * Constructor
     *
     * @param name name of subType
     * @param type 0: abs, 1: RFU, 2: RLU
     */
    constructor(name: string, type: number) {
        this.id = MeasureSubType.counter++;
        this.name = name;
        this.type = type;
    }
}
