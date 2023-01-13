export const Constants = (function() {
    interface ConstantsClass {
        /**
         * The width of the gameboard.
         */
        readonly board_width: number,
        /**
         * The height of the gameboard.
         */
        readonly board_height: number,
        /**
         * The initial height of a player paddle.
         * 
         * Note that the effective height of the paddle may change during the game.
         */
        readonly paddle_height: number,
        /**
         * The initial horizontal coordinate of the player paddle. This is how far from the left
         * wall the right edge of the paddle is.
         */
        readonly paddle_x: number,
        /**
         * The visual width of paddles. This number does not affect gameplay and is only used for
         * rendering.
         */
        readonly paddle_width: number,
        /**
         * The initial speed (in units per second) of a player paddle.
         *
         * Note that this speed may change during a game.
         */
        readonly paddle_speed: number,
        /**
         * The radius of the ball.
         */
        readonly ball_radius: number,
        /**
         * The score required to win a game.
         */
        readonly max_score: number,

        /**
         * The ball's velocity is multiply by this value each tick.
         */
        readonly ball_acceleration_factor: number;

        /**
         * The maximum amount of time a tick may take. Any duration larger than this number will
         * start slowing the game down to avoid tunelling.
         *
         * Measured in seconds.
         */
        readonly max_tick_period: number,
    }

    return <ConstantsClass>{
        board_width: 16,
        board_height: 9,
        paddle_height: 2,
        paddle_x: 1,
        paddle_width: 0.2,
        paddle_speed: 4,
        ball_radius: 0.2,
        max_score: 3,
        max_tick_period: 0.2,
        ball_acceleration_factor: 0.005,
    };
})();