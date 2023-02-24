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
	myStatusBarItem.command = 'htmlfy.run';
	myStatusBarItem.show();

	let generateHtmlDisposable = vscode.commands.registerCommand('htmlfy.run', async () => {
		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			vscode.window.showInformationMessage("No .liquid working environment detected.");
			return;
		} else {
			const fileName = path.basename(activeEditor.document.fileName);
			if (fileName.endsWith(".liquid")) {
				if (!watching) {
					vscode.window.showInformationMessage(`Started watching ${fileName}.`);
				}
			} else {
				vscode.window.showInformationMessage("No .liquid working environment detected.");
				return;
			}
			watching = true;
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
	
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const liquidFilePath = path.join(workspacePath, input);
		const htmlFilePath = path.join(workspacePath, 'index.html');
	
		if (!fs.existsSync(liquidFilePath)) {
		  vscode.window.showErrorMessage(`File ${input} not found`);
		  return;
		}

		let assetFiles;
		try {
			assetFiles = fs.readdirSync(path.join(workspacePath, "/assets/"));
		} catch(err) {
			if (err) vscode.window.showWarningMessage("No assets folder detected");
		}
	
		const content = fs.readFileSync(liquidFilePath, 'utf-8');
		const engine = new liquid.Liquid({
		  root: [workspacePath],
		  greedy: false,
		});
		let result = await engine.parseAndRender(content);

		let htmlHead = '';
		if (assetFiles) {
			assetFiles.forEach(e => htmlHead += `<link rel="stylesheet" href="/assets/${e}" />\n`);
		}
		
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
    });
    context.subscriptions.push(generateHtmlDisposable);

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
		vscode.commands.executeCommand('htmlfy.run');
    }));
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}