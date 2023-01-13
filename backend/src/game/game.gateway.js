"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.GameGateway = void 0;
var websockets_1 = require("@nestjs/websockets");
var socket_io_1 = require("socket.io");
var game_service_1 = require("./game.service");
var objects_1 = require("./objects");
var Constants = require("./constants/constants");
/* TODO:
     - handle spectators
*/
/* === EVENT LIST ==================================================================================

From the client:
    - `connection`
        implicitly handled by 'handleConnection'.
        the jwt token must be checked and the client is registed in the matchmaking queue.
        if another client was in the queue, they are matched in 'matchmake'.

    - `disconnect`
        implicitly handled by 'handleDisconnect'.
        if the client was not in the queue, they are simply disconnected.
        if they were matched with another client (or in a game), they both are disconnected.

    - `ok`
        handled by 'matchAccepted'.
        once the client is matched with another, they'll each have to accept by sending
        an 'ok' event.

    - `update`
        handled by 'updateOpponent'.
        during the game, the client will regularly send their paddle position to the gateway.
        the gateway will check those values (TODO: anticheat), and, if the data seems accurate,
        it is sent to their opponent.

    - `stop`
        will simply disconnect the client.
        temporary, this is meant to test the setInterval stuff

From the server:
    - `connected`
        sent to the client as an acknowledgement of their initial connection.

    - `matchFound`
        once two clients are matched, they are sent this event.
        the gateway will then await for both matched client to send the `ok` event.

    - `timedOut` // deprecated: useless if disconnect
        if the two clients that were awaited didn't both accept, they get timed out and removed from
        the queue.

    - `unQueue` // deprecated: useless if disconnect
        if the client was in the queue or in a game and suddenly disconnects, their opponent is
        notified via the `unQueue` event and both are properly disconnected.

    - `gameReady`
        when the two clients matched have accepted the game, they are alerted with this event.
        each gets sent their opponent id for the front-end (eg. to display each other's profile).

    - `gameStart`
        3 seconds after the two players get matched, they get sent this event which contains the
        initial ball position and velocity vector data object.

    - `updateOpponent`
        when the gateway receives an update from a client, it processes it then sends it to the
        client's opponent, labeled with this event.

    - `updateGame`
        every 20 milliseconds, the two matched client receive the pong ball updated data along with
        the current score.

======================================================================== END OF LIST ============ */
/* Gateway to events comming from `http://localhost:3000/game` */
var GameGateway = /** @class */ (function () {
    function GameGateway() {
        this.server = new socket_io_1.Server();
        this.game_service = new game_service_1.GameService();
        this.timeouts = [];
    }
    /* == PRIVATE =============================================================================== */
    /* -- CONNECTION ---------------------------------------------------------- */
    /* Handle connection to server */
    GameGateway.prototype.handleConnection = function (client) {
        console.info("[".concat(client.id, " connected]"));
        client.emit("connected", "Welcome");
        try {
            //TODO: Check if they are not spectator: middleware->`/spectator`?
            //TODO: handle authkey
            var user = this.game_service.getUser(client, "abc"); // authkey
            var match = this.game_service.queueUp(user);
            if (match !== null)
                this.matchmake(match);
        }
        catch (e) {
            client.disconnect(true);
            console.info(e);
        }
        this.game_service.display();
    };
    /* Handle disconnection from server */
    GameGateway.prototype.handleDisconnect = function (client) {
        var match = this.game_service.unQueue(client);
        if (match !== null) {
            this.ignoreTimeout(match, true);
            match.player1.socket.disconnect(true);
            match.player2.socket.disconnect(true);
        }
        console.info("[".concat(client.id, " disconnected]"));
        this.game_service.display();
    };
    /* -- EVENT HANDLERS ------------------------------------------------------ */
    /* Handle room creation (matchmaking accepted from both parties) */
    GameGateway.prototype.matchAccepted = function (client) {
        try {
            var room = this.game_service.playerAcknowledged(client);
            if (room !== null) {
                this.ignoreTimeout(room.match);
                var p1_decoded = this.game_service.decode(room.match.player1.id);
                var p2_decoded = this.game_service.decode(room.match.player2.id);
                room.match.player1.socket.emit("gameReady", p2_decoded);
                room.match.player2.socket.emit("gameReady", p1_decoded);
                var new_timeout = {
                    match: room.match.name,
                    id: setTimeout(this.startGame, 3000, this, room)
                };
                this.timeouts.push(new_timeout);
            }
        }
        catch (e) {
            console.info(e);
            client.disconnect(true);
        }
    };
    /* Handle paddle updates for the game */
    GameGateway.prototype.updateEnemy = function (client, dto) {
        try {
            // TODO: Check paddledto accuracy
            var anticheat = this.game_service.updateOpponent(client, dto);
            if (anticheat === null) {
                client.emit("stop");
                return;
            }
            var opponent_update = anticheat.p2;
            opponent_update.player.emit("updatedOpponent", opponent_update.updated_paddle);
            if (anticheat.p1) {
                client.emit("antiCheat", anticheat.p1);
            }
        }
        catch (e) {
            console.info(e);
        }
    };
    /* TEMPORARY: to stop the interval thingy */
    GameGateway.prototype.stopGame = function (client) {
        client.disconnect(true);
    };
    /* -- MATCHMAKING --------------------------------------------------------- */
    /* Waits for the 2 players to accept the match */
    GameGateway.prototype.matchmake = function (match) {
        match.player1.socket.emit("matchFound");
        match.player2.socket.emit("matchFound");
        var new_timeout = {
            match: match.name,
            id: setTimeout(this.matchTimeout, Constants.matchmaking_timeout, this, match)
        };
        this.timeouts.push(new_timeout);
    };
    /* Time out the 2 players if they don't accept the match */
    GameGateway.prototype.matchTimeout = function (me, match) {
        var index_timeout = me.timeouts.findIndex(function (obj) {
            return obj.match === match.name;
        });
        if (index_timeout < 0)
            return;
        console.info("Match timed out");
        me.game_service.ignore(match);
        match.player1.socket.disconnect(true);
        match.player2.socket.disconnect(true);
        me.timeouts.splice(index_timeout, 1);
    };
    /* Ignore the timeout id */
    GameGateway.prototype.ignoreTimeout = function (match, clear) {
        if (clear === void 0) { clear = false; }
        var index_timeout = this.timeouts.findIndex(function (obj) {
            return obj.match === match.name;
        });
        if (index_timeout < 0)
            return;
        if (clear)
            clearTimeout(this.timeouts[index_timeout].id);
        console.info("Ignored timer ".concat(this.timeouts[index_timeout].match));
        this.timeouts.splice(index_timeout, 1);
    };
    /* -- UPDATING TOOLS ------------------------------------------------------ */
    /* The game will start */
    GameGateway.prototype.startGame = function (me, room) {
        console.info(room);
        me.ignoreTimeout(room.match);
        var initial_game_state = room.startGame();
        // Send the initial ball { pos, v0 }
        room.match.player1.socket.emit("gameStart", initial_game_state);
        room.match.player2.socket.emit("gameStart", initial_game_state);
        room.setPingId(setInterval(me.sendGameUpdates, 16, me, room));
    };
    /* This will send a GameUpdate every 16ms to both clients in a game */
    GameGateway.prototype.sendGameUpdates = function (me, room) {
        try {
            var update = room.updateGame();
            console.log(update);
            room.match.player1.socket.emit("updateGame", update);
            room.match.player2.socket.emit("updateGame", update);
        }
        catch (e) {
            if (e instanceof objects_1.ResultsObject) {
                /* Save results and destroy game */
                var match = me.game_service.saveScore(room, e); //await me.game_service.saveScore(room, e);
                return me.disconnectRoom(match);
            }
            else if (e === null) {
                // TEMPORARY: remove this catch
                console.log("Finish");
                me.disconnectRoom(room.match);
                me.game_service.destroyRoom(room);
            }
            else {
                // TODO: handle properly, with error sending
                // Other error occured, make sure to destroy interval
                me.disconnectRoom(room.match);
                throw e;
            }
        }
    };
    /* -- UTILS --------------------------------------------------------------- */
    //TODO: make it cleaner
    GameGateway.prototype.disconnectRoom = function (match) {
        match.player1.socket.disconnect(true);
    };
    __decorate([
        (0, websockets_1.WebSocketServer)()
    ], GameGateway.prototype, "server");
    __decorate([
        (0, websockets_1.SubscribeMessage)("ok")
    ], GameGateway.prototype, "matchAccepted");
    __decorate([
        (0, websockets_1.SubscribeMessage)("update")
    ], GameGateway.prototype, "updateEnemy");
    __decorate([
        (0, websockets_1.SubscribeMessage)("stop")
    ], GameGateway.prototype, "stopGame");
    GameGateway = __decorate([
        (0, websockets_1.WebSocketGateway)({
            namespace: "/game",
            cors: {
                origin: ["http://localhost:3000"]
            }
        })
    ], GameGateway);
    return GameGateway;
}());
exports.GameGateway = GameGateway;
