/**
 * Sample class defines statistical indicators: mean, media, standard deviation, ...
 */
class Sample  {

    /**
     * Sample data
     */
    data: number[] = [];

    /**
     * Constructor
     *
     * @param data data associated with me
     */
    constructor(data: number[]) {
        this.data = data;
    }

    /**
     * Return the average of data.
     */
    mean(): number {
        var sum = 0.0;
        for (var i = 0; i < this.data.length; i++)
        sum += this.data[i];
        return sum / this.data.length;
    }

    /**
     * Return the variance of data.
     */
    variance() {
        var mu = this.mean();
        var sumsq = 0.0;
        for (var i = 0; i < this.data.length; i++)
            sumsq += (mu - this.data[i]) * (mu - this.data[i]);
        return sumsq / (this.data.length);
    }

    /**
     * Return  standard deviation of data.
     */
    stdDev(): number {
        return Math.sqrt(this.variance());
    }

    /**
     * Return the standard error of data. This is defined
     * as the standard deviation of the sample divided by the square root of the
     * sample size.
     */
     stdErrorOfMean(): number {
        return this.stdDev() / Math.sqrt(this.data.length);
    }

    /**
     * Median value of data
     */
    median(): number {
        var sortedData = this.data.sort();
        return sortedData[Math.floor(this.data.length / 2)];
    }
}