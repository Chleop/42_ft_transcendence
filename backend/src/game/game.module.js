"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.GameModule = void 0;
var common_1 = require("@nestjs/common");
var game_gateway_1 = require("./game.gateway");
//TODO: Middleware
/* Will handle information exchanges between back and front */
var GameModule = /** @class */ (function () {
    function GameModule() {
    }
    GameModule = __decorate([
        (0, common_1.Module)({
            providers: [game_gateway_1.GameGateway]
        })
    ], GameModule);
    return GameModule;
}());
exports.GameModule = GameModule;
