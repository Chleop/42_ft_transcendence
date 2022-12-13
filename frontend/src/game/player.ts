/**
 * Information about the state of a `Player`.
 */
export interface PlayerState {
    /**
     * The speed of the player.
     */
    readonly speed: number;

    /**
     * The height of the player.
     */
    readonly height: number;
}

/**
 * Information about a player.
 */
export abstract class Player {
    /**
     * The position of the player on the Y axis.
     */
    abstract get position(): number;

    /**
     * Indicates to the player that it should move.
     */
    abstract tick(delta_time: number, state: PlayerState);
}
