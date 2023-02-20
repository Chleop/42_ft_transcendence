/**
 * Stores the state of a paddle.
 */
export interface Paddle {
    /** The horizontal position of the paddle. */
    position: number,
    /** The velocity of the paddle. */
    velocity: number,
    /** The score of the player controlling the paddle. */
    score: number,
}

/**
 * The state of the ball.
 */
export interface Ball {
    /** The X coordinate of the ball. */
    x: number,
    /** The Y coordinate of the ball. */
    y: number,
    /** The velocity of the ball along the X axis. */
    vx: number,
    /** The velocity of the ball along the Y axis. */
    vy: number,
}

/**
 * The state of an ongoing game.
 */
export interface GameState {
    /** The state of the paddle that's playing left. */
    left_paddle: Paddle,
    /** The state of the paddle that's playing right. */
    right_paddle: Paddle,
    /** The state of the ball. */
    ball: Ball,
}

/** The return type of the `tick` function. */
export type GameFlow = "break" | "continue";

export interface SkinUrls {
    left_background: Promise<string>,
    right_background: Promise<string>,
    left_paddle: Promise<string>,
    right_paddle: Promise<string>,
    left_ball: Promise<string>,
    right_ball: Promise<string>,
}

/**
 * Describes what happens on the game board.
 */
export abstract class OngoingGame {
    /** Returns the state of the game. */
    protected state: GameState;

    /** The flow of the game. */
    protected flow: GameFlow;

    public constructor() {
        this.state = {
            ball: {
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
            },
            left_paddle: {
                position: 0,
                score: 0,
                velocity: 0,
            },
            right_paddle: {
                position: 0,
                score: 0,
                velocity: 0,
            },
        };
        this.flow = "continue";
    }

    public get game_state(): GameState {
        return this.state;
    }

    public get game_flow(): GameFlow {
        return this.flow;
    }

    /** Indicates that the game is about to re-render the canvas. */
    abstract tick(delta_time: number): void;

    /**
     * Notifies the game that the user is leaving.
     */
    abstract on_left(): void;

    /** Returns the location of the `GameBoard` scene. */
    abstract get location(): string;

    /**
     * Returns the skins that the `GameBoard` should use to display each side.
     */
    abstract get_skins(): SkinUrls;
}
