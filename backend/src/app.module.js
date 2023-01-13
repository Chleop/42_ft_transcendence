"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var config_1 = require("@nestjs/config");
var common_1 = require("@nestjs/common");
var user_module_1 = require("./user/user.module");
var channel_module_1 = require("./channel/channel.module");
var game_module_1 = require("./game/game.module");
// TODO: Delete this when file server is set up.
var file_module_1 = require("./file.module");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                channel_module_1.ChannelModule,
                config_1.ConfigModule.forRoot({
                    isGlobal: true
                }),
                user_module_1.UserModule,
                game_module_1.GameModule,
                // TODO: Remove this.
                file_module_1.FileModule
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
