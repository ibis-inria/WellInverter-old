///<reference path="../controller/WellReaderController.ts" />
///<reference path="../model/Well.ts" />

class WellSet {

    wrc: WellReaderController;

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
    constructor(wrc, name: string) {
        this.wrc  = wrc;

        if ( name == null || name == "" )
            throw new Error("Unable to create a wellSet with empty name");
        if ( this.wrc.wr.existsWellSet(name) )
            throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");

        this.wrc.wr.wellSets.push(this);
        this.setName(null, name);
    }

    /**
     * Set my name
     */
    setName(oldName, name): void {
        if ( name == null || name == "" )
            throw new Error("Unable to create a wellSet with empty name");
        if ( oldName != name ) {
            if ( this.wrc.wr.existsWellSet(name) )
                throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");

            this.wrc.wr.wellSetDictionary[name] = this;
            if ( oldName != null )
                this.wrc.wr.wellSetDictionary[oldName] = null;
            this.name = name;
        }
    }
}
