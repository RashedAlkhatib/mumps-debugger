"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const mumpsLineParser_1 = require("./mumpsLineParser");
const fs = require("fs");
const parser = new mumpsLineParser_1.MumpsLineParser();
class MumpsReferenceProvider {
    provideReferences(document, position) {
        const myToken = parser.getTokenAt(document.lineAt(position).text, position.character);
        const result = [];
        if (myToken !== undefined) {
            let searchType = myToken.type;
            const searchToken = myToken === null || myToken === void 0 ? void 0 : myToken.name;
            if (searchType === mumpsLineParser_1.TokenType.label) {
                let routine = document.fileName.replace(/\\/g, '/').split('/').pop();
                routine = routine === null || routine === void 0 ? void 0 : routine.split('.')[0].replace('_', '%');
                searchType = mumpsLineParser_1.TokenType.entryref;
                const externalLabel = searchToken + "^" + routine;
                // Check active document for entryrefs
                const docLines = document.getText().split('\n');
                for (let i = 0; i < docLines.length; i++) {
                    if (docLines[i].includes(externalLabel) || docLines[i].includes(searchToken)) {
                        let foundPosition = -1;
                        do {
                            const extPosition = docLines[i].indexOf(externalLabel, foundPosition + 1);
                            if (extPosition === -1) {
                                foundPosition = docLines[i].indexOf(searchToken, foundPosition + 1);
                                if (foundPosition === -1) {
                                    break;
                                }
                            }
                            else {
                                foundPosition = extPosition;
                            }
                            const token = parser.getTokenAt(docLines[i], foundPosition + 1);
                            if (token !== undefined && (token.name === externalLabel || token.name === searchToken) &&
                                (token.type === mumpsLineParser_1.TokenType.entryref || token.type === mumpsLineParser_1.TokenType.exfunction)) {
                                result.push(new vscode.Location(document.uri, new vscode.Range(i, foundPosition, i, foundPosition + token.name.length)));
                            }
                            // eslint-disable-next-line no-constant-condition
                        } while (true);
                    }
                }
                // Check all other documents and return result
                return this.getallLabelReferences(result, externalLabel, searchType);
            }
            else {
                if (searchType === mumpsLineParser_1.TokenType.local || searchType === mumpsLineParser_1.TokenType.global) {
                    return this.getallLabelReferences(result, searchToken, searchType);
                }
                return Promise.resolve(result);
            }
        }
        else {
            return Promise.resolve(result);
        }
    }
    getallLabelReferences(result, searchToken, searchType) {
        //result.push(new vscode.Location(vscode.Uri.file("X://AAFA02.m"), new vscode.Position(1, 1)));
        return new Promise(resolve => {
            vscode.workspace.findFiles('*.m').then((files) => {
                const filesToCheck = files.length;
                for (let i = 0; i < filesToCheck; i++) {
                    const path = files[i].fsPath;
                    fs.readFile(path, 'utf8', (err, content) => {
                        if (!err) {
                            if (content.includes(searchToken)) {
                                const lines = content.split('\n');
                                for (let i = 0; i < lines.length; i++) {
                                    if (lines[i].includes(searchToken)) {
                                        const foundPosition = lines[i].indexOf(searchToken);
                                        const token = parser.getTokenAt(lines[i], foundPosition + 1);
                                        if (token !== undefined && token.name === searchToken &&
                                            (token.type === searchType || (token.type === mumpsLineParser_1.TokenType.exfunction && searchType === mumpsLineParser_1.TokenType.entryref))) {
                                            result.push(new vscode.Location(vscode.Uri.file(path), new vscode.Range(i, foundPosition, i, foundPosition + token.name.length)));
                                        }
                                    }
                                }
                            }
                        }
                        if (i === filesToCheck - 1) {
                            resolve(result);
                        }
                    });
                }
            });
        });
    }
}
exports.default = MumpsReferenceProvider;
//# sourceMappingURL=mumpsReferenceProvider.js.map