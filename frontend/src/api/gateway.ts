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

    /** Callback called when the gateway connection is ready. */
    public on_connected: () => void = noop;

    /** Callback called when teh gateway connection is lost. */
    public on_disconnected: () => void = noop;

    public constructor() {
        console.log("initiating a connection with the gateway...");
        this.socket = io("/event");

        this.socket.on("connect", () => this.on_connected());
        this.socket.on("disconnect", () => this.on_disconnected());
        this.socket.on("message", (message: Message) => this.on_message(message));
    }

    /** Disconnect the socket. */
    public disconnect() {
        this.socket.disconnect();
    }
}

/** The global gateway. */
export const Gateway = new GatewayClass();
