"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.ChannelModule = void 0;
var common_1 = require("@nestjs/common");
var prisma_module_1 = require("../prisma/prisma.module");
var channel_controller_1 = require("./channel.controller");
var channel_service_1 = require("./channel.service");
var ChannelModule = /** @class */ (function () {
    function ChannelModule() {
    }
    ChannelModule = __decorate([
        (0, common_1.Module)({
            controllers: [channel_controller_1.ChannelController],
            imports: [prisma_module_1.PrismaModule],
            providers: [channel_service_1.ChannelService]
        })
    ], ChannelModule);
    return ChannelModule;
}());
exports.ChannelModule = ChannelModule;
