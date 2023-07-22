"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class MumpsFormattingHelpProvider {
    provideDocumentFormattingEdits(document) {
        const textEdits = [];
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            formatDocumentLine(line, i, textEdits);
        }
        return textEdits;
    }
    provideDocumentRangeFormattingEdits(document, range) {
        const textEdits = [];
        for (let i = range.start.line; i <= range.end.line; i++) {
            const line = document.lineAt(i).text;
            formatDocumentLine(line, i, textEdits);
        }
        return textEdits;
    }
}
exports.default = MumpsFormattingHelpProvider;
function formatDocumentLine(line, lineNumber, textEdits) {
    const emptyLine = line.replace(/( |\t)/ig, "");
    if (emptyLine.length === 0) {
        textEdits.push(vscode.TextEdit.insert(new vscode.Position(lineNumber, 0), "\t;"));
    }
    if (line.endsWith(". ") || line.endsWith(".")) {
        textEdits.push(vscode.TextEdit.insert(new vscode.Position(lineNumber, line.length), ";"));
    }
    if (line.startsWith(" ")) {
        let endSpace;
        for (endSpace = 0; endSpace < line.length; endSpace++) {
            if (line.charAt(endSpace) !== " ") {
                break;
            }
        }
        textEdits.push(vscode.TextEdit.replace(new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, endSpace)), "\t"));
    }
    if (line.match(/^([A-Za-z%][A-Za-z0-9]*(\([A-Za-z%][A-Za-z0-9]*(,[A-Za-z%][A-Za-z0-9]*)*\))?)?[\t ]+\./)) { //labeled or unlabeled Line with .
        let replacementString = ". ";
        const dotPosition = line.indexOf(".");
        let dotCount = 1;
        let spaceCount = 0;
        let char = "";
        do {
            char = line.charAt(dotCount + spaceCount + dotPosition);
            if (char === " ") {
                spaceCount++;
            }
            else if (char === ".") {
                dotCount++;
                replacementString += ". ";
            }
        } while (char === "." || char === " ");
        if (dotCount !== spaceCount) {
            textEdits.push(vscode.TextEdit.replace(new vscode.Range(new vscode.Position(lineNumber, dotPosition), new vscode.Position(lineNumber, dotPosition + dotCount + spaceCount)), replacementString));
        }
    }
}
//# sourceMappingURL=mumpsFormattingHelpProvider.js.map