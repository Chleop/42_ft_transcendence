"use strict";
exports.__esModule = true;
exports.ChannelPasswordUnexpectedError = void 0;
var ChannelPasswordUnexpectedError = /** @class */ (function () {
    function ChannelPasswordUnexpectedError() {
        this._name = "ChannelPasswordUnexpectedError";
        this._message = "Unexpected provided channel password";
    }
    Object.defineProperty(ChannelPasswordUnexpectedError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelPasswordUnexpectedError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelPasswordUnexpectedError;
}());
exports.ChannelPasswordUnexpectedError = ChannelPasswordUnexpectedError;
