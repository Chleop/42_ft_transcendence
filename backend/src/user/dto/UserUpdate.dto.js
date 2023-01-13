"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.UserUpdateDto = void 0;
var class_validator_1 = require("class-validator");
var UserUpdateDto = /** @class */ (function () {
    function UserUpdateDto() {
    }
    __decorate([
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)()
    ], UserUpdateDto.prototype, "name");
    __decorate([
        (0, class_validator_1.IsEmail)(),
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)()
    ], UserUpdateDto.prototype, "email");
    __decorate([
        (0, class_validator_1.IsBoolean)(),
        (0, class_validator_1.IsOptional)()
    ], UserUpdateDto.prototype, "two_fact_auth");
    __decorate([
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)()
    ], UserUpdateDto.prototype, "skin_id");
    return UserUpdateDto;
}());
exports.UserUpdateDto = UserUpdateDto;
