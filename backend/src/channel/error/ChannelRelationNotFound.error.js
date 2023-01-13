"use strict";
exports.__esModule = true;
exports.ChannelRelationNotFoundError = void 0;
var ChannelRelationNotFoundError = /** @class */ (function () {
    function ChannelRelationNotFoundError(details) {
        this._name = "ChannelRelationNotFoundError";
        this._message = "Channel relation not found";
        if (details) {
            this._message += " (".concat(details, ")");
        }
    }
    Object.defineProperty(ChannelRelationNotFoundError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelRelationNotFoundError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelRelationNotFoundError;
}());
exports.ChannelRelationNotFoundError = ChannelRelationNotFoundError;
