import { Scene, History, State } from "../strawberry";
import { Player, Constants } from ".";
import { Renderer } from "./renderer";
import { GameSocket } from "../api";

/**
 * An exception which indicates that WebGL2 technology is not supported by the
 * browser.
 */
export class WebGL2NotSupported { }

/**
 * The only implementator of the public `PlayerState` interface.
 */
class PlayerStateInternal {
    public speed: number;
    public height: number;
    public score: number;

    constructor() {
        this.speed = Constants.paddle_speed;
        this.height = Constants.paddle_height;
        this.score = 0;
    }
}

/**
 * The only implementator of the public `BallState` interface.
 */
class BallState {
    /**
     * The X position of the ball.
     */
    x: number;
    /**
     * The Y position of the ball.
     */
    y: number;
    /**
     * The X velocity of the ball.
     */
    vx: number;
    /**
     * The Y velocity of the ball.
     */
    vy: number;
    /**
     * The radius of the ball.
     */
    radius: number;

    /**
     * Creates a new `BallStateInternal` with default values.
     */
    constructor() {
        const angle = Math.random() * 3.1415;

        this.x = 0;
        this.y = 0;
        this.vx = Math.cos(angle) * 5;
        this.vy = Math.sin(angle) * 5;
        this.radius = 0.2;
    }
}

interface GameState {
    /**
     * Information about the player that plays on the left.
     */
    left_player: Player;
    /**
     * The state of the left player.
     */
    left_player_state: PlayerStateInternal;
    /**
     * Information about the player that plays on the right.
     */
    right_player: Player;
    /**
     * The state of the right player.
     */
    right_player_state: PlayerStateInternal;
    /**
     * The state of the ball.
     */
    ball_state: BallState;
    /** Whether the game has started. */
    game_started: boolean;
    /** The socket that we are using. */
    socket: GameSocket;
}

/**
 * Contains the elements required to play the game.
 */
class GameScene extends Scene {
    /**
     * The `<canvas>` element.
     */
    private canvas: HTMLCanvasElement;

    /**
     * The graphics renderer.
     */
    private renderer: Renderer;

    /**
     * The current state of the game.
     */
    private game_state: GameState | null;

    /**
     * Whether hitboxes should be displayed.
     */
    private show_debug_: boolean;

    /**
     * The last timestamp that was passed to the animation callback.
     */
    private last_timestamp: number;

    /**
     * Creates a new `GameScene` instance.
     */
    public constructor() {
        super();

        this.canvas = document.createElement("canvas");
        this.canvas.id = "game-canvas";

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        document.body.style.backgroundColor = "black";

        const gl = this.canvas.getContext("webgl2");
        if (!gl) throw new WebGL2NotSupported();
        this.renderer = new Renderer(gl);

        this.renderer.notify_size_changed(this.canvas.width, this.canvas.height);
        this.renderer.set_view_matrix(0.8 * 2 / Constants.board_width, 0, 0, 0.8 * 2 * (this.canvas.width / this.canvas.height) / Constants.board_width);

        this.game_state = null;
        this.show_debug_ = true;
        this.last_timestamp = 0;

        window.requestAnimationFrame(timestamp => this.animation_frame_callback(timestamp));
    }

    public start(socket: GameSocket, left: Player, right: Player) {
        this.game_state = {
            ball_state: new BallState(),
            game_started: false,
            left_player: left,
            left_player_state: new PlayerStateInternal(),
            right_player: right,
            right_player_state: new PlayerStateInternal(),
            socket,
        };

        socket.on_game_start = () => {
            if (!this.game_state)
                return;
            console.log("The game has started.");
            this.game_state.game_started = true;
        };

        socket.on_ball_updated = state => {
            if (!this.game_state)
                return;
            this.game_state.ball_state.x = state.x;
            this.game_state.ball_state.y = state.y;
            this.game_state.ball_state.vx = state.vx;
            this.game_state.ball_state.vy = state.vy;
        };

        socket.on_score_updated = state => {
            if (!this.game_state)
                return;
            this.game_state.right_player_state.score = state.opponent;
            this.game_state.left_player_state.score = state.you;
        };

        socket.on_disconnected = () => {
            if (!this.game_state)
                return;
            console.log("Disconnected!");
            History.go_back();
        };
    }

    public on_left(new_state: State): void {
        if (this.game_state) {
            console.log("Disconnecting!");
            this.game_state.socket.on_disconnected = () => { };
            this.game_state.socket.disconnect();
            this.game_state = null;
        }

        super.on_left(new_state);
    }

