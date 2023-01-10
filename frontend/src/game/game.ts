import { Scene } from "../strawberry/scene";
import { DummyPlayer } from "./dummy_player";
import { LocalPlayer } from "./local_player";
import { Player } from "./player";
import { Renderer, Sprite } from "./renderer";
import { Constants } from "./constants"

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

    constructor() {
        this.speed = Constants.paddle_speed;
        this.height = Constants.paddle_height;
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

/**
 * Contains the elements required to play the game.
 */
export class GameScene extends Scene {
    /**
     * The `<canvas>` element.
     */
    private canvas: HTMLCanvasElement;

    /**
     * The graphics renderer.
     */
    private renderer: Renderer;

    /**
     * Whether the game should stop itself.
     */
    private should_stop: boolean;


    /**
     * Information about the player that plays on the left.
     */
    private left_player: Player;
    /**
     * The state of the left player.
     */
    private left_player_state: PlayerStateInternal;
    /**
     * Information about the player that plays on the right.
     */
    private right_player: Player;
    /**
     * The state of the right player.
     */
    private right_player_state: PlayerStateInternal;

    /**
     * The state of the ball.
     */
    private ball_state: BallState;

    /**
     * The sprite of the ball.
     */
    private ball_sprite: Sprite;
    /**
     * The sprite used for paddles.
     */
    private paddle_sprite: Sprite;

    /**
     * The last timestamp that was passed to the animation callback.
     */
    private last_timestamp: number;

    /**
     * Whether hitboxes should be displayed.
     */
    private show_debug_: boolean;

    /**
     * Creates a new `GameScene` instance.
     */
    public constructor() {
        super();

        this.canvas = document.createElement("canvas");
        this.canvas.id = "game-canvas";

        // FIXME:
        //  Properly calculate dimentions for the canvas depending on the window size, and handle
        //  window resizes.
        this.canvas.width = 1280 * 1.3;
        this.canvas.height = 720 * 1.3;
        document.body.style.backgroundColor = "black";

        const gl = this.canvas.getContext("webgl2");
        if (!gl) throw new WebGL2NotSupported();
        this.renderer = new Renderer(gl);

        this.left_player = new DummyPlayer();
        this.left_player_state = new PlayerStateInternal();
        this.right_player = new DummyPlayer();
        this.right_player_state = new PlayerStateInternal();
        this.ball_state = new BallState();
        this.ball_sprite = this.renderer.create_sprite("ball.png");      // TODO: Those sprites will later depend on the players.
        this.paddle_sprite = this.renderer.create_sprite("paddle.png");

        // TODO:
        //  Call this function again when the canvas is resized.
        this.renderer.notify_size_changed(this.canvas.width, this.canvas.height);

        this.should_stop = true;
        this.last_timestamp = 0;

        this.show_debug_ = false;

        this.start(new LocalPlayer(), new DummyPlayer());
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
     * Starts the game.
     */
    public start(left: Player, right: Player) {
        this.left_player = left;
        this.right_player = right;

        this.should_stop = false;
        this.last_timestamp = 0;
        window.requestAnimationFrame(timestamp => this.animation_frame_callback(timestamp));
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
        let delta_time = (timestamp - this.last_timestamp) / 1000;
        if (delta_time >= Constants.max_tick_period)
            delta_time = Constants.max_tick_period;
        this.last_timestamp = timestamp;

        // Move the ball.
        this.ball_state.x += this.ball_state.vx * delta_time;
        this.ball_state.y += this.ball_state.vy * delta_time;

        if (this.ball_state.y - this.ball_state.radius < -Constants.board_height / 2) {
            this.ball_state.y = -Constants.board_height / 2 + this.ball_state.radius;
            this.ball_state.vy = Math.abs(this.ball_state.vy);
        }
        if (this.ball_state.y + this.ball_state.radius > Constants.board_height / 2) {
            this.ball_state.y = Constants.board_height / 2 - this.ball_state.radius;
            this.ball_state.vy = -Math.abs(this.ball_state.vy);
        }
        if (this.ball_state.x + this.ball_state.radius > Constants.board_width / 2) {
            this.ball_state.x = Constants.board_width / 2 - this.ball_state.radius;
            this.ball_state.vx = -Math.abs(this.ball_state.vx);
        }
        if (this.ball_state.x - this.ball_state.radius < -Constants.board_width / 2) {
            this.ball_state.x = -Constants.board_width / 2 + this.ball_state.radius;
            this.ball_state.vx = Math.abs(this.ball_state.vx);
        }

        // Move the players.
        this.left_player.tick(delta_time, this.left_player_state);
        this.right_player.tick(delta_time, this.right_player_state);

        // Render the scene.
        const pixel_scale: number = 1 / 200;

        this.renderer.clear(0, 0, 0);
        this.renderer.draw_sprite(this.ball_sprite, this.ball_state.x, this.ball_state.y, this.ball_sprite.width * pixel_scale, this.ball_sprite.height * pixel_scale);
        this.renderer.draw_sprite(this.paddle_sprite, -Constants.board_width / 2 + Constants.paddle_x - Constants.paddle_width, this.left_player.position, this.paddle_sprite.width * pixel_scale, this.paddle_sprite.height * pixel_scale);
        this.renderer.draw_sprite(this.paddle_sprite, Constants.board_width / 2 - Constants.paddle_x, this.right_player.position, this.paddle_sprite.width * pixel_scale, this.paddle_sprite.height * pixel_scale);

        if (this.show_debug_) {
            this.renderer.draw_hitbox(-Constants.board_width / 2 + Constants.paddle_x - Constants.paddle_width, this.left_player.position, Constants.paddle_width, this.right_player_state.height);
            this.renderer.draw_hitbox(Constants.board_width / 2 - Constants.paddle_x, this.right_player.position, Constants.paddle_width, this.right_player_state.height);
            this.renderer.draw_hitbox(this.ball_state.x, this.ball_state.y, this.ball_state.radius, this.ball_state.radius);
        }

        if (!this.should_stop) {
            requestAnimationFrame(ts => this.animation_frame_callback(ts));
        }
    }
}
