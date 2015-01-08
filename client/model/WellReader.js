///<reference path="../model/Measure.ts" />
///<reference path="../model/MeasureSubType.ts" />
///<reference path="../model/Well.ts" />
///<reference path="../model/WellSet.ts" />
var WellReader = (function () {
    /**
     * Constructor
     */
    function WellReader() {
        /**
         *
         */
        this.programs = [];
        /**
         * Wells
         */
        this.wells = [];
        /**
         * measure sub-types
         */
        this.measureSubTypes = [];
        /**
         * Dictionary of well sets
         */
        this.wellSetDictionary = {};
        /**
         * Sets of wells
         */
        this.wellSets = [];
        /**
         * Experimental parameters
         */
        this.experimentParameters = {};
        for (var w = 0; w <= 95; w++)
            this.wells.push(new Well(w));
    }
    /**
     * Read JSON object corresponding to an experiment
     */
    WellReader.readJSON = function (obj, json) {
        for (var key in json) {
            if (json.hasOwnProperty(key)) {
                if (key == "wells") {
                    for (var w = 0; w <= 95; w++) {
                        WellReader.readJSON(obj.wells[w], json.wells[w]);
                    }
                }
                else if (key == "measures") {
                    for (var m = 0; m < json.measures.length; m++) {
                        if (json.measures[m] != null) {
                            var measure = new Measure(obj);
                            obj.measures.push(measure);
                            WellReader.readJSON(measure, json.measures[m]);
                        }
                        else {
                            obj.measures.push(null);
                        }
                    }
                }
                else if (key == "measureSubTypes") {
                    for (var m = 0; m < json.measureSubTypes.length; m++) {
                        var mst = new MeasureSubType(json.measureSubTypes[m].name, json.measureSubTypes[m].type);
                        obj.measureSubTypes.push(mst);
                    }
                }
                else
                    obj[key] = json[key];
            }
        }
    };
    /**
     * Generate my JSON representation
     */
    WellReader.prototype.generateJSON = function () {
        var wells = [];
        for (var w = 0; w <= 95; w++) {
            var well = this.getWell(w);
            var measures = [];
            for (var m = 0; m < well.measures.length; m++) {
                var measure = well.getMeasure(m);
                if (measure != null) {
                    measures.push({
                        "type": measure.type,
                        "subType": measure.subType,
                        "isBackground": measure.isBackground,
                        "trueCurveMarks": measure.trueCurveMarks,
                        "backgroundReferenceWell": measure.backgroundReferenceWell,
                        "time": measure.time,
                        "originalSignal": measure.originalSignal,
                        "outlier": measure.outlier,
                        "smoothingParameter": measure.smoothingParameter,
                        "outliersFilteringParameter": measure.outliersFilteringParameter
                    });
                }
                else
                    measures.push(null);
            }
            wells.push({ "id": w, "name": well.getName(), "measures": measures });
        }
        return {
            "experimentInfo": this.experimentInfo,
            "initialTime": this.initialTime,
            "programs": this.programs,
            "wells": wells,
            "measureSubTypes": this.measureSubTypes,
            "experimentParameters": this.experimentParameters
        };
    };
    /**
     * Generate and return unique name for object type, using prefix
     */
    WellReader.prototype.generateUniqueName = function (type, prefix) {
        var counter = 1;
        var name = prefix;
        while (this[type + "Dictionary"][name] != null)
            name = prefix + counter++;
        return name;
    };
    /**
     * Return Well from id (>= 0)
     */
    WellReader.prototype.getWell = function (i) {
        return this.wells[i];
    };
    /**
     * Return well name from well index
     */
    WellReader.prototype.wellName = function (wellIndex) {
        return String.fromCharCode(65 + Math.floor(wellIndex / 12)) + (wellIndex % 12 + 1);
    };
    WellReader.prototype.wellFromName = function (wellName) {
        return this.getWell((wellName.charCodeAt(0) - 65) * 12 + +(wellName.substr(1)) - 1);
    };
    /**
     * return true iff there exists a WellSet with name
     */
    WellReader.prototype.existsWellSet = function (name) {
        return (this.wellSetDictionary[name] != null);
    };
    /**
     * Remove WellSet from my list of wellSets
     */
    WellReader.prototype.removeWellSet = function (ws) {
        var index = this.wellSets.indexOf(ws);
        if (index > -1)
            this.wellSets.splice(index, 1);
        this.wellSetDictionary[ws.name] = null;
    };
    /**
     * Reset computed data of each measure.
     * Called each time outlier detection or background detection is performed because data previously computed are then invalidated
     */
    WellReader.prototype.resetComputedData = function () {
        for (var w = 0; w <= 95; w++) {
            var well = this.getWell(w);
            for (var m = 0; m < well.measures.length; m++) {
                var measure = well.getMeasure(m);
                if (measure != null) {
                    measure.resetComputedData();
                }
            }
        }
    };
    return WellReader;
})();
//# sourceMappingURL=WellReader.js.map