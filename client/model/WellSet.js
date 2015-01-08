///<reference path="../controller/WellReaderController.ts" />
///<reference path="../model/Well.ts" />
var WellSet = (function () {
    /**
     * Constructor
     */
    function WellSet(wrc, name) {
        /**
         * Set of wells
         */
        this.wells = [];
        this.wrc = wrc;
        if (name == null || name == "")
            throw new Error("Unable to create a wellSet with empty name");
        if (this.wrc.wr.existsWellSet(name))
            throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");
        this.wrc.wr.wellSets.push(this);
        this.setName(null, name);
    }
    /**
     * Set my name
     */
    WellSet.prototype.setName = function (oldName, name) {
        if (name == null || name == "")
            throw new Error("Unable to create a wellSet with empty name");
        if (oldName != name) {
            if (this.wrc.wr.existsWellSet(name))
                throw new Error("Unable to create a wellSet with  name " + name + ": name already in use");
            this.wrc.wr.wellSetDictionary[name] = this;
            if (oldName != null)
                this.wrc.wr.wellSetDictionary[oldName] = null;
            this.name = name;
        }
    };
    return WellSet;
})();
//# sourceMappingURL=WellSet.js.map