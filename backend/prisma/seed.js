"use strict";
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
var client_1 = require("@prisma/client");
var argon2 = require("argon2");
var prisma = new client_1.PrismaClient();
function delay(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var skin, joke, random, _a, _b, general, jodufour, etran, majacque, cproesch, nmathieu, i;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, prisma.skin.create({
                        data: {
                            name: "Default",
                            url: "resource/skin/default.jpg"
                        }
                    })];
                case 1:
                    skin = _e.sent();
                    // Create default users
                    return [4 /*yield*/, prisma.user.createMany({
                            data: [
                                {
                                    login: "jodufour",
                                    name: "jodufour",
                                    email: "jodufour@student.42.fr",
                                    skinId: skin.id
                                },
                                {
                                    login: "etran",
                                    name: "etran",
                                    email: "etran@student.42.fr",
                                    skinId: skin.id
                                },
                                {
                                    login: "majacque",
                                    name: "majacque",
                                    email: "majacque@student.42.fr",
                                    skinId: skin.id
                                },
                                {
                                    login: "cproesch",
                                    name: "cproesch",
                                    email: "cproesch@student.42.fr",
                                    skinId: skin.id
                                },
                                {
                                    login: "nmathieu",
                                    name: "nmathieu",
                                    email: "nmathieu@student.42.fr",
                                    skinId: skin.id
                                },
                            ]
                        })];
                case 2:
                    // Create default users
                    _e.sent();
                    return [4 /*yield*/, prisma.channel.create({
                            data: {
                                name: "joke",
                                chanType: client_1.ChanType.PRIVATE,
                                owner: {
                                    connect: { name: "cproesch" }
                                }
                            }
                        })];
                case 3:
                    joke = _e.sent();
                    _b = (_a = prisma.channel).create;
                    _c = {};
                    _d = {
                        name: "random",
                        chanType: client_1.ChanType.PROTECTED,
                        owner: {
                            connect: { name: "cproesch" }
                        }
                    };
                    return [4 /*yield*/, argon2.hash("pouic")];
                case 4: return [4 /*yield*/, _b.apply(_a, [(_c.data = (_d.hash = _e.sent(),
                            _d),
                            _c)])];
                case 5:
                    random = _e.sent();
                    return [4 /*yield*/, prisma.channel.create({
                            data: {
                                name: "general",
                                chanType: client_1.ChanType.PUBLIC,
                                owner: {
                                    connect: { name: "cproesch" }
                                }
                            }
                        })];
                case 6:
                    general = _e.sent();
                    return [4 /*yield*/, prisma.channel.create({
                            data: {
                                name: "desert",
                                chanType: client_1.ChanType.PUBLIC,
                                owner: {
                                    connect: { name: "cproesch" }
                                }
                            }
                        })];
                case 7:
                    _e.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: {
                                name: "jodufour"
                            },
                            data: {
                                channels: {
                                    connect: [
                                        {
                                            name: "general"
                                        },
                                    ]
                                }
                            }
                        })];
                case 8:
                    jodufour = _e.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: {
                                name: "etran"
                            },
                            data: {
                                channels: {
                                    connect: [
                                        {
                                            name: "general"
                                        },
                                        {
                                            name: "random"
                                        },
                                    ]
                                }
                            }
                        })];
                case 9:
                    etran = _e.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: {
                                name: "majacque"
                            },
                            data: {
                                channels: {
                                    connect: [
                                        {
                                            name: "general"
                                        },
                                        {
                                            name: "joke"
                                        },
                                    ]
                                }
                            }
                        })];
                case 10:
                    majacque = _e.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: {
                                name: "cproesch"
                            },
                            data: {
                                channels: {
                                    connect: [
                                        {
                                            name: "random"
                                        },
                                        {
                                            name: "joke"
                                        },
                                    ]
                                }
                            }
                        })];
                case 11:
                    cproesch = _e.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: {
                                name: "nmathieu"
                            },
                            data: {
                                channels: {
                                    connect: [
                                        {
                                            name: "general"
                                        },
                                        {
                                            name: "random"
                                        },
                                        {
                                            name: "joke"
                                        },
                                    ]
                                }
                            }
                        })];
                case 12:
                    nmathieu = _e.sent();
                    i = 0;
                    _e.label = 13;
                case 13:
                    if (!(i < 100)) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.channelMessage.create({
                            data: {
                                content: "general: ".concat(i),
                                senderId: jodufour.id,
                                channelId: general.id
                            }
                        })];
                case 14:
                    _e.sent();
                    return [4 /*yield*/, delay(100)];
                case 15:
                    _e.sent();
                    _e.label = 16;
                case 16:
                    i++;
                    return [3 /*break*/, 13];
                case 17: return [4 /*yield*/, prisma.channelMessage.create({
                        data: {
                            content: "Hello World !",
                            senderId: jodufour.id,
                            channelId: general.id
                        }
                    })];
                case 18:
                    _e.sent();
                    return [4 /*yield*/, delay(100)];
                case 19:
                    _e.sent();
                    return [4 /*yield*/, prisma.channelMessage.create({
                            data: {
                                content: "How are you ?",
                                senderId: etran.id,
                                channelId: general.id
                            }
                        })];
                case 20:
                    _e.sent();
                    return [4 /*yield*/, delay(100)];
                case 21:
                    _e.sent();
                    return [4 /*yield*/, prisma.channelMessage.create({
                            data: {
                                content: "I'm fine, thanks !",
                                senderId: majacque.id,
                                channelId: general.id
                            }
                        })];
                case 22:
                    _e.sent();
                    return [4 /*yield*/, delay(100)];
                case 23:
                    _e.sent();
                    return [4 /*yield*/, prisma.channelMessage.create({
                            data: {
                                content: "Hola que tal ?",
                                senderId: cproesch.id,
                                channelId: random.id
                            }
                        })];
                case 24:
                    _e.sent();
                    return [4 /*yield*/, delay(100)];
                case 25:
                    _e.sent();
                    return [4 /*yield*/, prisma.channelMessage.create({
                            data: {
                                content: "Muy bien, gracias !",
                                senderId: nmathieu.id,
                                channelId: random.id
                            }
                        })];
                case 26:
                    _e.sent();
                    return [4 /*yield*/, delay(100)];
                case 27:
                    _e.sent();
                    return [4 /*yield*/, prisma.channelMessage.create({
                            data: {
                                content: "Did you get it ?...",
                                senderId: majacque.id,
                                channelId: joke.id
                            }
                        })];
                case 28:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })["catch"](function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
