"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sleepSync(milliseconds) {
    var end = Date.now() + milliseconds;
    while (Date.now() < end) { }
}
exports.sleepSync = sleepSync;
//# sourceMappingURL=utils.js.map