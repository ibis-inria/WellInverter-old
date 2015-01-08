/**
* Created with JetBrains PhpStorm.
* User: page
* Date: 31/01/14
* Time: 10:34
* To change this template use File | Settings | File Templates.
*/
var Test = (function () {
    function Test(x, y, t) {
        this.x = x;
        this.y = y;
        this.t = t;
    }
    Test.test = function () {
        var L = { X0: 1, X2: 2 };
        console.log(L[0]);
    };
    Test.X0 = 0;
    Test.X1 = 1;
    return Test;
})();
//# sourceMappingURL=Test.js.map
