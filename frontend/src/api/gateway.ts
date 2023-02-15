import {Socket, io} from "socket.io-client";
import {Message} from "./channel";
import {get_cookie} from "./client";
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
		console.log("initiating a connection with the chat gateway...");
		this.socket = io("/chat", {auth: {token: get_cookie("access_token")}});

		this.socket.on("connect", () => this.on_connected());
		this.socket.on("disconnect", () => this.on_disconnected());
		this.socket.on("channel_message", (message: Message) => this.on_message(message));
		this.socket.on("direct_message", (msg: DirectMessage) => this.on_message({
			id: msg.id,
			dateTime: msg.dateTime,
			content: msg.content,
			channelId: null,
			senderId: msg.senderId,
		}));
		this.socket.on("user_updated", (user_update: UserUpdate) => Users.on_user_update(user_update));
	}

	/** Disconnect the socket. */
	public disconnect() {
		this.socket.disconnect();
	}
}

/** The global gateway. */
const GATEWAY = new GatewayClass();
export default GATEWAY;
