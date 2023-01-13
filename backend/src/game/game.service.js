"use strict";
exports.__esModule = true;
exports.GameService = void 0;
var room_1 = require("./room");
/* Matchmaking class */
/* Manage rooms, save scores in database */
var GameService = /** @class */ (function () {
    function GameService() {
        // this.prisma = new PrismaService();
        this.game_rooms = [];
        this.handshakes = [];
        this.queue = null;
    }
    /* == PUBLIC ================================================================================ */
    /* -- DATABASE LINKING ---------------------------------------------------- */
    // TODO get user infos in db
    GameService.prototype.decode = function (jwt) {
        // UserData
        return {
            id: jwt
        };
    };
    // TODO save score to db
    GameService.prototype.saveScore = function (room, results) {
        var match = room.match;
        try {
            if (results)
                console.info("Scores:", results);
            else
                console.info("Game ".concat(results, " cut short before it started"));
        }
        catch (e) {
            console.info(e);
        }
        this.destroyRoom(room);
        return match;
    };
    // public async registerGameHistory(room: GameRoom, results: ResultsObject): Promise<Match> {
    // 	const match: Match = room.match;
    // 	try {
    // 		/*const user = */await this.prisma.game.create({
    // 			data: {
    // 				players: {
    // 					connect: [{ id: match.player1.id }, { id: match.player2.id }],
    // 				},
    // 				winner: {
    // 					connect: {
    // 						id: results.player1.winner ? match.player1.id : match.player2.id,
    // 					},
    // 				},
    // 				scores: [results.player1.score, results.player2.score],
    // 				datetime: results.dateTime,
    // 			},
    // 		});
    // 	} catch (error) {
    // 		if (error instanceof PrismaClientKnownRequestError) {
    // 			switch (error.code) {
    // 				case "P2002":
    // 					throw new ConflictException("One of the provided fields is unavailable");
    // 				case "P2025":
    // 					throw new BadRequestException(
    // 						"One of the relations you tried to connect to does not exist",
    // 					);
    // 			}
    // 			console.log(error.code);
    // 		}
    // 		throw error;
    // 	}
    // 	this.destroyRoom(room);
    // 	return match;
    // }
    /* -- MATCHMAKING --------------------------------------------------------- */
    GameService.prototype.queueUp = function (user) {
        if (this.queue === null) {
            this.queue = user;
            return null;
        }
        var match = {
            name: this.queue.socket.id + user.socket.id,
            player1: this.queue,
            player2: user
        };
        this.queue = null;
        this.handshakes.push({
            match: match,
            shook: false
        });
        return match;
    };
    GameService.prototype.unQueue = function (client) {
        if (this.queue && this.queue.socket.id === client.id) {
            this.queue = null;
        }
        else {
            // The match wasn't accepted yet
            var handshake = this.findUserMatch(client);
            if (handshake !== undefined) {
                this.ignore(handshake.match);
                return handshake.match;
            }
            // The game was ongoing
            var index = this.findUserRoomIndex(client);
            if (!(index < 0)) {
                console.info("Kicked");
                var room = this.game_rooms[index];
                var match = this.saveScore(room, room.cutGameShort(room.playerNumber(client)));
                return match;
            }
        }
        return null;
    };
    GameService.prototype.playerAcknowledged = function (client) {
        var handshake = this.findUserMatch(client);
        if (handshake === undefined)
            // Tried to send ok before room creation/once game started
            throw "Received matchmaking acknowledgement but not awaiting";
        console.info("".concat(client.id, " accepted"));
        if (handshake.shook)
            return this.createRoom(handshake.match);
        handshake.shook = true;
        return null;
    };
    /* -- ROOM MANIPULATION --------------------------------------------------- */
    GameService.prototype.ignore = function (match) {
        var index = this.handshakes.findIndex(function (obj) {
            return obj.match.name === match.name;
        });
        if (index < 0)
            throw "Cannot ignore a match not made";
        this.handshakes.splice(index, 1);
    };
    GameService.prototype.destroyRoom = function (index) {
        if (typeof index !== "number") {
            var new_index = this.game_rooms.indexOf(index);
            if (new_index < 0)
                return;
            console.info("Destroying ".concat(index.match.name));
            index.destroyPing();
            this.game_rooms.splice(new_index, 1);
        }
        else {
            if (index < 0)
                return;
            console.info("Destroying ".concat(this.game_rooms[index].match.name));
            this.game_rooms[index].destroyPing();
            this.game_rooms.splice(index, 1);
        }
    };
    /* -- GAME UPDATING ------------------------------------------------------- */
    GameService.prototype.updateOpponent = function (client, dto) {
        var index = this.findUserRoomIndex(client);
        if (index < 0)
            throw "Paddle update received but not in game";
        return this.game_rooms[index].updatePaddle(client, dto);
    };
    /* -- UTILS --------------------------------------------------------------- */
    GameService.prototype.getUser = function (sock, authkey) {
        if (authkey !== "abc")
            throw "Wrong key";
        return {
            socket: sock,
            id: "xyz"
        };
    };
    GameService.prototype.display = function () {
        console.info({
            handshakes: this.handshakes,
            rooms: this.game_rooms
        });
    };
    /* == PRIVATE =============================================================================== */
    /* -- ROOM MANIPULATION --------------------------------------------------- */
    GameService.prototype.createRoom = function (match) {
        var room = new room_1.GameRoom(match);
        this.game_rooms.push(room);
        this.ignore(match);
        return room;
    };
    /* -- UTILS --------------------------------------------------------------- */
    GameService.prototype.findUserMatch = function (client) {
        var handshake = this.handshakes.find(function (obj) {
            return (obj.match.player1.socket.id === client.id ||
                obj.match.player2.socket.id === client.id);
        });
        return handshake;
    };
    GameService.prototype.findUserRoomIndex = function (client) {
        var index = this.game_rooms.findIndex(function (obj) {
            return obj.isClientInRoom(client);
        });
        return index;
    };
    return GameService;
}());
exports.GameService = GameService;
