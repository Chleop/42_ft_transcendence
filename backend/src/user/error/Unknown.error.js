"use strict";
exports.__esModule = true;
exports.UnknownError = void 0;
var UnknownError = /** @class */ (function () {
    function UnknownError() {
        this._name = "UnknownError";
        this._message = "Unknown error";
    }
    Object.defineProperty(UnknownError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UnknownError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return UnknownError;
}());
exports.UnknownError = UnknownError;
