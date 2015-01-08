// Idea adapted from: http://www.sitepoint.com/javascript-session-variable-library/
var Session = (function () {
    function Session() {
    }
    Session.getUserName = function () {
        return window.name;
    };
    Session.setUserName = function (userName) {
        window.name = userName;
    };
    return Session;
})();
//# sourceMappingURL=Session.js.map