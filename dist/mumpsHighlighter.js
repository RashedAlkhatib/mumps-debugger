"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticTokens = exports.MumpsHighlighter = void 0;
const vscode = require("vscode");
const mumpsLineParser_1 = require("./mumpsLineParser");
const tokenModifiers = ['standard'];
const subtype = "standard";
const tokentypes = Object.keys(mumpsLineParser_1.TokenType).map(key => mumpsLineParser_1.TokenType[key]);
const SemanticTokens = new vscode.SemanticTokensLegend(tokentypes, tokenModifiers);
exports.SemanticTokens = SemanticTokens;
const parser = new mumpsLineParser_1.MumpsLineParser();
//type: "global" | "local" | "exfunction" | "nonMfunction" | "entryref" | "operator" |
//      "keyword" | "ifunction" | "label" | "comment" | "sysvariable" | "string" | "number",
const MumpsHighlighter = {
    provideDocumentSemanticTokens(document) {
        // analyze the document and return semantic tokens
        const text = document.getText();
        const result = parser.analyzeLines(text);
        const tokensBuilder = new vscode.SemanticTokensBuilder(SemanticTokens);
        for (let line = 0; line < result.length; line++) {
            const tokens = result[line];
            for (let tokenId = 0; tokenId < tokens.length; tokenId++) {
                const t = tokens[tokenId];
                const type = t.type;
                if (type === mumpsLineParser_1.TokenType.exfunction) {
                    t.position -= 2; //Correct Position because of leading $$
                    t.name = "$$" + t.name;
                }
                if (t.position < 0) {
                    console.log(tokens);
                }
                tokensBuilder.push(new vscode.Range(new vscode.Position(line, t.position), new vscode.Position(line, t.position + t.name.length)), mumpsLineParser_1.TokenType[type], [subtype]);
            }
        }
        return tokensBuilder.build();
    }
};
exports.MumpsHighlighter = MumpsHighlighter;
//# sourceMappingURL=mumpsHighlighter.js.map