///<reference path="../controller/WellInverterController.ts" />
///<reference path="../model/Well.ts" />

class WellSet {

    wic: WellInverterController;

    /**
     * Name of WellSet
     */
    name: string;

    /**
     * Set of wells
     */
    wells: Well[] = [];

    /**
     * Constructor
     */
    constructor(wic, name: string) {
        this.wic  = wic;

        if ( name == null || name == "" )
            throw new Error("Unable to create a wellSet with empty name");
        if ( this.wic.wr.existsWellSet(name) )
            throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");

        this.wic.wr.wellSets.push(this);
        this.setName(null, name);
    }

    /**
     * Set my name
     */
    setName(oldName, name): void {
        if ( name == null || name == "" )
            throw new Error("Unable to create a wellSet with empty name");
        if ( oldName != name ) {
            if ( this.wic.wr.existsWellSet(name) )
                throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");

            this.wic.wr.wellSetDictionary[name] = this;
            if ( oldName != null )
                this.wic.wr.wellSetDictionary[oldName] = null;
            this.name = name;
        }
    }
}
