"use strict";
exports.__esModule = true;
exports.Gameplay = void 0;
var dto_1 = require("../dto");
var objects_1 = require("../objects");
var Constants = require("../constants/constants");
/* Track the state of the game, calculates the accuracy of the incomming data */
var Gameplay = /** @class */ (function () {
    function Gameplay() {
        this.scores = {
            player1_score: 0,
            player2_score: 0
        };
        this.paddle1 = new dto_1.PaddleDto();
        this.paddle2 = new dto_1.PaddleDto();
        this.ball = null;
        this.last_update = 0;
    }
    /* == PUBLIC ================================================================================ */
    /* -- RESULTS ------------------------------------------------------------- */
    Gameplay.prototype.getResults = function (guilty) {
        if (guilty === 2) {
            return new objects_1.ResultsObject(new objects_1.PlayerData(this.scores.player1_score, true), new objects_1.PlayerData(this.scores.player2_score, false));
        }
        else {
            return new objects_1.ResultsObject(new objects_1.PlayerData(this.scores.player1_score, false), new objects_1.PlayerData(this.scores.player2_score, true));
        }
    };
    /* -- UPDATING GAME ------------------------------------------------------- */
    /* Generate random initial ball velocity vector */
    Gameplay.prototype.initializeGame = function () {
        this.ball = new objects_1.Ball();
        console.info("Initializing:");
        console.info(this.ball);
        return this.generateUpdate();
    };
    /* Generates a ball update */
    Gameplay.prototype.refresh = function () {
        if (this.ball === null)
            return null;
        var ret = this.ball.refresh();
        if (ret === 1) {
            // Ball is far right
            if (!this.ball.checkPaddleCollision(this.paddle1.position)) {
                this.oneWon();
            }
        }
        else if (ret === -1) {
            // Ball is far left
            if (!this.ball.checkPaddleCollision(this.paddle2.position)) {
                this.twoWon();
            }
        }
        return this.generateUpdate();
    };
    // TODO: Cleanup this function...
    Gameplay.prototype.checkUpdate = function (who, dto) {
        if (who === 1) {
            var checked_value = this.verifyAccuracyPaddle(dto, this.paddle1);
            this.paddle1 = checked_value;
        }
        else if (who === 2) {
            var checked_value = this.verifyAccuracyPaddle(dto, this.paddle2);
            this.paddle2 = checked_value;
        }
        else {
            return null;
        }
        // Return corrected paddle if anticheat stroke
        return {
            has_cheated: false,
            updated_paddle: dto
        };
    };
    /* -- UTILS --------------------------------------------------------------- */
    Gameplay.prototype.getScores = function () {
        // TODO: useless??
        return this.scores;
    };
    /* == PRIVATE =============================================================================== */
    /* -- PADDLE LOOK AT ------------------------------------------------------ */
    /* Check if received paddle seems accurate */
    Gameplay.prototype.verifyAccuracyPaddle = function (dto, paddle_checked) {
        //TODO anticheat
        this.last_update;
        paddle_checked;
        return dto;
    };
    /* -- GAME STATUS UPDATE -------------------------------------------------- */
    /* Generate GameUpdate */
    Gameplay.prototype.generateUpdate = function () {
        this.last_update = Date.now();
        return {
            updated_ball: this.ball,
            scores: this.scores
        };
    };
    /* Players 1 marked a point, send results OR reinitialize */
    Gameplay.prototype.oneWon = function () {
        this.scores.player1_score++;
        if (this.scores.player1_score === Constants.max_score) {
            throw new objects_1.ResultsObject(new objects_1.PlayerData(this.scores.player1_score, true), new objects_1.PlayerData(this.scores.player2_score, false));
        }
        this.ball = new objects_1.Ball();
    };
    /* Players 2 marked a point, send results OR reinitialize */
    Gameplay.prototype.twoWon = function () {
        this.scores.player2_score++;
        if (this.scores.player2_score === Constants.max_score) {
            throw new objects_1.ResultsObject(new objects_1.PlayerData(this.scores.player1_score, false), new objects_1.PlayerData(this.scores.player2_score, true));
        }
        this.ball = new objects_1.Ball();
    };
    return Gameplay;
}());
exports.Gameplay = Gameplay;
