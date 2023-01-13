"use strict";
exports.__esModule = true;
exports.UserFieldUnaivalableError = void 0;
var UserFieldUnaivalableError = /** @class */ (function () {
    function UserFieldUnaivalableError() {
        this._name = "UserFieldUnaivalableError";
        this._message = "User field unavailable";
    }
    Object.defineProperty(UserFieldUnaivalableError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserFieldUnaivalableError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return UserFieldUnaivalableError;
}());
exports.UserFieldUnaivalableError = UserFieldUnaivalableError;
