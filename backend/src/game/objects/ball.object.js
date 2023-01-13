"use strict";
// import { Constant } from "../constants/constants";
exports.__esModule = true;
exports.Ball = void 0;
var Constants = require("../constants/constants");
var Ball = /** @class */ (function () {
    function Ball() {
        var vx = Math.random(); //TODO: get limit angle
        var vy = Math.random();
        var v_norm = Math.sqrt(vx * vx + vy * vy);
        this.x = 0;
        this.y = 0;
        this.vx = vx / v_norm;
        this.vy = vy / v_norm;
        this.velocity = Constants.initial_speed;
    }
    /* == PUBLIC ================================================================================ */
    /* Send refreshed ball value */
    Ball.prototype.refresh = function () {
        //console.info(this);
        this.refreshX();
        this.refreshY();
        if (this.x > Constants.limit_x)
            return 1;
        else if (this.x < -Constants.limit_x)
            return -1;
        return 0;
    };
    /* Check if ball hits paddle */
    Ball.prototype.checkPaddleCollision = function (paddle_y) {
        if (this.y < paddle_y + Constants.paddle_radius &&
            this.y > paddle_y - Constants.paddle_radius) {
            this.x = Constants.paddle_x;
            this.shiftBouncing(paddle_y);
            this.increaseSpeed();
            return true;
        }
        return false;
    };
    /* == PRIVATE =============================================================================== */
    /* Refresh on X axis */
    Ball.prototype.refreshX = function () {
        this.x += this.vx * this.velocity * Constants.ping * 0.001;
    };
    /* Refresh on Y axis */
    Ball.prototype.refreshY = function () {
        var new_y = this.y + this.vy * this.velocity * Constants.ping * 0.001;
        if (new_y > Constants.h_2) {
            this.y = Constants.h_2;
        }
        else if (new_y < -Constants.h_2) {
            this.y = -Constants.h_2;
        }
        else {
            this.y = new_y;
            return;
        }
        this.vy = -this.vy;
    };
    Ball.prototype.increaseSpeed = function () {
        this.velocity *= Constants.acceleration;
    };
    /* Shift ball.vy a little depending on position of ball on paddle */
    Ball.prototype.shiftBouncing = function (paddle_y) {
        var oh = this.y - paddle_y; // OH vector
        var vy = this.vy + 0.5 * oh;
        var norm = Math.sqrt(this.vx * this.vx + vy * vy);
        this.vy = vy / norm;
        this.vx = -this.vx / norm;
    };
    return Ball;
}());
exports.Ball = Ball;
