"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const mumpsLineParser_1 = require("./mumpsLineParser");
const parser = new mumpsLineParser_1.MumpsLineParser();
class MumpsDocumentSymbolProvider {
    provideDocumentSymbols(document) {
        return new Promise(resolve => {
            const labels = parser.getLabels(document.getText());
            const symbols = [];
            for (let i = 0; i < labels.length; i++) {
                const startPosition = new vscode.Position(labels[i].line, 0);
                let endPostionLine = document.lineCount - 1;
                if (labels[i + 1] !== undefined) {
                    endPostionLine = labels[i + 1].line;
                }
                const endPosition = new vscode.Position(endPostionLine, 0);
                const methodRange = new vscode.Location(document.uri, new vscode.Range(startPosition, endPosition));
                symbols.push(new vscode.SymbolInformation(labels[i].name, vscode.SymbolKind.Function, '', methodRange));
            }
            resolve(symbols);
        });
    }
}
exports.default = MumpsDocumentSymbolProvider;
//# sourceMappingURL=mumpsDocumentSymbolProvider.js.map