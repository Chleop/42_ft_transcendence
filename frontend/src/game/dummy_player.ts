import { Player, PlayerState } from "./player";

/**
 * A dummy player that do nothing.
 */
export class DummyPlayer extends Player {
    /**
     * Returns 0.
     */
    public get position(): number {
        return 0;
    }

    /**
     * This function does nothing.
     */
    public tick(_delta_time: number, _state: PlayerState): void { }
}
