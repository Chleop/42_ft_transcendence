"use strict";
exports.__esModule = true;
exports.margin = exports.sin = exports.cos = exports.limit_x = exports.max_score = exports.radius = exports.max_paddle = exports.paddle_x = exports.paddle_radius = exports.h_2 = exports.w_2 = exports.ping = exports.acceleration = exports.initial_speed = exports.matchmaking_timeout = void 0;
/* Timespan before kicked out of queue */
exports.matchmaking_timeout = 10000;
/* Speed */
exports.initial_speed = 5;
/* Acceleration */
exports.acceleration = 1.005;
/* Value in seconds */
exports.ping = 16;
/* Height and width, divided by 2 */
exports.w_2 = 8;
exports.h_2 = 4.5;
/* Half of paddle size */
exports.paddle_radius = 1;
/* Shift paddle from wall */
exports.paddle_x = 1;
exports.max_paddle = exports.w_2 - exports.paddle_x; // = 8 - 1 = 7
/* Ball radius */
exports.radius = 0.2;
/* Limit score for victory */
exports.max_score = 3;
/* Actual limit on x hit by ball */
exports.limit_x = exports.max_paddle - exports.radius; // 7 - 0.2 = 6.8
/* Limit angle for ball launch: pi/6 (theta) */
exports.cos = 8.66;
exports.sin = 5;
/* Margin of error for paddle: 2% */
exports.margin = 0.02;
// export type Constant = {
// 	matchmaking_timeout: number;
// 	initial_speed: number;
// 	acceleration: number;
// 	ping: number;
// 	w_2: number;
// 	h_2: number;
// 	paddle_radius: number;
// 	paddle_x: number;
// 	max_paddle: number;
// 	radius: number;
// 	max_score: number;
// 	limit_x: number;
// 	cos: number;
// 	sin: number;
// 	margin: number;
// };
// module.exports = {
// 	matchmaking_timeout: matchmaking_timeout,
// 	initial_speed: initial_speed,
// 	acceleration: acceleration,
// 	ping: ping,
// 	w_2: w_2,
// 	h_2: h_2,
// 	paddle_radius: paddle_radius,
// 	paddle_x: paddle_x,
// 	max_paddle: max_paddle,
// 	radius: radius,
// 	max_score: max_score,
// 	limit_x: limit_x,
// 	cos: cos,
// 	sin: sin,
// 	margin: margin,
// };
