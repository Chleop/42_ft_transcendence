"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.ChannelService = void 0;
var error_1 = require("./error");
var prisma_service_1 = require("../prisma/prisma.service");
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var runtime_1 = require("@prisma/client/runtime");
var argon2 = require("argon2");
var ChannelService = /** @class */ (function () {
    function ChannelService() {
        this._prisma = new prisma_service_1.PrismaService();
    }
    /**
     * @brief	Get channel's messages which have been sent after a specific one from the database.
     *
     * @param	id The id of the channel to get the messages from.
     * @param	message_id The id of the message to get the messages after.
     * @param	limit The maximum number of messages to get.
     *
     * @potential_throws
     * - ChannelNotFoundError
     * - ChannelMessageNotFoundError
     *
     * @return	A promise containing the wanted messages.
     */
    ChannelService.prototype._get_ones_messages_after_a_specific_message = function (id, message_id, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var message, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Getting messages after a specific message...");
                        return [4 /*yield*/, this._prisma.channelMessage.findUnique({
                                where: {
                                    id: message_id
                                },
                                select: {
                                    channelId: true,
                                    dateTime: true
                                }
                            })];
                    case 1:
                        message = _a.sent();
                        if (!(!message || message.channelId !== id)) return [3 /*break*/, 3];
                        console.log("Reference message not found");
                        return [4 /*yield*/, this._prisma.channel.count({
                                where: { id: id }
                            })];
                    case 2:
                        if (!(_a.sent())) {
                            console.log("Specified channel does not exist");
                            throw new error_1.ChannelNotFoundError(id);
                        }
                        throw new error_1.ChannelMessageNotFoundError(message_id);
                    case 3: return [4 /*yield*/, this._prisma.channelMessage.findMany({
                            where: {
                                channelId: id,
                                dateTime: {
                                    gt: message.dateTime
                                }
                            },
                            orderBy: {
                                dateTime: "asc"
                            },
                            take: limit
                        })];
                    case 4:
                        messages = _a.sent();
                        console.log("Messages found");
                        return [2 /*return*/, messages];
                }
            });
        });
    };
    /**
     * @brief	Get channel's messages which have been sent before a specific one from the database.
     *
     * @param	id The id of the channel to get the messages from.
     * @param	message_id The id of the message to get the messages before.
     * @param	limit The maximum number of messages to get.
     *
     * @potential_throws
     * - ChannelNotFoundError
     * - ChannelMessageNotFoundError
     *
     * @return	A promise containing the wanted messages.
     */
    ChannelService.prototype._get_ones_messages_before_a_specific_message = function (id, message_id, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var message, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Getting messages before a specific message...");
                        return [4 /*yield*/, this._prisma.channelMessage.findUnique({
                                where: {
                                    id: message_id
                                },
                                select: {
                                    channelId: true,
                                    dateTime: true
                                }
                            })];
                    case 1:
                        message = _a.sent();
                        if (!(!message || message.channelId !== id)) return [3 /*break*/, 3];
                        console.log("Reference message not found");
                        return [4 /*yield*/, this._prisma.channel.count({
                                where: { id: id }
                            })];
                    case 2:
                        if (!(_a.sent())) {
                            console.log("Specified channel does not exist");
                            throw new error_1.ChannelNotFoundError(id);
                        }
                        throw new error_1.ChannelMessageNotFoundError(message_id);
                    case 3: return [4 /*yield*/, this._prisma.channelMessage.findMany({
                            where: {
                                channelId: id,
                                dateTime: {
                                    lt: message.dateTime
                                }
                            },
                            orderBy: {
                                dateTime: "desc"
                            },
                            take: limit
                        })];
                    case 4:
                        messages = _a.sent();
                        console.log("Messages found");
                        // Get the most ancient messages first
                        messages.reverse();
                        return [2 /*return*/, messages];
                }
            });
        });
    };
    /**
     * @brief	Get channel's most recent messages from the database.
     *
     * @param	id The id of the channel to get the messages from.
     * @param	limit The maximum number of messages to get.
     *
     * @potential_throws
     * - ChannelNotFoundError
     *
     * @return	A promise containing the wanted messages.
     */
    ChannelService.prototype._get_ones_most_recent_messages = function (id, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Getting most recent messages...");
                        return [4 /*yield*/, this._prisma.channelMessage.findMany({
                                where: {
                                    channelId: id
                                },
                                orderBy: {
                                    dateTime: "desc"
                                },
                                take: limit
                            })];
                    case 1:
                        messages = _b.sent();
                        _a = !messages;
                        if (!_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._prisma.channel.count({
                                where: {
                                    id: id
                                }
                            })];
                    case 2:
                        _a = !(_b.sent());
                        _b.label = 3;
                    case 3:
                        if (_a) {
                            console.log("Specified channel does not exist");
                            throw new error_1.ChannelNotFoundError(id);
                        }
                        console.log("Messages found");
                        // Get the most ancient messages first
                        messages.reverse();
                        return [2 /*return*/, messages];
                }
            });
        });
    };
    /**
     * @brief	Create a new channel in the database.
     *
     * @param	dto The dto containing the data to create the channel.
     *
     * @potential_throws
     * - ChannelPasswordNotAllowedError
     * - ChannelFieldUnavailableError
     * - ChannelRelationNotFoundError
     * - UnknownError
     *
     * @return	A promise containing the created channel's data.
     */
    ChannelService.prototype.create_one = function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var type, channel, _a, _b, _c, error_2;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log("Determining channel type...");
                        if (dto.is_private) {
                            console.log("Channel type is PRIVATE");
                            type = client_1.ChanType.PRIVATE;
                            if (dto.password) {
                                throw new error_1.ChannelPasswordNotAllowedError();
                            }
                        }
                        else if (dto.password) {
                            console.log("Channel type is PROTECTED");
                            type = client_1.ChanType.PROTECTED;
                        }
                        else {
                            console.log("Channel type is PUBLIC");
                            type = client_1.ChanType.PUBLIC;
                        }
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 6, , 7]);
                        console.log("Creating channel...");
                        _b = (_a = this._prisma.channel).create;
                        _d = {};
                        _e = {
                            name: dto.name,
                            chanType: type
                        };
                        if (!dto.password) return [3 /*break*/, 3];
                        return [4 /*yield*/, argon2.hash(dto.password)];
                    case 2:
                        _c = _f.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _c = null;
                        _f.label = 4;
                    case 4: return [4 /*yield*/, _b.apply(_a, [(_d.data = (_e.hash = _c,
                                _e.owner = {
                                    connect: {
                                        id: dto.user_id
                                    }
                                },
                                _e.members = {
                                    connect: {
                                        id: dto.user_id
                                    }
                                },
                                _e.operators = {
                                    connect: {
                                        id: dto.user_id
                                    }
                                },
                                _e),
                                _d)])];
                    case 5:
                        channel = _f.sent();
                        console.log("Channel created");
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _f.sent();
                        console.log("Error occured while creating channel");
                        if (error_2 instanceof runtime_1.PrismaClientKnownRequestError) {
                            switch (error_2.code) {
                                case "P2002":
                                    throw new error_1.ChannelFieldUnavailableError("name");
                                case "P2025":
                                    throw new error_1.ChannelRelationNotFoundError("user");
                            }
                            console.log("PrismaClientKnownRequestError code was ".concat(error_2.code));
                        }
                        throw new error_1.UnknownError();
                    case 7:
                        channel.hash = null;
                        return [2 /*return*/, channel];
                }
            });
        });
    };
    /**
     * @brief	Delete a channel from the database.
     *
     * @param	id The id of the channel to delete.
     *
     * @potential_throws
     * - ChannelNotFoundError
     * - UnknownError
     *
     * @return	An empty promise.
     */
    ChannelService.prototype.delete_one = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Deleting channel's messages...");
                        return [4 /*yield*/, this._prisma.channelMessage.deleteMany({
                                where: {
                                    channelId: id
                                }
                            })];
                    case 1:
                        _a.sent();
                        console.log("Channel's messages deleted");
                        console.log("Deleting channel...");
                        return [4 /*yield*/, this._prisma.channel["delete"]({
                                where: {
                                    id: id
                                }
                            })];
                    case 2:
                        _a.sent();
                        console.log("Channel deleted");
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.log("Error occured while deleting channel");
                        if (error_3 instanceof runtime_1.PrismaClientKnownRequestError) {
                            switch (error_3.code) {
                                case "P2025":
                                    throw new error_1.ChannelNotFoundError(id);
                            }
                            console.log("PrismaClientKnownRequestError code was ".concat(error_3.code));
                        }
                        throw new error_1.UnknownError();
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @brief	Get channel's messages from the database.
     *
     * @param	id The id of the channel to get the messages from.
     * @param	dto The dto containing the data to get the messages.
     *
     * @potential_throws
     * - ChannelNotFoundError
     * - ChannelMessageNotFoundError
     *
     * @return	A promise containing the wanted messages.
     */
    ChannelService.prototype.get_ones_messages = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dto.before) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._get_ones_messages_before_a_specific_message(id, dto.before, dto.limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        if (!dto.after) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._get_ones_messages_after_a_specific_message(id, dto.after, dto.limit)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [4 /*yield*/, this._get_ones_most_recent_messages(id, dto.limit)];
                    case 5: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * @brief	Make an user join a channel.
     *
     * @param	id The id of the channel to join.
     * @param	dto The dto containing the data to join the channel.
     *
     * @potential_throws
     * - ChannelNotFoundError
     * - ChannelAlreadyJoinedError
     * - ChannelPasswordUnexpectedError
     * - ChannelInvitationIncorrectError
     * - ChannelInvitationUnexpectedError
     * - ChannelPasswordMissingError
     * - ChannelPasswordIncorrectError
     * - ChannelRelationNotFoundError
     * - UnknownError
     *
     * @return	A promise containing the joined channel's data.
     */
    ChannelService.prototype.join_one = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var channel, _a, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Searching for the channel to join...");
                        return [4 /*yield*/, this._prisma.channel.findUnique({
                                where: {
                                    id: id
                                }
                            })];
                    case 1:
                        channel = _b.sent();
                        if (!channel) {
                            throw new error_1.ChannelNotFoundError(id);
                        }
                        console.log("Checking for already joined...");
                        return [4 /*yield*/, this._prisma.channel.count({
                                where: {
                                    id: id,
                                    members: {
                                        some: { id: dto.joining_user_id }
                                    }
                                }
                            })];
                    case 2:
                        if (_b.sent()) {
                            throw new error_1.ChannelAlreadyJoinedError(id);
                        }
                        console.log("Checking channel type...");
                        if (!(channel.chanType === client_1.ChanType.PRIVATE)) return [3 /*break*/, 5];
                        console.log("Channel is private");
                        if (dto.password !== undefined) {
                            throw new error_1.ChannelPasswordUnexpectedError();
                        }
                        console.log("Checking invitation...");
                        _a = dto.inviting_user_id === undefined;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._prisma.channel.count({
                                where: {
                                    id: id,
                                    members: {
                                        some: { id: dto.inviting_user_id }
                                    }
                                }
                            })];
                    case 3:
                        _a = !(_b.sent());
                        _b.label = 4;
                    case 4:
                        if (_a) {
                            throw new error_1.ChannelInvitationIncorrectError();
                        }
                        return [3 /*break*/, 10];
                    case 5:
                        if (!(channel.chanType === client_1.ChanType.PROTECTED)) return [3 /*break*/, 9];
                        console.log("Channel is protected");
                        if (dto.inviting_user_id !== undefined) {
                            throw new error_1.ChannelInvitationUnexpectedError();
                        }
                        console.log("Checking password...");
                        if (!(dto.password === undefined)) return [3 /*break*/, 6];
                        throw new error_1.ChannelPasswordMissingError();
                    case 6: return [4 /*yield*/, argon2.verify(channel.hash, dto.password)];
                    case 7:
                        if (!(_b.sent())) {
                            throw new error_1.ChannelPasswordIncorrectError();
                        }
                        _b.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        console.log("Channel is public");
                        if (dto.password !== undefined) {
                            throw new error_1.ChannelPasswordUnexpectedError();
                        }
                        _b.label = 10;
                    case 10:
                        _b.trys.push([10, 12, , 13]);
                        console.log("Joining channel...");
                        return [4 /*yield*/, this._prisma.channel.update({
                                where: {
                                    id: id
                                },
                                data: {
                                    members: {
                                        connect: {
                                            id: dto.joining_user_id
                                        }
                                    }
                                }
                            })];
                    case 11:
                        channel = _b.sent();
                        console.log("Channel joined");
                        return [3 /*break*/, 13];
                    case 12:
                        error_4 = _b.sent();
                        console.log("Error occured while joining channel");
                        if (error_4 instanceof runtime_1.PrismaClientKnownRequestError) {
                            switch (error_4.code) {
                                case "P2025":
                                    throw new error_1.ChannelRelationNotFoundError("members");
                            }
                            console.log("PrismaClientKnownRequestError code was ".concat(error_4.code));
                        }
                        throw new error_1.UnknownError();
                    case 13:
                        channel.hash = null;
                        return [2 /*return*/, channel];
                }
            });
        });
    };
    /**
     * @brief	Make an user leave a channel.
     *
     * @param	id The id of the channel to leave.
     * @param	dto The dto containing the data to leave the channel.
     *
     * @potential_throws
     * - ChannelNotFoundError
     * - ChannelNotJoinedError
     *
     * @return	An empty promise.
     */
    ChannelService.prototype.leave_one = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching for the channel to leave...");
                        return [4 /*yield*/, this._prisma.channel.findUnique({
                                where: {
                                    id: id
                                }
                            })];
                    case 1:
                        channel = _a.sent();
                        if (!channel) {
                            throw new error_1.ChannelNotFoundError(id);
                        }
                        console.log("Checking for not joined...");
                        return [4 /*yield*/, this._prisma.channel.count({
                                where: {
                                    id: id,
                                    members: {
                                        some: { id: dto.user_id }
                                    }
                                }
                            })];
                    case 2:
                        if (!(_a.sent())) {
                            throw new error_1.ChannelNotJoinedError(id);
                        }
                        console.log("Leaving channel...");
                        return [4 /*yield*/, this._prisma.channel.update({
                                where: {
                                    id: id
                                },
                                data: {
                                    members: {
                                        disconnect: {
                                            id: dto.user_id
                                        }
                                    }
                                }
                            })];
                    case 3:
                        _a.sent();
                        console.log("Channel left");
                        return [2 /*return*/];
                }
            });
        });
    };
    ChannelService = __decorate([
        (0, common_1.Injectable)()
    ], ChannelService);
    return ChannelService;
}());
exports.ChannelService = ChannelService;
