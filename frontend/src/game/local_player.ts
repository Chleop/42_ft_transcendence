import { PlayerBase } from "./player_base";
import { PlayerState } from "./player";
import { GameSocket } from "../api";

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

    /** The socket to which we are sending data. */
    private socket: GameSocket;

    private update_movement_input() {
        this.movement_input = 0;

        if (this.pressing_up) {
            this.movement_input += 1.0;
        }
        if (this.pressing_down) {
            this.movement_input -= 1.0;
        }
    }

    /**
     * Creates a new `ControlledPlayer`.
     *
     * Note that calling this constructor will highjack the window's global onkeydown/onkeyup
     * callbacks.
     */
    public constructor(socket: GameSocket) {
        super();

        this.pressing_up = false;
        this.pressing_down = false;
        this.socket = socket;

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

    public tick(delta_time: number, state: PlayerState): void {
        this.socket.update({
            position: this.position,
            velocity: this.movement_input,
        });

        super.tick(delta_time, state);
    }
}
