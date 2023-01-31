import { Scene, State } from "../strawberry";
import { Constants, OngoingGame } from ".";
import { Renderer } from "./renderer";

/**
 * An exception which indicates that WebGL2 technology is not supported by the
 * browser.
 */
export class WebGL2NotSupported { }

/**
 * The state of the game being rendered.
 */
export interface RenderState {
    /** Whether hitboxes and other debug information should be displayed. */
    debug: boolean;
}

class GameBoardClass extends Scene {
    /**
     * The game currently being played on this board.
     *
     * Note that this field may be null when no game is currently active. This is the case when the
     * scene is not on the forground.
     */
    private ongoing_game: OngoingGame | null;

    /**
     * The timstamp of the last frame.
     */
    private last_timestamp_ms: DOMHighResTimeStamp;

    /**
     * The canvas element, initialized in the constructor.
     */
    private canvas: HTMLCanvasElement;

    /**
     * The renderer used to interface with the Graphics Card.
     */
    private renderer: Renderer;

    /**
     * The state of the game being rendered.
     */
    private render_state: RenderState;

    /**
     * Creates a new `GameBoard` instance.
     */
    public constructor() {
        super();

        const canvas = document.createElement("canvas");
        canvas.id = "game-canvas";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const gl = canvas.getContext("webgl2");
        if (!gl) throw new WebGL2NotSupported();
        const renderer = new Renderer(gl);
        renderer.notify_size_changed(canvas.width, canvas.height);

        requestAnimationFrame(ts => this.animation_frame_handler(ts));

        this.ongoing_game = null;
        this.last_timestamp_ms = 0;
        this.canvas = canvas;
        this.renderer = renderer;
        this.render_state = {
            debug: true,
        };
    }

    /** Starts the game with a specific controller. */
    public start_game(ongoing_game: OngoingGame): void {
        this.ongoing_game = ongoing_game;
    }

    /**
     * This function will be called by the browser when it's time to redraw the canvas.
     */
    private animation_frame_handler(timestamp_ms: DOMHighResTimeStamp) {
        // Request the handler to be called again.
        requestAnimationFrame(ts => this.animation_frame_handler(ts));

        // Compute the delta time for this frame.
        let delta_time = (timestamp_ms - this.last_timestamp_ms) / 1000;
        if (delta_time >= Constants.max_tick_period)
            delta_time = Constants.max_tick_period;
        this.last_timestamp_ms = timestamp_ms;

        if (!this.ongoing_game)
            return; // There is no ongoing game at the moment. It's useless to render anything.

        // Detect whether the window has been resized. In which case we notify the renderer that
        // the viewport has changed.
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.renderer.notify_size_changed(this.canvas.width, this.canvas.height);
        }

        // Tick the game controller.
        if (this.ongoing_game.game_flow === "break") {
            this.ongoing_game = null;
            return;
        }
        this.ongoing_game.tick(delta_time);

        // ===============
        // Render The Game
        // ===============
        const HEART_SIZE: number = 0.2;
        const HEART_GAP: number = 0.05;

        const r = this.renderer;
        const s = this.ongoing_game.game_state;

        r.set_view_matrix(0.8 * 2 / Constants.board_width, 0, 0, 0.8 * 2 * (this.canvas.width / this.canvas.height) / Constants.board_width);
        r.clear(0, 0, 0);

        // When debug information are required, hitboxes are drawn.
        if (this.render_state.debug) {
            r.draw_hitbox(-Constants.board_width / 2, -Constants.board_height / 2, Constants.board_width, Constants.board_height);

            // Display the player and its opponent.
            r.draw_hitbox(-Constants.board_width / 2 + Constants.paddle_x - Constants.paddle_width, s.left_paddle.position - Constants.paddle_height / 2, Constants.paddle_width, Constants.paddle_height);
            r.draw_hitbox(Constants.board_width / 2 - Constants.paddle_x, s.right_paddle.position - Constants.paddle_height / 2, Constants.paddle_width, Constants.paddle_height);

            // Display the ball.
            r.draw_hitbox(s.ball.x - Constants.ball_radius / 2, s.ball.y - Constants.ball_radius / 2, Constants.ball_radius, Constants.ball_radius);

            // Display the health of the opponent.
            for (let i = 0; i < Constants.max_score - s.left_paddle.score; ++i) {
                r.draw_hitbox(Constants.board_width / 2 - (i + 1) * (HEART_SIZE + HEART_GAP), Constants.board_height / 2 - HEART_GAP - HEART_SIZE, HEART_SIZE, HEART_SIZE);
            }

            // Display the health of the player.
            for (let i = 0; i < Constants.max_score - s.right_paddle.score; ++i) {
                r.draw_hitbox(-Constants.board_width / 2 + HEART_GAP + i * (HEART_SIZE + HEART_GAP), Constants.board_height / 2 - HEART_GAP - HEART_SIZE, HEART_SIZE, HEART_SIZE);
            }
        }
    }

    /** Notifies the scene that it is about to leave the focus. */
    public on_left(new_state: State): void {
        if (this.ongoing_game) {
            this.ongoing_game.on_left();
            this.ongoing_game = null;
        }
        super.on_left(new_state);
    }

    /**
     * Returns the location of this scene.
     *
     * If there is an ongoing game, the location of that game is returned. Otherwise, `/` is
     * returned.
     */
    public get location(): string {
        if (this.ongoing_game)
            return this.ongoing_game.location;
        else
            return "/";
    }

    /** Returns the canvas. */
    public get root_html_element(): HTMLElement {
        return this.canvas;
    }
}

/** The global game board scene. */
export const GameBoard = new GameBoardClass();