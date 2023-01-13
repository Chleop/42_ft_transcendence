"use strict";
exports.__esModule = true;
exports.ChannelNotJoinedError = void 0;
var ChannelNotJoinedError = /** @class */ (function () {
    function ChannelNotJoinedError(details) {
        this._name = "ChannelNotJoinedError";
        this._message = "Channel is not joined";
        if (details) {
            this._message += " (".concat(details, ")");
        }
    }
    Object.defineProperty(ChannelNotJoinedError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelNotJoinedError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelNotJoinedError;
}());
exports.ChannelNotJoinedError = ChannelNotJoinedError;
