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
exports.UserService = void 0;
var error_1 = require("./error");
var prisma_service_1 = require("../prisma/prisma.service");
var common_1 = require("@nestjs/common");
var runtime_1 = require("@prisma/client/runtime");
var fs_1 = require("fs");
var path_1 = require("path");
var UserService = /** @class */ (function () {
    function UserService() {
        this._prisma = new prisma_service_1.PrismaService();
    }
    /**
     * @brief	Create a new user in the database.
     *
     * @param	dto The dto containing the data to create the user.
     *
     * @potential_throws
     * - UserRelationNotFoundError
     * - UserFieldUnaivalableError
     * - UnknownError
     *
     * @return	A promise containing the id of the created user.
     */
    UserService.prototype.create_one = function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var skin, id, name_1, already_existing, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Getting default skin...");
                        return [4 /*yield*/, this._prisma.skin.findUnique({
                                where: {
                                    name: "Default"
                                },
                                select: {
                                    id: true
                                }
                            })];
                    case 1:
                        skin = _a.sent();
                        if (!skin) {
                            throw new error_1.UserRelationNotFoundError();
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 9]);
                        console.log("Creating user...");
                        name_1 = dto.login;
                        return [4 /*yield*/, this._prisma.user.count({
                                where: { name: name_1 }
                            })];
                    case 3:
                        already_existing = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!already_existing) return [3 /*break*/, 6];
                        (name_1 = "_" + name_1);
                        return [4 /*yield*/, this._prisma.user.count({
                                where: { name: name_1 }
                            })];
                    case 5:
                        (already_existing = _a.sent());
                        return [3 /*break*/, 4];
                    case 6: return [4 /*yield*/, this._prisma.user.create({
                            data: {
                                login: dto.login,
                                name: name_1,
                                skinId: skin.id
                            }
                        })];
                    case 7:
                        id = (_a.sent()).id;
                        console.log("User created");
                        return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        console.log("Error occured while creating user");
                        if (error_2 instanceof runtime_1.PrismaClientKnownRequestError) {
                            switch (error_2.code) {
                                case "P2002":
                                    throw new error_1.UserFieldUnaivalableError();
                            }
                            console.log("PrismaClientKnownRequestError code was ".concat(error_2.code));
                        }
                        throw new error_1.UnknownError();
                    case 9: return [2 /*return*/, id];
                }
            });
        });
    };
    /**
     * @brief	Delete a user from the database.
     *
     * @param	id The id of the user to delete.
     *
     * @potential_throws
     * - UserNotFoundError
     * - UnknownError
     *
     * @return	An empty promise.
     */
    UserService.prototype.delete_one = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Deleting user...");
                        return [4 /*yield*/, this._prisma.user["delete"]({
                                where: {
                                    id: id
                                }
                            })];
                    case 1:
                        _a.sent();
                        console.log("User deleted");
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.log("Error occured while deleting user");
                        if (error_3 instanceof runtime_1.PrismaClientKnownRequestError) {
                            switch (error_3.code) {
                                case "P2025":
                                    throw new error_1.UserNotFoundError();
                            }
                            console.log("PrismaClientKnownRequestError code was ".concat(error_3.code));
                            console.log("error being : ".concat(error_3));
                        }
                        throw new error_1.UnknownError();
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @brief	Get a user from the database.
     *
     * @param	name The name of the user to get.
     *
     * @potential_throws
     * - UserNotFoundError
     *
     * @return	A promise containing the wanted user.
     */
    UserService.prototype.get_one = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching user...");
                        return [4 /*yield*/, this._prisma.user.findUnique({
                                include: {
                                    skin: true,
                                    channels: true,
                                    gamesPlayed: true,
                                    gamesWon: true,
                                    friends: true,
                                    blocked: true
                                },
                                where: {
                                    id: id
                                }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new error_1.UserNotFoundError();
                        }
                        console.log("User found");
                        return [2 /*return*/, user];
                }
            });
        });
    };
    /**
     * @brief	Get a user's avatar from the database.
     *
     * @param	id The id of the user to get the avatar from.
     *
     * @potential_throws
     * - UserNotFoundError
     *
     * @return	A promise containing the wanted avatar.
     */
    UserService.prototype.get_ones_avatar = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching user...");
                        return [4 /*yield*/, this._prisma.user.findUnique({
                                select: {
                                    avatar: true
                                },
                                where: {
                                    id: id
                                }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new error_1.UserNotFoundError();
                        }
                        console.log("User found");
                        return [2 /*return*/, new common_1.StreamableFile((0, fs_1.createReadStream)((0, path_1.join)(process.cwd(), user.avatar)))];
                }
            });
        });
    };
    /**
     * @brief	Update a user in the database.
     *
     * @param	id The id of the user to update.
     * @param	dto The dto containing the fields to update.
     *
     * @potential_throws
     * - UserNotFoundError
     * - UserFieldUnaivalableError
     * - UnknownError
     *
     * @return	An empty promise.
     */
    UserService.prototype.update_one = function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching user...");
                        return [4 /*yield*/, this._prisma.user.findUnique({
                                where: {
                                    id: id
                                },
                                select: {
                                    name: true,
                                    email: true,
                                    twoFactAuth: true,
                                    skinId: true
                                }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new error_1.UserNotFoundError();
                        }
                        console.log("User found");
                        if (dto.name !== undefined)
                            user.name = dto.name;
                        // if (dto.email !== undefined) user.email = dto.email;
                        if (dto.two_fact_auth !== undefined)
                            user.twoFactAuth = dto.two_fact_auth;
                        if (dto.skin_id !== undefined)
                            user.skinId = dto.skin_id;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        console.log("Updating user...");
                        return [4 /*yield*/, this._prisma.user.update({
                                where: {
                                    id: id
                                },
                                data: user
                            })];
                    case 3:
                        _a.sent();
                        console.log("User updated");
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        console.log("Error occured while updating user");
                        if (error_4 instanceof runtime_1.PrismaClientKnownRequestError) {
                            switch (error_4.code) {
                                case "P2002":
                                    throw new error_1.UserFieldUnaivalableError();
                            }
                            console.log("PrismaClientKnownRequestError code was ".concat(error_4.code));
                        }
                        throw new error_1.UnknownError();
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @brief	Update a user's avatar in the database.
     *
     * @param	id The id of the user to update the avatar from.
     * @param	file The file containing the new avatar.
     *
     * @potential_throws
     * - UserNotFoundError
     * - UnknownError
     *
     * @return	An empty promise.
     */
    UserService.prototype.update_ones_avatar = function (id, file) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching user...");
                        return [4 /*yield*/, this._prisma.user.findUnique({
                                where: {
                                    id: id
                                },
                                select: {
                                    avatar: true
                                }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new error_1.UserNotFoundError();
                        }
                        console.log("User found");
                        console.log("Updating user's avatar...");
                        if (!(user.avatar === "resource/avatar/default.jpg")) return [3 /*break*/, 5];
                        console.log("User's avatar is default, creating new one");
                        user.avatar = "resource/avatar/".concat(id, ".jpg");
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        console.log("Updating user...");
                        return [4 /*yield*/, this._prisma.user.update({
                                where: {
                                    id: id
                                },
                                data: user
                            })];
                    case 3:
                        _a.sent();
                        console.log("User updated");
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        console.log("Error occured while updating user's avatar");
                        if (error_5 instanceof runtime_1.PrismaClientKnownRequestError) {
                            console.log("PrismaClientKnownRequestError code was ".concat(error_5.code));
                        }
                        throw new error_1.UnknownError();
                    case 5:
                        try {
                            console.log("Updating avatar's file...");
                            (0, fs_1.createWriteStream)((0, path_1.join)(process.cwd(), user.avatar)).write(file.buffer);
                            console.log("Avatar's file updated");
                        }
                        catch (error) {
                            if (error instanceof Error)
                                console.log("Error occured while writing avatar to disk: ".concat(error.message));
                            throw new error_1.UnknownError();
                        }
                        console.log("User's avatar updated");
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @brief	Get user id from its login.
     *
     * @param	login The login of the user to get.
     *
     * @potential_throws
     * - UserNotFoundError
     *
     * @return	A promise containing the wanted user id.
     */
    UserService.prototype.get_user_id_by_login = function (login) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching user...");
                        return [4 /*yield*/, this._prisma.user.findFirst({
                                where: {
                                    login: login
                                }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new error_1.UserNotFoundError();
                        }
                        console.log("User found");
                        return [2 /*return*/, user.id];
                }
            });
        });
    };
    UserService = __decorate([
        (0, common_1.Injectable)()
    ], UserService);
    return UserService;
}());
exports.UserService = UserService;
