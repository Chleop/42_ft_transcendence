"use strict";
exports.__esModule = true;
exports.UserRelationNotFoundError = void 0;
var UserRelationNotFoundError = /** @class */ (function () {
    function UserRelationNotFoundError() {
        this._name = "UserRelationNotFoundError";
        this._message = "User relation not found";
    }
    Object.defineProperty(UserRelationNotFoundError.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserRelationNotFoundError.prototype, "message", {
        get: function () {
            return this._message;
        },
        enumerable: false,
        configurable: true
    });
    return UserRelationNotFoundError;
}());
exports.UserRelationNotFoundError = UserRelationNotFoundError;
