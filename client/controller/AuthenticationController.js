///<reference path="WellInverterController.ts" />
///<reference path="WindowController.ts" />
///<reference path="../model/Session.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Class for handling authentication. Associated view is authentication.html
 */
var AuthenticationController = (function (_super) {
    __extends(AuthenticationController, _super);
    /**
     * Constructor
     */
    function AuthenticationController(wic) {
        _super.call(this, wic, "authentication.html");
    }
    /**
     * Return whether current user is authenticated.
     */
    AuthenticationController.prototype.isAuthenticated = function () {
        return (Session.getUserName() != "");
    };
    /**
     * Display authentication window
     */
    AuthenticationController.prototype.authenticate = function () {
        this.open({ title: "Login", width: 300, height: 220, closable: false, collapsible: false, maximizable: false, minimizable: false, inline: false });
    };
    /**
     * Handle click on "Ok" button in authentication window
     */
    AuthenticationController.prototype.authenticationCheck = function () {
        var loginTxt = $('#login');
        var passwordTxt = $('#password');
        if (this.isValidIdentity(loginTxt.val(), passwordTxt.val())) {
            this.close();
            this.wic.init();
        }
        else {
            $('#auth-failure').html("Error: incorrect login and/or password");
            setTimeout(function () {
                $('#auth-failure').html("");
            }, 2000);
            loginTxt.val("");
            passwordTxt.val("");
        }
    };
    /**
     * Return true iff (login, password) is valid. Side effect: set session variable
     */
    AuthenticationController.prototype.isValidIdentity = function (login, password) {
        if ((login == "hdj" && password == "hdj") || (login == "mp" && password == "mp") || (login == "cb" && password == "cb") || (login == "vz" && password == "vz") || (login == "guest" && password == "guest2015")) {
            Session.setUserName(login);
            return true;
        }
        else
            return false;
    };
    return AuthenticationController;
})(WindowController);
//# sourceMappingURL=AuthenticationController.js.map