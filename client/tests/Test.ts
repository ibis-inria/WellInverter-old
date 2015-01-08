/**
 * Created with JetBrains PhpStorm.
 * User: page
 * Date: 31/01/14
 * Time: 10:34
 * To change this template use File | Settings | File Templates.
 */
class Test {
    x: number;
    y: number;
    t: Test;

    static X0 = 0;
    static X1 = 1;

    constructor(x: number, y: number, t: Test) {
        this.x = x;
        this.y = y;
        this.t = t;
    }

   static test() {
       var L = {X0: 1, X2: 2};
       console.log(L[0]);
    }
}