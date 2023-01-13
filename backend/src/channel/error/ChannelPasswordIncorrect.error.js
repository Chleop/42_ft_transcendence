"use strict";
exports.__esModule = true;
exports.ChannelPasswordIncorrectError = void 0;
var ChannelPasswordIncorrectError = /** @class */ (function () {
    function ChannelPasswordIncorrectError() {
        this._name = "ChannelPasswordIncorrectError";
        this._message = "Provided channel password is incorrect";
    }
    Object.defineProperty(ChannelPasswordIncorrectError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChannelPasswordIncorrectError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return ChannelPasswordIncorrectError;
}());
exports.ChannelPasswordIncorrectError = ChannelPasswordIncorrectError;
