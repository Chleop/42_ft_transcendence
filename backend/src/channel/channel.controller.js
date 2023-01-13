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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ChannelController = void 0;
var channel_service_1 = require("./channel.service");
var common_1 = require("@nestjs/common");
var error_1 = require("./error");
var ChannelController = /** @class */ (function () {
    function ChannelController() {
        this._channel_service = new channel_service_1.ChannelService();
    }
    ChannelController.prototype.create_one = function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var channel, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._channel_service.create_one(dto)];
                    case 1:
                        channel = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        if (error_2 instanceof error_1.ChannelPasswordNotAllowedError ||
                            error_2 instanceof error_1.ChannelRelationNotFoundError) {
                            console.log(error_2.message);
                            throw new common_1.BadRequestException(error_2.message);
                        }
                        if (error_2 instanceof error_1.ChannelFieldUnavailableError) {
                            console.log(error_2.message);
                            throw new common_1.ForbiddenException(error_2.message);
                        }
                        if (error_2 instanceof error_1.UnknownError) {
                            console.log(error_2.message);
                            throw new common_1.InternalServerErrorException(error_2.message);
                        }
                        console.log("Unknown error type, this should not happen");
                        throw new common_1.InternalServerErrorException();
                    case 3: return [2 /*return*/, channel];
                }
            });
        });
    };
    ChannelController.prototype.delete_one = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._channel_service.delete_one(id)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        if (error_3 instanceof error_1.ChannelNotFoundError) {
                            console.log(error_3.message);
                            throw new common_1.BadRequestException(error_3.message);
                        }
                        if (error_3 instanceof error_1.UnknownError) {
                            console.log(error_3.message);
                            throw new common_1.InternalServerErrorException(error_3.message);
                        }
                        console.log("Unknown error type, this should not happen");
                        throw new common_1.InternalServerErrorException();
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ChannelController.prototype.get_ones_messages = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (dto.after && dto.before) {
                            throw new common_1.BadRequestException("Unexpected both `before` and `after` received");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this._channel_service.get_ones_messages(id, dto)];
                    case 2:
                        messages = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        if (error_4 instanceof error_1.ChannelNotFoundError ||
                            error_4 instanceof error_1.ChannelMessageNotFoundError) {
                            console.log(error_4.message);
                            throw new common_1.BadRequestException(error_4.message);
                        }
                        console.log("Unknown error type, this should not happen");
                        throw new common_1.InternalServerErrorException();
                    case 4: return [2 /*return*/, messages];
                }
            });
        });
    };
    ChannelController.prototype.join_one = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var channel, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._channel_service.join_one(id, dto)];
                    case 1:
                        channel = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        if (error_5 instanceof error_1.ChannelNotFoundError ||
                            error_5 instanceof error_1.ChannelAlreadyJoinedError ||
                            error_5 instanceof error_1.ChannelPasswordUnexpectedError ||
                            error_5 instanceof error_1.ChannelInvitationIncorrectError ||
                            error_5 instanceof error_1.ChannelInvitationUnexpectedError ||
                            error_5 instanceof error_1.ChannelPasswordMissingError ||
                            error_5 instanceof error_1.ChannelPasswordIncorrectError ||
                            error_5 instanceof error_1.ChannelRelationNotFoundError) {
                            console.log(error_5.message);
                            throw new common_1.BadRequestException(error_5.message);
                        }
                        if (error_5 instanceof error_1.UnknownError) {
                            console.log(error_5.message);
                            throw new common_1.InternalServerErrorException(error_5.message);
                        }
                        console.log("Unknown error type, this should not happen");
                        throw new common_1.InternalServerErrorException();
                    case 3: return [2 /*return*/, channel];
                }
            });
        });
    };
    ChannelController.prototype.leave_one = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._channel_service.leave_one(id, dto)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        if (error_6 instanceof error_1.ChannelNotFoundError || error_6 instanceof error_1.ChannelNotJoinedError) {
                            console.log(error_6.message);
                            throw new common_1.BadRequestException(error_6.message);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Post)(),
        (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
        __param(0, (0, common_1.Body)())
    ], ChannelController.prototype, "create_one");
    __decorate([
        (0, common_1.Delete)(":id"),
        __param(0, (0, common_1.Param)("id"))
    ], ChannelController.prototype, "delete_one");
    __decorate([
        (0, common_1.Get)(":id/message"),
        (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
        __param(0, (0, common_1.Param)("id")),
        __param(1, (0, common_1.Query)())
    ], ChannelController.prototype, "get_ones_messages");
    __decorate([
        (0, common_1.Patch)(":id/join"),
        (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
        __param(0, (0, common_1.Param)("id")),
        __param(1, (0, common_1.Body)())
    ], ChannelController.prototype, "join_one");
    __decorate([
        (0, common_1.Patch)(":id/leave"),
        (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
        __param(0, (0, common_1.Param)("id")),
        __param(1, (0, common_1.Body)())
    ], ChannelController.prototype, "leave_one");
    ChannelController = __decorate([
        (0, common_1.Controller)("channel")
    ], ChannelController);
    return ChannelController;
}());
exports.ChannelController = ChannelController;
