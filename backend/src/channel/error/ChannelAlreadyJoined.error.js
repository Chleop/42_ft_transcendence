"use strict";
exports.__esModule = true;
exports.ChannelAlreadyJoinedError = void 0;
var ChannelAlreadyJoinedError = /** @class */ (function () {
    function ChannelAlreadyJoinedError(details) {
        this._name = "ChannelAlreadyJoinedError";
        this._message = "Channel already joined";
        if (details) {
            this._message += " (".concat(details, ")");
        }
    }
    Object.defineProperty(ChannelAlreadyJoinedError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelAlreadyJoinedError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelAlreadyJoinedError;
}());
exports.ChannelAlreadyJoinedError = ChannelAlreadyJoinedError;
