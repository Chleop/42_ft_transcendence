import { Renderer } from "./renderer";

/**
 * An exception which indicates that WebGL2 technology is not supported by the
 * browser.
 */
export class WebGL2NotSupported {}

/**
 * Information about a player.
 */
interface Player {
    /**
     * The position of the player on the Y axis.
     */
    position: number;

    /**
     * The position of the player on the X axis.
     */
    velocity: number;
}

/**
 * Contains the elements required to play the game.
 */
export class GameElement {
    /**
     * The `<canvas>` element.
     */
    canvas: HTMLCanvasElement;

    /**
     * The graphics renderer.
     */
    renderer: Renderer;

    /**
     * Whether the game should stop itself.
     */
    should_stop: boolean;


    /**
     * Information about the player that plays on the left.
     */
    left_player: Player;
    /**
     * Information about the player that plays on the right.
     */
    right_player: Player;

    /**
     * Creates a new `GameElement` instance.
     */
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "game-canvas";

        // FIXME:
        //  Properly calculate dimentions for the canvas.
        this.canvas.width = 1280;
        this.canvas.height = 720;

        const gl = this.canvas.getContext("webgl2");
        if (!gl) throw new WebGL2NotSupported();
        this.renderer = new Renderer(gl);

        this.renderer.notify_size_changed(this.canvas.width, this.canvas.height);

        this.should_stop = false;

        // Start the update/render loop.
        this.animation_frame_callback(0);
    }

    /**
     * The function that will be called by the presentation engine when a new frame should be rendered.
     */
    animation_frame_callback(timestamp: DOMHighResTimeStamp) {
        this.renderer.clear(0, 0, 0);
        this.renderer.draw_sprite(0, 0, 1, 1, timestamp / 300.0);

        if (!this.should_stop) {
            requestAnimationFrame(ts => this.animation_frame_callback(ts));
        }
    }
}
