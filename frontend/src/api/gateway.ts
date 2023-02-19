import { Socket, io } from "socket.io-client";
import { Message } from "./channel";
import { get_cookie } from "./client";
import { UserUpdate } from "./user";
import { Users } from "./users";

/** Does nothing. */
function noop(): void {}

interface DirectMessage {
    id: string;
    dateTime: string;
    content: string;
    senderId: string;
    receiverId: string;
}

/**
 * Wraps a web socket and provides a friendly interface to the chat gateway.
 */
export class GatewayClass {
    /** The socket */
    private socket: Socket;

    /** Callback called when a new message is received. */
    public on_message: (message: Message) => void = noop;

    public constructor() {
        console.log("initiating a connection with the chat gateway...");
        this.socket = io("/chat", {
        	path: "/api/chat_socket/socket.io",
            auth: { token: get_cookie("access_token") },
        });

        this.socket.on("connect", () => {
            console.info("connected to the chat gateway.");
        });
        this.socket.on("disconnect", () => {
            console.warn("lost connection with the gateway.");
        });
        this.socket.on("channel_message", (message: Message) =>
            this.on_message(message)
        );
        this.socket.on("direct_message", (msg: DirectMessage) =>
            this.on_message({
                id: msg.id,
                dateTime: msg.dateTime,
                content: msg.content,
                channelId: null,
                senderId: msg.senderId,
            })
        );
        this.socket.on("user_updated", (user_update: UserUpdate) =>
            Users.on_user_update(user_update)
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
let GATEWAY = new GatewayClass();
export default GATEWAY;
