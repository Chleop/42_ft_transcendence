"use strict";
exports.__esModule = true;
exports.ChannelPasswordMissingError = void 0;
var ChannelPasswordMissingError = /** @class */ (function () {
    function ChannelPasswordMissingError() {
        this._name = "ChannelPasswordMissingError";
        this._message = "No channel password provided although it is required";
    }
    Object.defineProperty(ChannelPasswordMissingError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelPasswordMissingError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelPasswordMissingError;
}());
exports.ChannelPasswordMissingError = ChannelPasswordMissingError;
