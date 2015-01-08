var Curve = (function () {
    /**
     * Constructor
     *
     * @param time time vector
     * @param value value vector
     */
    function Curve(time, value) {
        /**
         * Time points
         */
        this.time = [];
        /**
         * Values
         */
        this.value = [];
        this.time = time;
        this.value = value;
    }
    /**
     * Number of points in the curve
     */
    Curve.prototype.size = function () {
        if (this.time == null)
            return 0;
        else
            return this.time.length;
    };
    /**
     * Interpolate the curve using the time points of refCurve.
     * Points before the first refCurve time point are interpolated as the first one o this curve
     * Points after the last refCurve time point are interpolated as the last one o this curve
     */
    Curve.prototype.interpolate = function (refCurve) {
        var j = 0;
        var interp = new Curve([], []);
        for (var i = 0; i < refCurve.time.length; i++) {
            if (refCurve.time[i] <= this.time[0]) {
                interp.time[i] = refCurve.time[i];
                interp.value[i] = this.value[0]; // interpolation with first value
                continue;
            }
            while (j < this.time.length && this.time[j] < refCurve.time[i]) {
                j++;
            }
            if (j == this.time.length) {
                interp.time[i] = refCurve.time[i];
                interp.value[i] = this.value[this.time.length - 1]; // interpolation with last value
            }
            else {
                var y1 = this.value[j - 1];
                var y2 = this.value[j];
                var x1 = this.time[j - 1];
                var x2 = this.time[j];
                var value = y1 + (y2 - y1) / (x2 - x1) * (refCurve.time[i] - x1);
                interp.time[i] = refCurve.time[i];
                interp.value[i] = value;
            }
        }
        return interp;
    };
    /**
     * Return this curve - bgCurve.
     * Before subtraction takes place, interpolation of bgCurve time points is first made
     */
    Curve.prototype.subtract = function (bgCurve) {
        var result = bgCurve.interpolate(this);
        for (var i = 0; i < result.time.length; i++) {
            result.value[i] = this.value[i] - result.value[i];
        }
        return result;
    };
    /**
     * Return the average of a set of synchronized curves
     */
    Curve.mean = function (curves) {
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
    };
    /**
     * Return the variance of a set of synchronized curves
     */
    Curve.variance = function (curves) {
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
    };
    /**
     * Return standard deviation of a set of synchronized curves
     */
    Curve.stdDev = function (curves) {
        var stdDev = Curve.variance(curves);
        for (var i = 0; i < stdDev.time.length; i++) {
            stdDev.value[i] = Math.sqrt(stdDev.value[i]);
        }
        return stdDev;
    };
    /**
     * Return the standard error of a set of synchronized curves.
     * This is defined as the standard deviation of the sample divided by the square root of the
     * sample size.
     */
    Curve.stdErrorOfMean = function (curves) {
        var stdErrorOfMean = Curve.variance(curves);
        for (var i = 0; i < stdErrorOfMean.time.length; i++) {
            stdErrorOfMean.value[i] = Math.sqrt(stdErrorOfMean.value[i] / curves.length);
        }
        return stdErrorOfMean;
    };
    return Curve;
})();
//# sourceMappingURL=Curve.js.map