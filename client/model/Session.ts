// Idea adapted from: http://www.sitepoint.com/javascript-session-variable-library/

class Session {

    static getUserName() : string {
        return window.name;
    }

    static setUserName(userName: string) : void {
        window.name = userName;
    }
}
