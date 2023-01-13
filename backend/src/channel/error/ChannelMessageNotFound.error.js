"use strict";
exports.__esModule = true;
exports.ChannelMessageNotFoundError = void 0;
var ChannelMessageNotFoundError = /** @class */ (function () {
    function ChannelMessageNotFoundError(details) {
        this._name = "ChannelMessageNotFoundError";
        this._message = "No such channel message";
        if (details) {
            this._message += " (".concat(details, ")");
        }
    }
    Object.defineProperty(ChannelMessageNotFoundError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelMessageNotFoundError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelMessageNotFoundError;
}());
exports.ChannelMessageNotFoundError = ChannelMessageNotFoundError;
