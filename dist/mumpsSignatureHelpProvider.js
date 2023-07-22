"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mumpsTokenData_1 = require("./mumpsTokenData");
class MumpsSignatureHelpProvider {
    provideSignatureHelp(document, position) {
        const helper = new mumpsTokenData_1.MumpsTokenHelper(document, position);
        return helper.getTokenSignature();
    }
}
exports.default = MumpsSignatureHelpProvider;
//# sourceMappingURL=mumpsSignatureHelpProvider.js.map