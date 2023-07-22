"use strict";
/*
    Implementation of DebugProtocol-Server for GT.M, Yottadb by Jens Wulf
    based on Mock-Debug by Microsoft Corp.
    License: LGPL
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const debugadapter_1 = require("@vscode/debugadapter");
const path_1 = require("path");
const await_notify_1 = require("await-notify");
const mumpsConnect_1 = require("./mumpsConnect");
const vscode = require("vscode");
const fs_1 = require("fs");
const getIpAddress = require("local-ipv4-address");
const MUMPSDIAGNOSTICS = vscode.languages.createDiagnosticCollection("mumps");
class MumpsDebugSession extends debugadapter_1.DebugSession {
    /**
     * Creates a new debug adapter that is used for one debug session.
     * We configure the default implementation of a debug adapter here.
     */
    constructor() {
        super();
        this._variableHandles = new debugadapter_1.Handles();
        this._variableBases = {};
        this._configurationDone = new await_notify_1.Subject();
        this._localScope = this._variableHandles.create("~local|0");
        this._systemScope = this._variableHandles.create("~system");
        // this debugger uses zero-based lines and columns
        this.setDebuggerLinesStartAt1(false);
        this.setDebuggerColumnsStartAt1(false);
        this._program = "";
        this._mconnect = new mumpsConnect_1.MumpsConnect();
        // setup event handlers
        this._mconnect.on('stopOnEntry', () => {
            this.sendEvent(new debugadapter_1.StoppedEvent('entry', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnStep', () => {
            this.sendEvent(new debugadapter_1.StoppedEvent('step', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnBreakpoint', () => {
            this.sendEvent(new debugadapter_1.StoppedEvent('breakpoint', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnDataBreakpoint', () => {
            this.sendEvent(new debugadapter_1.StoppedEvent('data breakpoint', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnException', () => {
            this.sendEvent(new debugadapter_1.StoppedEvent('exception', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('breakpointValidated', (bp) => {
            this.sendEvent(new debugadapter_1.BreakpointEvent('changed', { verified: bp.verified, id: bp.id }));
        });
        this._mconnect.on('end', () => {
            this.sendEvent(new debugadapter_1.TerminatedEvent());
        });
    }
    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    initializeRequest(response) {
        // build and return the capabilities of this debug adapter:
        response.body = response.body || {};
        // the adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        // make VS Code to use 'evaluate' when hovering over source
        response.body.supportsEvaluateForHovers = true;
        // make VS Code to support data breakpoints
        response.body.supportsDataBreakpoints = false;
        response.body.supportsConditionalBreakpoints = true;
        // make VS Code to support completion in REPL
        response.body.supportsCompletionsRequest = false;
        response.body.completionTriggerCharacters = [".", "["];
        // make VS Code to send cancelRequests
        response.body.supportsCancelRequest = false;
        // make VS Code send the breakpointLocations request
        response.body.supportsBreakpointLocationsRequest = true;
        response.body.supportsExceptionInfoRequest = true;
        response.body.supportsRestartRequest = true;
        // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
        // we request them early by sending an 'initializeRequest' to the frontend.
        // The frontend will end the configuration sequence by calling 'configurationDone' request.
        this.sendResponse(response);
        this.sendEvent(new debugadapter_1.InitializedEvent());
    }
    /**
     * Called at the end of the configuration sequence.
     * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
     */
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        // notify the launchRequest that configuration has finished
        this._configurationDone.notify();
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            var newPort = require('portfinder');
            newPort.setBasePort(3000); // default: 8000
            newPort.setHighestPort(3333);
            this._mdebugPort = yield newPort.getPortPromise();
            let _mdebugTerminal = vscode.window.createTerminal({
                name: `Debug`,
                color: new vscode.ThemeColor('terminal.ansiRed'),
                iconPath: { id: 'bug' },
                location: 1
            });
            const parentTerminal = _mdebugTerminal;
            parentTerminal.sendText('GTM');
            parentTerminal.sendText('S emptPort=' + this._mdebugPort);
            parentTerminal.sendText('W "your port is"');
            parentTerminal.sendText('W emptPort');
            (yield parentTerminal).sendText('DO ^MDEBUG');
            yield parentTerminal.processId;
            this._debugTerminal = parentTerminal;
            yield new Promise((resolve) => {
                setTimeout(() => {
                    console.log(`Waited ${20} seconds`);
                    // Code to be executed after the specified time
                    resolve();
                }, 20 * 1000); // Multiply by 1000 to convert seconds to milliseconds
            });
            ;
            parentTerminal.hide();
            // make sure to 'Stop' the buffered logging if 'trace' is not set
            //logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);
            // wait until configuration has finished (and configurationDoneRequest has been called)
            yield this._configurationDone.wait(1000);
            this._ipAddress = yield getIpAddress().then(function (ipAddress) {
                return ipAddress;
            });
            // start the program in the runtime
            this._mconnect.init(this._ipAddress, this._mdebugPort, args.localRoutinesPath).then(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                this.refreshDiagnostics((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document, MUMPSDIAGNOSTICS);
                this._mconnect.start(args.program, !!args.stopOnEntry);
                this._program = args.program;
                this.sendResponse(response);
            })).catch(() => {
                vscode.window.showErrorMessage("Connection to MDEBUG failed. \nPlease start MDEBUG first.");
            });
        });
    }
    setBreakPointsRequest(response, args) {
        const path = args.source.path;
        this._mconnect.clearBreakpoints(path);
        const actualBreakpoints = this._mconnect.setBreakPoint(path, args.breakpoints);
        // send back the actual breakpoint positions
        response.body = {
            breakpoints: actualBreakpoints
        };
        this.sendResponse(response);
        this._mconnect.requestBreakpoints();
    }
    threadsRequest(response) {
        // runtime supports no threads so just return a default thread.
        response.body = {
            threads: [
                new debugadapter_1.Thread(MumpsDebugSession.THREAD_ID, "thread 1")
            ]
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response, args) {
        const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
        const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
        const endFrame = startFrame + maxLevels;
        const stk = this._mconnect.stack(startFrame, endFrame);
        response.body = {
            stackFrames: stk.frames.map(f => new debugadapter_1.StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line))),
            totalFrames: stk.count
        };
        if (stk.count === 0) {
            this.sendEvent(new debugadapter_1.TerminatedEvent());
        }
        this.sendResponse(response);
    }
    scopesRequest(response) {
        response.body = {
            scopes: [
                new debugadapter_1.Scope("Local", this._localScope, false),
                new debugadapter_1.Scope("System", this._systemScope, false)
            ]
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const variables = [];
            let insertVariable;
            const varReference = args.variablesReference;
            const varId = this._variableHandles.get(args.variablesReference);
            if (varReference === this._systemScope) {
                const varObject = this._mconnect.getVariables("system");
                for (const varname in varObject) {
                    variables.push({
                        name: varname,
                        type: 'string',
                        value: varObject[varname],
                        variablesReference: 0
                    });
                }
            }
            else {
                const varparts = varId.split("|");
                const indexCount = parseInt(varparts.pop() || "0");
                const varBase = varparts.join("|");
                const varObject = this._mconnect.getVariables("local");
                let lastVar = undefined;
                let lastRef = "";
                for (const varname in varObject) {
                    const actualVar = this.varAnalyze(varname, varObject[varname]);
                    if (lastVar === undefined) { //First Variable not processed
                        lastVar = actualVar;
                        continue;
                    }
                    // eslint-disable-next-line no-cond-assign
                    if (insertVariable = this._checkVars(lastVar, actualVar, indexCount, varBase, lastRef)) {
                        if (insertVariable.variablesReference !== 0) {
                            lastRef = lastVar.bases[indexCount];
                        }
                        variables.push(insertVariable);
                    }
                    lastVar = actualVar;
                }
                if (lastVar !== undefined) { // process Last Variable if there was minimum one
                    const dummyVar = { name: "", "indexCount": 0, "bases": [], "content": "" };
                    const insertVariable = this._checkVars(lastVar, dummyVar, indexCount, varBase, lastRef);
                    if (insertVariable) {
                        variables.push(insertVariable);
                    }
                }
            }
            response.body = {
                variables: variables
            };
            this.sendResponse(response);
        });
    }
    //checkVars checks if Variable has to be inserted in Var-Display and if it has descendants
    _checkVars(lastVar, actualVar, indexCount, varBase, lastRef) {
        let returnVar = undefined;
        let actualReference = 0;
        if (indexCount === 0 || (lastVar.bases[indexCount - 1] === varBase && lastVar.indexCount > indexCount)) {
            if (lastVar.indexCount > indexCount + 1) {
                if (lastRef !== lastVar.bases[indexCount]) {
                    let name = lastVar.bases[indexCount];
                    if (indexCount > 0) {
                        name += ")";
                    }
                    if (this._variableBases[lastVar.bases[indexCount]] === undefined) {
                        this._variableBases[lastVar.bases[indexCount]] = this._variableHandles.create(lastVar.bases[indexCount] + "|" + (indexCount + 1));
                    }
                    returnVar = {
                        name,
                        type: 'string',
                        value: 'undefined',
                        variablesReference: this._variableBases[lastVar.bases[indexCount]]
                    };
                }
            }
            else { //lastVar.indexCount==indexCount+1
                if (lastVar.bases[indexCount] === actualVar.bases[indexCount]) {
                    if (this._variableBases[lastVar.bases[indexCount]] === undefined) {
                        this._variableBases[lastVar.bases[indexCount]] = this._variableHandles.create(lastVar.bases[indexCount] + "|" + (indexCount + 1));
                    }
                    actualReference = this._variableBases[lastVar.bases[indexCount]];
                }
                returnVar = {
                    name: lastVar.name,
                    type: 'string',
                    value: lastVar.content,
                    variablesReference: actualReference
                };
            }
        }
        return returnVar;
    }
    continueRequest(response) {
        this._mconnect.continue();
        this.sendResponse(response);
    }
    nextRequest(response) {
        this._mconnect.step("OVER");
        this.sendResponse(response);
    }
    stepInRequest(response) {
        this._mconnect.step("INTO");
        this.sendResponse(response);
    }
    stepOutRequest(response) {
        this._mconnect.step("OUTOF");
        this.sendResponse(response);
    }
    evaluateRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.context === "hover" || args.context === "repl") {
                this._mconnect.getSingleVar(args.expression).then((varReply) => {
                    response.body = {
                        result: varReply.name + " := " + varReply.content,
                        variablesReference: 0
                    };
                    if (!args.expression.includes(")") && this._variableBases[args.expression] !== undefined) {
                        response.body.variablesReference = this._variableBases[args.expression];
                    }
                    this.sendResponse(response);
                });
            }
        });
    }
    restartRequest(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const sourceLines = (0, fs_1.readFileSync)(this._program).toString().split('\n');
            this._mconnect.checkRoutine(sourceLines).then((errorLines) => {
                if (errorLines.length) {
                    vscode.window.showErrorMessage("File contains Problems - No Restart possible!");
                }
                else {
                    this._mconnect.restart(this._program);
                }
            });
            this.sendResponse(response);
        });
    }
    disconnectRequest(response) {
        this._mconnect.disconnect();
        let _mdebugTerminal = vscode.window.createTerminal({
            name: `Debug`,
            color: new vscode.ThemeColor('terminal.ansiRed'),
            iconPath: { id: 'bug' },
            location: 1
        });
        _mdebugTerminal.sendText('fuser -n tcp -k ' + this._mdebugPort);
        this._debugTerminal.dispose();
        _mdebugTerminal.dispose();
        this._mconnect.disconnect();
        this.sendResponse(response);
    }
    createSource(filePath) {
        return new debugadapter_1.Source((0, path_1.basename)(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, 'mumps-adapter-data');
    }
    exceptionInfoRequest(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const statVariable = yield this._mconnect.getSingleVar("$ZSTATUS");
            const status = statVariable.content.split(",");
            const trashlength = status[0].length + status[1].length + status[2].length + 4;
            const description = statVariable.content.substr(trashlength);
            response.body = {
                exceptionId: status[2],
                description,
                breakMode: 'always',
                details: {
                    message: 'Line :' + status[1],
                    typeName: 'ErrorException',
                }
            };
            this.sendResponse(response);
        });
    }
    varAnalyze(varname, content) {
        let indexcount = 1;
        const bases = [];
        const length = varname.length;
        const klammerpos = varname.indexOf("(");
        let countKomma = true;
        //let lastKommaPos = varname.length;
        if (klammerpos > 0) {
            bases.push(varname.substring(0, klammerpos));
            indexcount++;
            //lastKommaPos = klammerpos;
            for (let i = klammerpos; i < length; i++) {
                if (varname.substring(i, i + 1) === "," && countKomma) {
                    bases.push(varname.substring(0, i));
                    indexcount++;
                    //lastKommaPos = i;
                }
                if (varname.substring(i, i + 1) === '"') {
                    countKomma = !countKomma;
                }
            }
            bases.push(varname.substring(0, varname.length - 1));
        }
        else {
            bases.push(varname);
        }
        return { "name": varname, "indexCount": indexcount, "bases": bases, content };
    }
    refreshDiagnostics(doc, mumpsDiagnostics) {
        const diagnostics = [];
        if (doc) {
            const lines = doc.getText().split("\n");
            this._mconnect.checkRoutine(lines).then((errLines) => {
                for (let i = 0; i < errLines.length; i++) {
                    const errData = errLines[i].split(";");
                    let column = parseInt(errData[0]) - 1;
                    if (isNaN(column)) {
                        column = 0;
                    }
                    let line = parseInt(errData[1]) - 1;
                    if (isNaN(line)) {
                        line = 0;
                    }
                    let endColumn = doc.lineAt(line).text.length;
                    if (line === 0 && column === 0) {
                        endColumn = 0;
                    }
                    const message = errData[2];
                    const range = new vscode.Range(line, column, line, endColumn);
                    const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                    diagnostic.code = message;
                    diagnostics.push(diagnostic);
                }
                mumpsDiagnostics.clear();
                mumpsDiagnostics.set(doc.uri, diagnostics);
            });
        }
    }
}
// we don't support multiple threads, so we can use a hardcoded ID for the default thread
MumpsDebugSession.THREAD_ID = 1;
exports.default = MumpsDebugSession;
//# sourceMappingURL=mumpsDebug.js.map