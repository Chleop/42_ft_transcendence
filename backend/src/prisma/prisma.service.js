"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PrismaService = void 0;
var config_1 = require("@nestjs/config");
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var PrismaService = /** @class */ (function (_super) {
    __extends(PrismaService, _super);
    function PrismaService() {
        var config = new config_1.ConfigService();
        var url = config.get("DATABASE_URL");
        if (url === undefined) {
            throw new Error("DATABASE_URL is undefined!");
        }
        return _super.call(this, {
            datasources: {
                db: {
                    url: url
                }
            }
        }) || this;
    }
    PrismaService = __decorate([
        (0, common_1.Injectable)()
    ], PrismaService);
    return PrismaService;
}(client_1.PrismaClient));
exports.PrismaService = PrismaService;
