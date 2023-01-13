import { PlayerBase } from ".";
import { Socket } from "socket.io-client";

export class RemotePlayer extends PlayerBase {
    constructor(socket: Socket) {
        super();

        // TODO: Subscribe to the events.
    }
}
