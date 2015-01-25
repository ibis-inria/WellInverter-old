///<reference path="../controller/WellInverterController.ts" />
///<reference path="../model/Well.ts" />
var WellSet = (function () {
    /**
     * Constructor
     */
    function WellSet(wic, name) {
        /**
         * Set of wells
         */
        this.wells = [];
        this.wic = wic;
        if (name == null || name == "")
            throw new Error("Unable to create a wellSet with empty name");
        if (this.wic.wr.existsWellSet(name))
            throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");
        this.wic.wr.wellSets.push(this);
        this.setName(null, name);
    }
    /**
     * Set my name
     */
    WellSet.prototype.setName = function (oldName, name) {
        if (name == null || name == "")
            throw new Error("Unable to create a wellSet with empty name");
        if (oldName != name) {
            if (this.wic.wr.existsWellSet(name))
                throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");
            this.wic.wr.wellSetDictionary[name] = this;
            if (oldName != null)
                this.wic.wr.wellSetDictionary[oldName] = null;
            this.name = name;
        }
    };
    return WellSet;
})();
//# sourceMappingURL=WellSet.js.map