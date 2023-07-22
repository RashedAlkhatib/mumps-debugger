"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mumpsTokenData_1 = require("./mumpsTokenData");
class MumpsHoverProvider {
    provideHover(document, position) {
        const helper = new mumpsTokenData_1.MumpsTokenHelper(document, position);
        return helper.getTokenHoverInfo();
    }
}
exports.default = MumpsHoverProvider;
//# sourceMappingURL=mumpsHoverProvider.js.map