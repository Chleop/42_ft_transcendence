import { Player, PlayerState } from "./game";

/**
 * A player that's controlled locally.
 */
export class LocalPlayer extends Player {
    /**
     * The position of the controlled player.
     */
    private position_: number;

    /**
     * Whether the user is pressing up.
     */
    private pressing_up: boolean;
    /**
     * Whether the user is pressing down.
     */
    private pressing_down: boolean;

    /**
     * Creates a new `ControlledPlayer`.
     *
     * Note that calling this constructor will highjack the window's global onkeydown/onkeyup
     * callbacks.
     */
    public constructor() {
        super();

        this.position_ = 0;

        this.pressing_up = false;
        this.pressing_down = false;

        window.onkeydown = (ev: KeyboardEvent) => {
            switch (ev.key) {
                case "ArrowUp":
                    this.pressing_up = true;
                    break;
                case "ArrowDown":
                    this.pressing_down = true;
                    break;
            }
        };
        window.onkeyup = (ev: KeyboardEvent) => {
            switch (ev.key) {
                case "ArrowUp":
                    this.pressing_up = false;
                    break;
                case "ArrowDown":
                    this.pressing_down = false;
                    break;
            }
        };
    }

    /**
     * Returns the position of the player.
     */
    public get position(): number {
        return this.position_;
    }

    /**
     * Moves the player.
     */
    public tick(delta_time: number, state: PlayerState) {
        let velocity: number = 0;

        if (this.pressing_up) {
            velocity += 1.0;
        }
        if (this.pressing_down) {
            velocity -= 1.0;
        }

        this.position_ += velocity * delta_time * state.speed;

        if (this.position - state.height / 2 < -4.5) {
            this.position_ = -4.5 + state.height / 2;
        }
        if (this.position + state.height / 2 >= 4.5) {
            this.position_ = 4.5 - state.height / 2;
        }
    }
}
