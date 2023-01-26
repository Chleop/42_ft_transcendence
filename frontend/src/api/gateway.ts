import { Socket, io } from "socket.io-client";
import { Message } from "./channel";

/** Does nothing. */
function noop(): void {}

/**
 * Wraps a web socket and provides a friendly interface to the chat gateway.
 */
class GatewayClass {
    /** The socket */
    private socket: Socket;

    /** Callback called when a new message is received. */
    public on_message: (message: Message) => void = noop;

    public constructor() {
        this.socket = io("/gateway");

        this.socket.on("message", (message: Message) => this.on_message(message));
    }
}

/** The global gateway. */
export const Gateway = new GatewayClass();