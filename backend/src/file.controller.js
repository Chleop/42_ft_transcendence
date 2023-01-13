"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
exports.FileController = void 0;
var common_1 = require("@nestjs/common");
var fs_1 = require("fs");
var path_1 = require("path");
var FileController = /** @class */ (function () {
    function FileController() {
    }
    FileController.prototype.getIndex = function (res) {
        var file = (0, fs_1.createReadStream)((0, path_1.join)(process.cwd(), 'www/index.html'));
        res.set({
            'Content-Type': 'text/html'
        });
        return new common_1.StreamableFile(file);
    };
    FileController.prototype.getScript = function (res) {
        var file = (0, fs_1.createReadStream)((0, path_1.join)(process.cwd(), 'www/script.js'));
        res.set({
            'Content-Type': 'text/javascript'
        });
        return new common_1.StreamableFile(file);
    };
    FileController.prototype.getStyle = function (res) {
        var file = (0, fs_1.createReadStream)((0, path_1.join)(process.cwd(), 'www/style.css'));
        res.set({
            'Content-Type': 'text/css'
        });
        return new common_1.StreamableFile(file);
    };
    __decorate([
        (0, common_1.Get)(),
        __param(0, (0, common_1.Res)({ passthrough: true }))
    ], FileController.prototype, "getIndex");
    __decorate([
        (0, common_1.Get)("script.js"),
        __param(0, (0, common_1.Res)({ passthrough: true }))
    ], FileController.prototype, "getScript");
    __decorate([
        (0, common_1.Get)("style.css"),
        __param(0, (0, common_1.Res)({ passthrough: true }))
    ], FileController.prototype, "getStyle");
    FileController = __decorate([
        (0, common_1.Controller)()
    ], FileController);
    return FileController;
}());
exports.FileController = FileController;
