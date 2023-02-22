import { History, Scene, State } from "../strawberry";
import { Constants, OngoingGame } from ".";
import { Renderer, Sprite, Framebuffer } from "./renderer";

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
    wtf: boolean,
}

function get_framebuffer_dims(width: number, height: number): [number, number] {
    const BOARD_RATIO: number = Constants.board_width / Constants.board_height;
    const aspect_ratio = width / height;

    if (aspect_ratio < BOARD_RATIO) {
        return [
            width,
            width / BOARD_RATIO,
        ];
    } else {
        return [
            height * BOARD_RATIO,
            height,
        ];
    }
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

    private container: HTMLDivElement;

    private overlay_container: HTMLDivElement;

    /**
     * The renderer used to interface with the Graphics Card.
     */
    private renderer: Renderer;

    /**
     * The state of the game being rendered.
     */
    private render_state: RenderState;

    private left_background: Sprite | undefined;
    private right_background: Sprite | undefined;
    private left_paddle: Sprite | undefined;
    private right_paddle: Sprite | undefined;
    private left_ball: Sprite | undefined;
    private right_ball: Sprite | undefined;

    private current_ball: boolean;

    private separator: Sprite;
    private heart: Sprite;

    private tmp_canvas: Framebuffer;
    private warped_canvas: Framebuffer;

    /**
     * Creates a new `GameBoard` instance.
     */
    public constructor() {
        super();

        const container = document.createElement("div");
        container.id = "game-container";

        const overlay_container = document.createElement("div");
        overlay_container.id = "game-overlay-container";
        container.appendChild(overlay_container);

        const canvas = document.createElement("canvas");
        canvas.id = "game-canvas";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        container.appendChild(canvas);

        const gl = canvas.getContext("webgl2");
        if (!gl) throw new WebGL2NotSupported();
        const renderer = new Renderer(gl);
        renderer.notify_size_changed(canvas.width, canvas.height);

        requestAnimationFrame(ts => this.animation_frame_handler(ts));

        this.ongoing_game = null;
        this.last_timestamp_ms = 0;
        this.canvas = canvas;
        this.renderer = renderer;
        this.render_state = { debug: false, wtf: false };
        const [w, h] = get_framebuffer_dims(canvas.width, canvas.height);
        this.tmp_canvas = this.renderer.create_framebuffer(w, h);
        this.warped_canvas = this.renderer.create_framebuffer(w, h);

        this.heart = this.renderer.create_sprite("/heart.png");
        this.separator = this.renderer.create_sprite("/separator.png");

        window.addEventListener("keydown", e => {
            if (e.key === "D") {
                this.render_state.debug = !this.render_state.debug;
                console.info("toggled debug infos: " + this.render_state.debug);
            } else if (e.key === "G") {
                this.render_state.wtf = !this.render_state.wtf;
                console.info("toggled WTF shader: " + this.render_state.wtf);
            }
        });

        this.current_ball = false;

        this.container = container;
        this.overlay_container = overlay_container;
    }

    /** Starts the game with a specific controller. */
    public start_game(ongoing_game: OngoingGame): void {
        this.ongoing_game = ongoing_game;
        let skins = ongoing_game.get_skins();

        while (this.overlay_container.firstChild)
            this.overlay_container.firstChild.remove();

        this.overlay_container.appendChild(ongoing_game.overlay);

        skins.left_background.then(url => {
            this.left_background = this.renderer.create_sprite(url);
        });
        skins.right_background.then(url => {
            this.right_background = this.renderer.create_sprite(url);
        });
        skins.left_paddle.then(url => {
            this.left_paddle = this.renderer.create_sprite(url);
        });
        skins.right_paddle.then(url => {
            this.right_paddle = this.renderer.create_sprite(url);
        });
        skins.left_ball.then(url => {
            this.left_ball = this.renderer.create_sprite(url);
        });
        skins.right_ball.then(url => {
            this.right_ball = this.renderer.create_sprite(url);
        });
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

            // Re-create the framebuffer with the correct size.
            const [width, height] = get_framebuffer_dims(this.canvas.width, this.canvas.height);
            this.tmp_canvas = this.renderer.create_framebuffer(width, height);
            this.warped_canvas = this.renderer.create_framebuffer(width, height);

            // Update the renderer's target size.
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
        const HEART_SIZE: number = 0.6
        const HEART_GAP: number = 0.03;

        const r = this.renderer;
        const s = this.ongoing_game.game_state;

        r.bind_framebuffer(this.tmp_canvas);
        r.clear(0, 0, 0);

        r.set_view_matrix(2.0 / Constants.board_width, 0, 0, 2.0 / Constants.board_height)

        // Display the background.
        if (this.left_background)
            r.draw_sprite_part(this.left_background, 0, 0, 0.5, 1, -Constants.board_width / 2, -Constants.board_height / 2, Constants.board_width / 2, Constants.board_height);
        if (this.right_background)
            r.draw_sprite_part(this.right_background, 0.5, 0, 0.5, 1, 0.0, -Constants.board_height / 2, Constants.board_width / 2, Constants.board_height);

        // r.draw_sprite(this.separator, -1.0, -Constants.board_height / 2, 2.0, Constants.board_height);

        // Display the player and its opponent.
        if (this.left_paddle)
            r.draw_sprite(this.left_paddle, -Constants.board_width / 2 + Constants.paddle_x - Constants.paddle_width, s.left_paddle.position - Constants.paddle_height / 2, Constants.paddle_width, Constants.paddle_height);
        if (this.right_paddle)
            r.draw_sprite(this.right_paddle, Constants.board_width / 2 - Constants.paddle_x + Constants.paddle_width, s.right_paddle.position - Constants.paddle_height / 2, -Constants.paddle_width, Constants.paddle_height);

        // Display the ball.
        if (this.left_ball)
            r.draw_sprite(this.left_ball, s.ball.x - Constants.ball_radius / 2, s.ball.y - Constants.ball_radius / 2, Constants.ball_radius, Constants.ball_radius);

        // Display the health of the opponent.
        for (let i = 0; i < Constants.max_score - s.left_paddle.score; ++i) {
            r.draw_sprite(this.heart, -0.5 + Constants.board_width / 2 - (i + 1) * (HEART_SIZE + HEART_GAP), -0.5 + Constants.board_height / 2 - HEART_GAP - HEART_SIZE, HEART_SIZE, HEART_SIZE);
        }

        // Display the health of the player.
        for (let i = 0; i < Constants.max_score - s.right_paddle.score; ++i) {
            r.draw_sprite(this.heart, 0.5 + -Constants.board_width / 2 + HEART_GAP + i * (HEART_SIZE + HEART_GAP), -0.5 + Constants.board_height / 2 - HEART_GAP - HEART_SIZE, HEART_SIZE, HEART_SIZE);
        }

        // When debug information are required, hitboxes are drawn.
        if (this.render_state.debug) {
            r.draw_hitbox(-Constants.board_width / 2, -Constants.board_height / 2, Constants.board_width, Constants.board_height);

            // Display the player and its opponent.
            r.draw_hitbox(-Constants.board_width / 2 + Constants.paddle_x - Constants.paddle_width, s.left_paddle.position - Constants.paddle_height / 2, Constants.paddle_width, Constants.paddle_height);
            r.draw_hitbox(Constants.board_width / 2 - Constants.paddle_x, s.right_paddle.position - Constants.paddle_height / 2, Constants.paddle_width, Constants.paddle_height);

            // Display the ball.
            r.draw_hitbox(s.ball.x - Constants.ball_radius / 2, s.ball.y - Constants.ball_radius / 2, Constants.ball_radius, Constants.ball_radius);
        }

        if (this.render_state.wtf) {
            r.bind_framebuffer(this.warped_canvas);
            r.wtf(this.tmp_canvas);
            r.bind_framebuffer(this.tmp_canvas);
            r.draw_image(this.warped_canvas);
        }

        r.bind_framebuffer(this.warped_canvas);
        r.warp(this.tmp_canvas, this.warped_canvas.width, this.warped_canvas.height);

        r.bind_framebuffer(null);
        r.set_view_matrix(2 / this.canvas.width, 0, 0, -2 / this.canvas.height);
        r.clear(0, 0, 0);
        r.draw_sprite(this.warped_canvas, -this.warped_canvas.width / 2, -this.warped_canvas.height / 2, this.warped_canvas.width, this.warped_canvas.height);
    }

    /** Notifies the scene that it is about to leave the focus. */
    public on_left(new_state: State): void {
        if (this.ongoing_game) {
            this.ongoing_game.on_left();
            this.ongoing_game = null;
        }
        super.on_left(new_state);
    }

    public on_entered(prev: State): void {
        if (!this.ongoing_game)
            History.go_back();
        super.on_entered(prev);
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
        return this.container;
    }
}

/** The global game board scene. */
const GAME_BOARD = new GameBoardClass();
export default GAME_BOARD;
