import { Socket, io } from "socket.io-client";
import { NOTIFICATIONS } from "../notification";
import { Channel, ChannelId, Message } from "./channel";
import { Client, get_cookie } from "./client";
import { PrivateUser, User, UserId } from "./user";
import { Users } from "./users";

/** Does nothing. */
function noop(): void { }

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

	/** Callback called when a user is banned. */
	public on_user_banned: (channel_id: ChannelId) => void = noop;

	/** Callback called when a channel changes. */
	public on_channel_update: (channel: Channel) => void = noop;

	public constructor() {
		console.log("initiating a connection with the chat gateway...");
		this.socket = io("/chat", {
			path: "/api/chat_socket/socket.io",
			auth: { token: get_cookie("access_token") },
		});

		this.socket.on("connect_error", (err) => {
			const message: string | undefined = err?.message;
			if (message === "2FA enabled and pending") {
				(async () => {
					while (true) {
						const code = prompt("please give me the code.........");
						if (!code)
							continue;
						try {
							await Client.validate_2fa(code);
							break;
						}
						catch (e) {
						}
					}

					// Now the user is properly authenticated, the socket will try to reconnect
					// automatically.
				})();
			}
			else (message === "Invalid token" || message === "No token provided")
			{
				document.location.href = "/api/auth/42/login";

				// Once the javascript context ends, the page will unload.
			}
		});
		this.socket.on("exception", (err) => {
			console.error(err);
		});
		this.socket.on("connect", () => {
			console.info("connected to the chat gateway.");
		});
		this.socket.on("disconnect", () => {
			console.warn("lost connection with the gateway.");
		});
		this.socket.on("channel_message", (message: Message) => this.on_message(message));
		this.socket.on("direct_message", (msg: DirectMessage) =>
			this.on_message({
				id: msg.id,
				dateTime: msg.dateTime,
				content: msg.content,
				channelId: null,
				senderId: msg.senderId,
				receiverId: msg.receiverId,
			}),
		);
		this.socket.on("user_updated", (user_update: PrivateUser | User) =>
			Users.on_user_update(user_update),
		);
		this.socket.on("user_banned", (state: any) => this.on_user_banned(state.channel_id));
		this.socket.on("channel_updated", (channel: Channel) => this.on_channel_update(channel));
		this.socket.on("invite", (friend_id: UserId) => {
			NOTIFICATIONS.spawn_invite("purple", friend_id);
		});
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
