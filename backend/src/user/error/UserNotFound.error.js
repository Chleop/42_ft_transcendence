"use strict";
exports.__esModule = true;
exports.UserNotFoundError = void 0;
var UserNotFoundError = /** @class */ (function () {
    function UserNotFoundError() {
        this._name = "UserNotFoundError";
        this._message = "No such user";
    }
    Object.defineProperty(UserNotFoundError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserNotFoundError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return UserNotFoundError;
}());
exports.UserNotFoundError = UserNotFoundError;
