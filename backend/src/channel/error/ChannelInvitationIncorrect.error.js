"use strict";
exports.__esModule = true;
exports.ChannelInvitationIncorrectError = void 0;
var ChannelInvitationIncorrectError = /** @class */ (function () {
    function ChannelInvitationIncorrectError() {
        this._name = "ChannelInvitationIncorrectError";
        this._message = "Incorrect channel invitation";
    }
    Object.defineProperty(ChannelInvitationIncorrectError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelInvitationIncorrectError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelInvitationIncorrectError;
}());
exports.ChannelInvitationIncorrectError = ChannelInvitationIncorrectError;
