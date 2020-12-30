// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {commands, extensions} from 'vscode';
import {AzureAccount} from "./azure-account-api";
import * as login from "./login";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "login-demo" is now active!');

    const azureAccount = extensions.getExtension<AzureAccount>('ms-vscode.azure-account')!.exports;
    const subscriptions = context.subscriptions;
    subscriptions.push(commands.registerCommand('login-demo.helloWorld', () => vscode.window.showInformationMessage(`Hello World from login-demo!`)));
    subscriptions.push(commands.registerCommand('login-demo.showSubscriptions', login.showSubscriptions(azureAccount)));
    console.log('showSubscriptions');
    subscriptions.push(commands.registerCommand('login-demo.showAppServices', login.showAppServices(azureAccount)));

    // context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
