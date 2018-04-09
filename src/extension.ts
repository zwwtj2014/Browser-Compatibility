import * as vscode from "vscode";
const open = require("opn");
const caniuseAPI = require("caniuse-api");

const BROWSERS = { chrome: "CR", firefox: "FF", ie: "IE", edge: "Edge", opera: "OP", safari: "SF" };
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "browser-compatibility" is now active!');

    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    const dEditor = vscode.window.onDidChangeActiveTextEditor(() => {
        status.hide();
    });
    const dSelection = vscode.window.onDidChangeTextEditorSelection(() => {
        status.hide();
    });

    const eCaniuse = vscode.commands.registerCommand("extension.caniuse", () => {
        let statusInfo = caniuse();
        status.text = statusInfo === "" ? `Unkown Prop: Search in the browser` : statusInfo;
        status.command = "extension.browse";
        status.tooltip = "Click to search in caniuse website";
        status.show();
    });
    const eBrowser = vscode.commands.registerCommand("extension.browse", () => {
        open(`http://caniuse.com/#search=${getSelectedText()}`);
    });
    const tscan2es5 = vscode.commands.registerCommand("extension.tscan2es5", () => {});

    context.subscriptions.push(status, dEditor, dSelection, eCaniuse, eBrowser, tscan2es5);
}

function getSelectedText() {
    const aEditor = vscode.window.activeTextEditor;
    return aEditor ? aEditor.document.getText(aEditor.selection) : "";
}

function caniuse() {
    const sText = getSelectedText();
    if (sText === "") {
        return;
    }

    let ret = {};
    try {
        // https://github.com/Nyalab/caniuse-api#caniusegetsupportfeature
        ret = caniuseAPI.getSupport(sText);
    } catch (e) {
        const sugs = caniuseAPI.find(sText);
        if (sugs && sugs.length > 0) {
            vscode.window.showQuickPick(sugs).then(picked => {
                try {
                    ret = caniuseAPI.getSupport(picked);
                } catch (ex) {
                    throw ex;
                }
            });
        }
    }

    return assembleInfo(ret);
}

function assembleInfo(support) {
    let info = "";
    if (support && support !== {}) {
        Object.keys(BROWSERS).forEach(b => {
            /**
             * y: Since which browser version the feature is available
             * n: Up to which browser version the feature is unavailable
             * a: Up to which browser version the feature is partially supported
             * x: Up to which browser version the feature is prefixed
             */
            if (support[b].hasOwnProperty("y")) {
                info = `${info} ${BROWSERS[b]} ( ${support[b].y} ) `;
            }
        });
    }
    return info;
}
