/// <reference path="jquery.d.ts" />

interface EasyuiWindow extends JQuery {
    window(x: any): void;
}

interface EasyuiTree  extends JQuery {
    tree(url: any, arg?: any): any;
}
