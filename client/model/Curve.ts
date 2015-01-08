class Curve  {

    /**
     * Time points
     */
    time: number[] = [];

    /**
     * Values
     */
    value: number[] = [];


    /**
     * Constructor
     *
     * @param time time vector
     * @param value value vector
     */
    constructor(time: number[], value: number[]) {
        this.time = time;
        this.value = value;
    }

    /**
     * Number of points in the curve
     */
    size(): number {
        if ( this.time == null )
            return 0;
        else return this.time.length;
    }

    /**
     * Interpolate the curve using the time points of refCurve.
     * Points before the first refCurve time point are interpolated as the first one o this curve
     * Points after the last refCurve time point are interpolated as the last one o this curve
     */
    interpolate(refCurve: Curve): Curve {
        var j = 0;
        var interp = new Curve([], []);
        for (var i = 0; i < refCurve.time.length; i++) {
            if ( refCurve.time[i] <= this.time[0] ) {    // initial case: first values of refCurve time <= this.time[0]
                interp.time[i] = refCurve.time[i];
                interp.value[i] = this.value[0];        // interpolation with first value
                continue
            }
            while (j < this.time.length && this.time[j] < refCurve.time[i]) {
                j++;
            }
            if (j == this.time.length ) {
                interp.time[i] = refCurve.time[i];
                interp.value[i] = this.value[this.time.length - 1]; // interpolation with last value
            }
            else {  // this.time[j-1] < refCurve.time[i] <= this.time[j]
                var y1 = this.value[j-1];
                var y2 = this.value[j];
                var x1 = this.time[j-1];
                var x2 = this.time[j];
                var value = y1 + (y2 - y1) / (x2 - x1) *  (refCurve.time[i] - x1);

                interp.time[i] = refCurve.time[i];
                interp.value[i] = value;
            }
        }
        return interp;
    }

    /**
     * Return this curve - bgCurve.
     * Before subtraction takes place, interpolation of bgCurve time points is first made
     */
    subtract(bgCurve: Curve): Curve {
        var result  = bgCurve.interpolate(this);
        for (var i = 0; i < result.time.length; i++) {
            result.value[i] = this.value[i] - result.value[i];
        }
        return result;
    }

    /**
     * Return the average of a set of synchronized curves
     */
    static mean(curves: Curve[]): Curve {
        var mean = new Curve([], []);
        for (var i = 0; i < curves[0].time.length; i++) {
            var sum = 0.0;
            for (var c = 0; c < curves.length; c++) {
                sum += curves[c].value[i];
            }
            mean.time[i] = curves[0].time[i];
            mean.value[i] = sum / curves.length;
        }
        return mean;
    }


    /**
     * Return the variance of a set of synchronized curves
     */
    static variance(curves: Curve[]): Curve {
        var variance = new Curve([], []);
        for (var i = 0; i < curves[0].time.length; i++) {

            var sum = 0.0;
            for (var c = 0; c < curves.length; c++) {
                sum += curves[c].value[i];
            }
            var mu = sum / curves.length;

            var sumsq = 0.0;
            for (var c = 0; c < curves.length; c++) {
                sumsq += (mu - curves[c].value[i]) * (mu - curves[c].value[i]);
            }
            variance.time[i] = curves[0].time[i];
            variance.value[i] = sumsq / curves.length;
        }
        return variance;
    }


    /**
     * Return standard deviation of a set of synchronized curves
     */
    static stdDev(curves: Curve[]): Curve {
        var stdDev = Curve.variance(curves);

        for (var i = 0; i < stdDev.time.length; i++) {
            stdDev.value[i] = Math.sqrt(stdDev.value[i]);
        }
        return stdDev;
    }

    /**
     * Return the standard error of a set of synchronized curves.
     * This is defined as the standard deviation of the sample divided by the square root of the
     * sample size.
     */
    static stdErrorOfMean(curves: Curve[]): Curve {
        var stdErrorOfMean = Curve.variance(curves);

        for (var i = 0; i < stdErrorOfMean.time.length; i++) {
            stdErrorOfMean.value[i] = Math.sqrt(stdErrorOfMean.value[i] / curves.length);
        }
        return stdErrorOfMean;
    }

    /*
    static mergeTimePoints(curves: Curve[]): number[] {
        var result: Curve = curves[0];
        var r: number[];
        for (var i = 1; i < curves.length; i++)
            r = Curve.mergeTimePoints2(new Curve(r, []), curves[i]);
        return r;
    }

    static mergeTimePoints2(c1: Curve, c2: Curve): number[] {
        var result  = [];
        var i1 = 0;
        var i2 = 0;
    
        while (i1 < c1.time.length || i2 < c2.time.length){
            if (i2 == c2.time.length || c1.time[i1] < c2.time[i2]){
                result.push(c1.time[i1++]);
            }
            else {
                result.push(c2.time[i2++]);
            }
        }

        return result;
    }
*/
}