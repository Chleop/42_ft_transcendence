import { PlayerBase, PlayerState } from ".";

/**
 * A player that's controlled locally.
 */
export class LocalPlayer extends PlayerBase {
    /**
     * Whether the user is pressing up.
     */
    private pressing_up: boolean;
    /**
     * Whether the user is pressing down.
     */
    private pressing_down: boolean;

    private update_movement_input() {
        super.movement_input = 0;

        if (this.pressing_up) {
            super.movement_input += 1.0;
        }
        if (this.pressing_down) {
            super.movement_input -= 1.0;
        }
    }

    /**
     * Creates a new `ControlledPlayer`.
     *
     * Note that calling this constructor will highjack the window's global onkeydown/onkeyup
     * callbacks.
     */
    public constructor() {
        super();

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

            this.update_movement_input();
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

            this.update_movement_input();
        };
    }
}
