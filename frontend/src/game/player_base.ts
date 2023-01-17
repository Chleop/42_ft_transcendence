import { Player, PlayerState } from "./player";
import { Constants } from "./constants";

export class PlayerBase extends Player {
    /** The current position of the player. */
    protected position_: number;
    /** The current movement input of the player. */
    protected movement_input: number;

    public constructor() {
        super();

        this.position_ = 0;
        this.movement_input = 0;
    }

    /* Returns the position of the player. */
    public get position(): number {
        return this.position_;
    }

    /* Determines the position of the player. */
    public tick(delta_time: number, state: PlayerState): void {
        this.position_ += this.movement_input * delta_time * state.speed;

        if (this.position_ - state.height / 2 < -Constants.board_height / 2) {
            this.position_ = -Constants.board_height / 2 + state.height / 2;
        }
        if (this.position_ + state.height / 2 >= Constants.board_height / 2) {
            this.position_ = Constants.board_height / 2 - state.height / 2;
        }
    }
}
