///<reference path="WellInverterController.ts" />
///<reference path="WindowController.ts" />
///<reference path="../model/Session.ts" />

declare var $: JQueryStatic;

/**
 * Class for handling authentication. Associated view is authentication.html
 */
class AuthenticationController extends WindowController {

    /**
     * Constructor
     */
    constructor(wic: WellInverterController) {
        super(wic, "authentication.html");
    }

    /**
     * Return whether current user is authenticated.
     */
    isAuthenticated(): boolean {
        return ( Session.getUserName() != "" );
    }

    /**
     * Display authentication window
     */
    authenticate(): void {
        this.open(
            {title:"Login",
             width: 300,
             height: 220,
             closable: false,
             collapsible:false,
             maximizable: false,
             minimizable:false,
             inline: false
            });
    }

    /**
     * Handle click on "Ok" button in authentication window
     */
    authenticationCheck(): void {
        var loginTxt = $('#login');
        var passwordTxt = $('#password');
        if (this.isValidIdentity(loginTxt.val(), passwordTxt.val())) {
            this.close();
            this.wic.init();
        }
        else {
            $('#auth-failure').html("Error: incorrect login and/or password");
            setTimeout(function () {
                $('#auth-failure').html("")
            }, 2000);
            loginTxt.val("");
            passwordTxt.val("");
        }
    }

    /**
     * Return true iff (login, password) is valid. Side effect: set session variable
     */
    isValidIdentity(login: string, password: string): boolean {  // TODO change
        if ( (login == "hdj" && password == "hdj")
            || (login == "mp" && password == "mp")
            || (login == "cb" && password == "cb")
            || (login == "vz" && password == "vz")
            || (login == "guest" && password == "guest2015")) {
            Session.setUserName(login);
            return true;
        }
        else return false;
    }
}
