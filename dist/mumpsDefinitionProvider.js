"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mumpsTokenData_1 = require("./mumpsTokenData");
class MumpsDefinitionProvider {
    provideDefinition(document, position) {
        const helper = new mumpsTokenData_1.MumpsTokenHelper(document, position);
        return helper.getTokenRefLocation();
    }
}
exports.default = MumpsDefinitionProvider;
//# sourceMappingURL=mumpsDefinitionProvider.js.map