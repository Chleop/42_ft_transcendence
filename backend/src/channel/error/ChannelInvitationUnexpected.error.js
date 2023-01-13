"use strict";
exports.__esModule = true;
exports.ChannelInvitationUnexpectedError = void 0;
var ChannelInvitationUnexpectedError = /** @class */ (function () {
    function ChannelInvitationUnexpectedError() {
        this._name = "ChannelInvitationUnexpectedError";
        this._message = "Unexpected provided channel invitation";
    }
    Object.defineProperty(ChannelInvitationUnexpectedError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelInvitationUnexpectedError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelInvitationUnexpectedError;
}());
exports.ChannelInvitationUnexpectedError = ChannelInvitationUnexpectedError;
