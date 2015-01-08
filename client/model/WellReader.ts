///<reference path="../model/Measure.ts" />
///<reference path="../model/MeasureSubType.ts" />
///<reference path="../model/Well.ts" />
///<reference path="../model/WellSet.ts" />

declare var $: JQueryStatic;


class WellReader {

    experimentInfo: any;

    /**
     *
     */
    initialTime: string;

    /**
     *
     */
    programs: any[] = [];

    /**
     * Wells
     */
    wells: Well[] = [];

    /**
     * measure sub-types
     */
    measureSubTypes: MeasureSubType[] = [];

    /**
     * Dictionary of well sets
     */
    wellSetDictionary:  { [index: string]: WellSet; } = {};

    /**
     * Sets of wells
     */
    wellSets: WellSet[] = [];

    /**
     * Experimental parameters
     */
    experimentParameters:  { [index: string]: number; } = {};

    /**
     * Constructor
     */
    constructor() {
        for (var w = 0; w <= 95; w++)
            this.wells.push(new Well(w));
    }

    /**
     * Read JSON object corresponding to an experiment
     */
    static readJSON(obj: any, json: any): void {
        for(var key in json) {
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
                else obj[key] = json[key];
            }
        }
    }

    /**
     * Generate my JSON representation
     */
    generateJSON () {
        var wells = [];
        for (var w=0; w <= 95; w++) {
            var well: Well = this.getWell(w);
            var measures = [];
            for (var m: number = 0; m < well.measures.length; m++) {
                var measure: Measure = well.getMeasure(m);
                if ( measure != null ) {
                    measures.push(
                        {
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
                else measures.push(null);
            }
            wells.push({"id": w, "name": well.getName(), "measures": measures});
        }

        return {
            "experimentInfo": this.experimentInfo,
            "initialTime": this.initialTime,
            "programs": this.programs,
            "wells": wells,
            "measureSubTypes": this.measureSubTypes,
            "experimentParameters": this.experimentParameters};
    }

    /**
     * Generate and return unique name for object type, using prefix
     */
    generateUniqueName(type: string, prefix: string): string {
        var counter = 1;
        var name = prefix;
        while ( this[type + "Dictionary"][name] != null )
            name = prefix + counter++;
        return name;
    }

    /**
     * Return Well from id (>= 0)
     */
    getWell(i: number): Well {
        return this.wells[i];
    }

    /**
     * Return well name from well index
     */
    wellName(wellIndex: number): string {
        return String.fromCharCode(65 + Math.floor(wellIndex / 12)) + (wellIndex % 12 + 1);
    }


    wellFromName(wellName: string): Well {
        return this.getWell((wellName.charCodeAt(0) - 65)*12 + +(wellName.substr(1)) - 1);
    }

    /**
     * return true iff there exists a WellSet with name
     */
    existsWellSet(name: string): boolean {
        return (this.wellSetDictionary[name] != null)
    }

    /**
     * Remove WellSet from my list of wellSets
     */
    removeWellSet(ws: WellSet): void {
        var index = this.wellSets.indexOf(ws);
        if (index > -1)
            this.wellSets.splice(index, 1);
        this.wellSetDictionary[ws.name] = null;
    }

    /**
     * Reset computed data of each measure.
     * Called each time outlier detection or background detection is performed because data previously computed are then invalidated
     */
    resetComputedData() {
        for (var w=0; w <= 95; w++) {
            var well: Well = this.getWell(w);
            for (var m = 0; m < well.measures.length; m++) {
                var measure: Measure = well.getMeasure(m);
                if ( measure != null ) {
                    measure.resetComputedData();
                }
            }
        }
    }
}
