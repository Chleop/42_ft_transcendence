import { Socket, io } from "socket.io-client";
import { Message } from "./channel";
import { get_cookie } from "./client";

/** Does nothing. */
function noop(): void {}

/**
 * Wraps a web socket and provides a friendly interface to the chat gateway.
 */
export class GatewayClass {
    /** The socket */
    private socket: Socket;

    /** Callback called when a new message is received. */
    public on_message: (message: Message) => void = noop;

    /** Callback called when the gateway connection is ready. */
    public on_connected: () => void = noop;

    /** Callback called when teh gateway connection is lost. */
    public on_disconnected: () => void = noop;

    public constructor() {
        this.socket = <Socket>{};
        return;
        console.log("initiating a connection with the chat gateway...");
        this.socket = io("/chat", {
            reconnection: false,
            auth: {
                token: get_cookie("access_token"),
            },
        });

        this.socket.on("connect", () => this.on_connected());
        this.socket.on("disconnect", () => this.on_disconnected());
        this.socket.on("channel_message", (message: Message) =>
            this.on_message(message)
        );
    }

    public connect() {
        // console.log("Connected to gateway regular");
        this.socket.connect();
    }

    /** Disconnect the socket. */
    public disconnect() {
        this.socket.disconnect();
    }
}
/** The global gateway. */
const GATEWAY = new GatewayClass();
export default GATEWAY;
