"use strict";
exports.__esModule = true;
exports.ChannelNotFoundError = void 0;
var ChannelNotFoundError = /** @class */ (function () {
    function ChannelNotFoundError(details) {
        this._name = "ChannelNotFoundError";
        this._message = "No such channel";
        if (details) {
            this._message += " (".concat(details, ")");
        }
    }
    Object.defineProperty(ChannelNotFoundError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelNotFoundError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelNotFoundError;
}());
exports.ChannelNotFoundError = ChannelNotFoundError;
