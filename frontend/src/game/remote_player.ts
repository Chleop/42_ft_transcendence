import { PlayerBase } from ".";
import { GameSocket } from "../api";

export class RemotePlayer extends PlayerBase {
    public constructor(socket: GameSocket) {
        super();

        // TODO: Subscribe to the events.
        socket.on_opponent_updated = data => {
            super.position_ = data.position;
            super.movement_input = data.velocity;
        };
    }
}