    /**
     * Returns the canvas element.
     */
    public get root_html_element(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Returns "/game".
     */
    public get location(): string {
        return "/game"
    }

    /**
     * Whether hitboxes should be shown.
     */
    public set show_debug(yes: boolean) {
        this.show_debug_ = yes;
    }

    /**
     * The function that will be called by the presentation engine when a new frame should be rendered.
     */
    private animation_frame_callback(timestamp: DOMHighResTimeStamp) {
        requestAnimationFrame(ts => this.animation_frame_callback(ts));

        let delta_time = (timestamp - this.last_timestamp) / 1000;
        if (delta_time >= Constants.max_tick_period)
            delta_time = Constants.max_tick_period;
        this.last_timestamp = timestamp;

        if (!this.game_state)
            return;

        // Ensure that the canvas has the right size.
        if (this.canvas.width != window.innerWidth || this.canvas.height != window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            // Notify the renderer that the canvas' size has been updated.
            this.renderer.notify_size_changed(this.canvas.width, this.canvas.height);

            // Update the view matrix to ensure that the whole board remains in view.
            this.renderer.set_view_matrix(0.8 * 2 / Constants.board_width, 0, 0, 0.8 * 2 * (this.canvas.width / this.canvas.height) / Constants.board_width);
        }

        if (this.game_state.game_started) {
            // Move the ball.
            this.game_state.ball_state.vx *= Constants.ball_acceleration_factor;
            this.game_state.ball_state.vy *= Constants.ball_acceleration_factor;
            this.game_state.ball_state.x += this.game_state.ball_state.vx * delta_time;
            this.game_state.ball_state.y += this.game_state.ball_state.vy * delta_time;

            if (this.game_state.ball_state.y - this.game_state.ball_state.radius < -Constants.board_height / 2) {
                this.game_state.ball_state.y = -Constants.board_height / 2 + this.game_state.ball_state.radius;
                this.game_state.ball_state.vy = Math.abs(this.game_state.ball_state.vy);
            }
            if (this.game_state.ball_state.y + this.game_state.ball_state.radius > Constants.board_height / 2) {
                this.game_state.ball_state.y = Constants.board_height / 2 - this.game_state.ball_state.radius;
                this.game_state.ball_state.vy = -Math.abs(this.game_state.ball_state.vy);
            }
            if (this.game_state.ball_state.x + this.game_state.ball_state.radius > Constants.board_width / 2) {
                this.game_state.ball_state.x = Constants.board_width / 2 - this.game_state.ball_state.radius;
                this.game_state.ball_state.vx = -Math.abs(this.game_state.ball_state.vx);
            }
            if (this.game_state.ball_state.x - this.game_state.ball_state.radius < -Constants.board_width / 2) {
                this.game_state.ball_state.x = -Constants.board_width / 2 + this.game_state.ball_state.radius;
                this.game_state.ball_state.vx = Math.abs(this.game_state.ball_state.vx);
            }

            // Move the players.
            this.game_state.left_player.tick(delta_time, this.game_state.left_player_state);
            this.game_state.right_player.tick(delta_time, this.game_state.right_player_state);
        }

        const HEART_SIZE: number = 0.2;
        const HEART_GAP: number = 0.05;

        // Render the scene.
        this.renderer.clear(0, 0, 0);
        this.renderer.draw_hitbox(-Constants.board_width / 2, -Constants.board_height / 2, Constants.board_width, Constants.board_height);

        // When debug information are required, hitboxes are drawn.
        if (this.show_debug_) {
            // Display the player and its opponent.
            this.renderer.draw_hitbox(-Constants.board_width / 2 + Constants.paddle_x - Constants.paddle_width, this.game_state.left_player.position - this.game_state.left_player_state.height / 2, Constants.paddle_width, this.game_state.left_player_state.height);
            this.renderer.draw_hitbox(Constants.board_width / 2 - Constants.paddle_x, this.game_state.right_player.position - this.game_state.right_player_state.height / 2, Constants.paddle_width, this.game_state.right_player_state.height);

            // Display the ball.
            this.renderer.draw_hitbox(this.game_state.ball_state.x - this.game_state.ball_state.radius / 2, this.game_state.ball_state.y - this.game_state.ball_state.radius / 2, this.game_state.ball_state.radius, this.game_state.ball_state.radius);

            // Display the health of the opponent.
            for (let i = 0; i < Constants.max_score - this.game_state.left_player_state.score; ++i) {
                this.renderer.draw_hitbox(Constants.board_width / 2 - (i + 1) * (HEART_SIZE + HEART_GAP), Constants.board_height / 2 - HEART_GAP - HEART_SIZE, HEART_SIZE, HEART_SIZE);
            }

            // Display the health of the player.
            for (let i = 0; i < Constants.max_score - this.game_state.right_player_state.score; ++i) {
                this.renderer.draw_hitbox(-Constants.board_width / 2 + HEART_GAP + i * (HEART_SIZE + HEART_GAP), Constants.board_height / 2 - HEART_GAP - HEART_SIZE, HEART_SIZE, HEART_SIZE);
            }
        }
    }
}

export const Game = new GameScene();
