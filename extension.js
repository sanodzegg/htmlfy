const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const liquid = require('liquidjs');
const pretty = require('pretty');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let watching = false;

	const myStatusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100
	);

	myStatusBarItem.text = 'HTMLfy Liquid';
	myStatusBarItem.command = 'htmlfy.activate';
	myStatusBarItem.show();

	let activateExtension = vscode.commands.registerCommand("htmlfy.activate", () => {
		watching = true;
		vscode.window.showInformationMessage(`Extension activated.`);
	});

	let generateHtmlDisposable = vscode.commands.registerCommand('htmlfy.run', async () => {
		if(watching) {
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor) {
				vscode.window.showInformationMessage("No .liquid working environment detected.");
				return;
			};
	
			const input = path.basename(activeEditor.document.fileName);
			if (!input) {
			  return;
			}
		
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
			  vscode.window.showErrorMessage('No workspace folder found');
			  return;
			}
		
			const workspacePath = vscode.window.activeTextEditor.document.fileName;
			const htmlFilePath = path.join(workspaceFolders[0].uri.fsPath, 'index.html');
		
			if (!fs.existsSync(workspacePath)) {
			  vscode.window.showErrorMessage(`File ${input} not found`);
			  return;
			}
	
			let assetFiles;
			try {
				assetFiles = fs.readdirSync(path.join(workspaceFolders[0].uri.fsPath, "/assets/"));
			} catch(err) {
				if (err) vscode.window.showWarningMessage("No assets folder detected");
			}
		
			const content = fs.readFileSync(workspacePath, 'utf-8');
			const engine = new liquid.Liquid({
			  root: [workspacePath, path.join(workspaceFolders[0].uri.fsPath, 'snippets')],
			  greedy: false,
			  dynamicPartials: true,
			  extname: '.liquid'
			});
			let result = await engine.parseAndRender(content);
	
			let htmlHead = '';
			if (assetFiles) {
				assetFiles.forEach(e => htmlHead += `<link rel="stylesheet" href="/assets/${e}" />\n`);
			}
			
			if (workspacePath.endsWith(".liquid")) {
				let html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Document</title>
			${htmlHead}
		</head>
		<body>
			${result}
		</body>
		</html>
				`;
				const formatted = pretty(html);
				fs.writeFileSync(htmlFilePath, formatted);
				vscode.window.showInformationMessage(`File generated successfully.`);
			}
		}
    });
    context.subscriptions.push(activateExtension, generateHtmlDisposable);

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
		vscode.commands.executeCommand('htmlfy.run');
    }));
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}