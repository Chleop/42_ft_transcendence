"use strict";
exports.__esModule = true;
exports.ChannelPasswordNotAllowedError = void 0;
var ChannelPasswordNotAllowedError = /** @class */ (function () {
    function ChannelPasswordNotAllowedError() {
        this._name = "ChannelPasswordNotAllowedError";
        this._message = "Channel password is not allowed";
    }
    Object.defineProperty(ChannelPasswordNotAllowedError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelPasswordNotAllowedError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelPasswordNotAllowedError;
}());
exports.ChannelPasswordNotAllowedError = ChannelPasswordNotAllowedError;
