/**
 *  Ball speed.
 */
export const initial_speed: number = 5;

/**
 * Acceleration factor.
 */
export const acceleration: number = 1.05;

/**
 * Ball radius.
 */
export const ball_radius: number = 0.2;

/**
 * Delay used in setInterval functions.
 * Value in seconds.
 */
export const ping: number = 16;

/**
 * Game scene width: 16, divided by 2.
 */
export const w_2: number = 8;

/**
 * Game scene height: 9, divided by 2.
 */
export const h_2: number = 4.5;

/**
 * Score limit before end of game.
 */
export const max_score: number = 5;

/**
 * Paddle width, divided by 2.
 */
export const paddle_radius: number = 1;

/**
 * Paddle distance from wall.
 */
export const paddle_x: number = 1;

/**
 * Paddle speed.
 */
export const paddle_speed: number = 4;

/**
 * Maximum x value that can be attained by the ball.
 * Once the |value| of the x coordinate of the ball goes past max_x,
 * the paddle won't be able to interract with it.
 */
export const max_x: number = w_2 - paddle_x; // = 8 - 1 = 7

/**
 * |Limit| value for the x coordinate of the ball.
 * This is the left and right border |coordinate| of the scene.
 *
 * Past this value, the ball is considered outside of the game scene.
 */
export const limit_x: number = max_x - ball_radius; // = 6.8

/**
 * |Limit| value for the y coordinate of the ball.
 * This is the top and bottom border |coordinate| of the scene.
 */
export const limit_y: number = h_2 - ball_radius; // = 4.5 - 0.2 = 4.3

/**
 * Pi subdivisions.
 */
export const pi_4: number = Math.PI * 0.25;
export const pi_3: number = Math.PI * 0.33;

export const gravity: number = 0.1;
export const friction: number = 0.98;
