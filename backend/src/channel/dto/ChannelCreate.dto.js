"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.ChannelCreateDto = void 0;
var class_validator_1 = require("class-validator");
var ChannelCreateDto = /** @class */ (function () {
    function ChannelCreateDto() {
        this.name = "";
        this.is_private = false;
        // TODO: Remove this when the authentification is implemented
        this.user_id = "";
    }
    __decorate([
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.IsString)()
    ], ChannelCreateDto.prototype, "name");
    __decorate([
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)()
    ], ChannelCreateDto.prototype, "password");
    __decorate([
        (0, class_validator_1.IsBoolean)()
    ], ChannelCreateDto.prototype, "is_private");
    __decorate([
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.IsString)()
    ], ChannelCreateDto.prototype, "user_id");
    return ChannelCreateDto;
}());
exports.ChannelCreateDto = ChannelCreateDto;
