/**
 * Sample class defines statistical indicators: mean, media, standard deviation, ...
 */
var Sample = (function () {
    /**
     * Constructor
     *
     * @param data data associated with me
     */
    function Sample(data) {
        /**
         * Sample data
         */
        this.data = [];
        this.data = data;
    }
    /**
     * Return the average of data.
     */
    Sample.prototype.mean = function () {
        var sum = 0.0;
        for (var i = 0; i < this.data.length; i++)
            sum += this.data[i];
        return sum / this.data.length;
    };
    /**
     * Return the variance of data.
     */
    Sample.prototype.variance = function () {
        var mu = this.mean();
        var sumsq = 0.0;
        for (var i = 0; i < this.data.length; i++)
            sumsq += (mu - this.data[i]) * (mu - this.data[i]);
        return sumsq / (this.data.length);
    };
    /**
     * Return  standard deviation of data.
     */
    Sample.prototype.stdDev = function () {
        return Math.sqrt(this.variance());
    };
    /**
     * Return the standard error of data. This is defined
     * as the standard deviation of the sample divided by the square root of the
     * sample size.
     */
    Sample.prototype.stdErrorOfMean = function () {
        return this.stdDev() / Math.sqrt(this.data.length);
    };
    /**
     * Median value of data
     */
    Sample.prototype.median = function () {
        var sortedData = this.data.sort();
        return sortedData[Math.floor(this.data.length / 2)];
    };
    return Sample;
})();
//# sourceMappingURL=Sample.js.map