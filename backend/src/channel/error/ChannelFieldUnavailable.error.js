"use strict";
exports.__esModule = true;
exports.ChannelFieldUnavailableError = void 0;
var ChannelFieldUnavailableError = /** @class */ (function () {
    function ChannelFieldUnavailableError(details) {
        this._name = "ChannelFieldUnavailableError";
        this._message = "Channel field unavailable";
        if (details) {
            this._message += " (".concat(details, ")");
        }
    }
    Object.defineProperty(ChannelFieldUnavailableError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelFieldUnavailableError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelFieldUnavailableError;
}());
exports.ChannelFieldUnavailableError = ChannelFieldUnavailableError;
