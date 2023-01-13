"use strict";
exports.__esModule = true;
exports.GameRoom = void 0;
var gameplay_1 = require("../gameplay");
/* Holds info on the gameroom
     Once someone leaves the game, the room is completely removed.
*/
var GameRoom = /** @class */ (function () {
    function GameRoom(match) {
        this.match = match;
        this.ping_id = null;
        this.game = null;
        this.nb_update = 0; // TEMPORARY
        console.info("Room created:", this.match.name);
    }
    /* == PUBLIC ================================================================================ */
    /* -- GAME MANAGEMENT ----------------------------------------------------- */
    /* Call this function once the game actually starts */
    GameRoom.prototype.startGame = function () {
        this.game = new gameplay_1.Gameplay();
        return this.game.initializeGame();
    };
    /* Called every 16ms to send ball updates */
    GameRoom.prototype.updateGame = function () {
        // TEMPORARY: Comment the 2 lines to avoid early kick
        if (this.nb_update++ > 5)
            throw null;
        if (this.game === null)
            return null;
        return this.game.refresh();
    };
    /* Called everytime the sender sent an update */
    GameRoom.prototype.updatePaddle = function (client, dto) {
        if (this.game === null)
            return null;
        var cheat_check = this.game.checkUpdate(this.playerNumber(client), dto);
        if (cheat_check === null)
            return null;
        return {
            p1: cheat_check.has_cheated ? cheat_check.updated_paddle : null,
            p2: {
                player: this.whoIsOpponent(client),
                updated_paddle: cheat_check.updated_paddle
            }
        };
    };
    /* Saves the current state of the game */
    GameRoom.prototype.cutGameShort = function (guilty) {
        if (!this.game)
            return null;
        else if (guilty === null)
            return null;
        return this.game.getResults(guilty);
    };
    /* -- INTERVAL UTILS ------------------------------------------------------ */
    /* Stores the ID of the setInterval function */
    GameRoom.prototype.setPingId = function (timer_id) {
        this.ping_id = timer_id;
    };
    /* Destroys associated setInteval instance */
    GameRoom.prototype.destroyPing = function () {
        if (this.ping_id === null)
            return;
        clearInterval(this.ping_id);
    };
    /* -- IDENTIFIERS --------------------------------------------------------- */
    GameRoom.prototype.isClientInRoom = function (client) {
        return this.match.player1.socket.id === client.id ||
            this.match.player2.socket.id === client.id;
    };
    /* Returns player's number */
    GameRoom.prototype.playerNumber = function (client) {
        if (this.match.player1.socket.id === client.id)
            return 1;
        else if (this.match.player2.socket.id === client.id)
            return 2;
        return null;
    };
    /* -- UTILS --------------------------------------------------------------- */
    // TODO: Useless??
    GameRoom.prototype.getScores = function () {
        if (!this.game)
            throw "Game didn't start yet";
        return this.game.getScores();
    };
    /* == PRIVATE =============================================================================== */
    /* -- IDENTIFIERS --------------------------------------------------------- */
    /* Returns client's opponent socket */
    GameRoom.prototype.whoIsOpponent = function (client) {
        if (this.match.player1.socket.id === client.id)
            return this.match.player2.socket;
        else
            return this.match.player1.socket;
    };
    return GameRoom;
}());
exports.GameRoom = GameRoom;
