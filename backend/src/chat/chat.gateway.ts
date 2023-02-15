import { Server, Socket } from "socket.io";
import { ChannelMessage, DirectMessage } from "@prisma/client";
import {
	// OnGatewayConnection,
	// OnGatewayDisconnect,
	// OnGatewayInit,
	// SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Logger, UseInterceptors } from "@nestjs/common";
import { WebSocketInterceptor } from "../websocket.interceptor";

@WebSocketGateway({
	namespace: "chat",
})
@UseInterceptors(WebSocketInterceptor)
export class ChatGateway /* implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit */ {
	@WebSocketServer()
	public readonly _server: Server;
	private _client_sockets: Map<string, Socket> = new Map<string, Socket>();
	private _logger: Logger = new Logger(ChatGateway.name);

	constructor() {
		this._server = new Server();
	}

	public afterInit(): void {
		this._logger.log("Chat gateway initialized");
	}

	/**
	 * @brief	Broadcast a message to all users who are joined to a specific socket room.
	 *
	 * @param	message The message to broadcast.
	 */
	public broadcast_to_room(message: ChannelMessage): void {
		// REMIND: This way works, but it is not taking advantage of socker-io built-in ways to do it.
		for (const socket of this._client_sockets.values()) {
			if (socket.rooms.has(message.channelId)) {
				socket.emit("channel_message", message);
			}
		}
	}

	/**
	 * @brief	Forward a message to a specific user through its socket.
	 * 			It is assumed that the receiving user id which is stored in the message
	 * 			corresponds to a valid socket.
	 * 			(connected to the chat gateway)
	 *
	 * @param	message The message to forward.
	 */
	public forward_to_user_socket(message: DirectMessage): void {
		const socket: Socket = this._client_sockets.get(message.receiverId) as Socket;

		socket.emit("direct_message", message);
	}

	/**e
	 * @brief	Accept a new connection and store the client socket,
	 * 			mapping it with its corresponding user id.
	 * 			Make the client socket join the socket rooms
	 * 			corresponding to the channels the user is currently joined in.
	 *
	 * @param	client The socket that just connected.
	 */
	public handleConnection(client: Socket): void {
		const user: Socket | undefined = this._client_sockets.get(client.data.user.id);

		if (user !== undefined) {
			this._logger.error("already there");
		} else {
			this._logger.log(
				`Client ${client.id} (${client.data.user.login}) connected to chat gateway`,
			);
			this._client_sockets.set(client.data.user.id, client);
			for (const channel of client.data.user.channels) {
				client.join(channel.id);
			}
		}
	}

	/**
	 * @brief	Removing a client socket from the list of connected sockets.
	 *
	 * @param	client The socket that just disconnected.
	 */
	public handleDisconnect(client: Socket): void {
		for (const room of client.rooms) {
			client.leave(room);
		}
		this._client_sockets.delete(client.data.user.id);
		this._logger.log(
			`Client ${client.id} (${client.data.user.login}) disconnected from chat gateway`,
		);
	}

	/**
	 * @brief	Add a socket to a socket room,
	 * 			allowing to broadcast messages to a specific subset of users.
	 * 			It is assumed that the provided user id corresponds to a valid socket.
	 * 			(connected and not joined in the wanted room yet)
	 *
	 * @param	user_id The id of the user whose socket is to be joined in the room.
	 * @param	room_id The id of the room to join.
	 */
	public make_user_socket_join_room(user_id: string, room_id: string): void {
		const client: Socket = this._client_sockets.get(user_id) as Socket;

		client.join(room_id);
	}

	/**
	 * @brief	Remove a socket from a socket room,
	 * 			preventing to broadcast messages to a specific subset of users.
	 * 			It is assumed that the provided user id corresponds to a valid socket.
	 * 			(connected and joined in the wanted room)
	 * 			It is assumed that the provided room id correspond to a valid room.
	 *
	 * @param	user_id The id of the user whose socket is to be left from the room.
	 * @param	room_id The id of the room to leave.
	 */
	public make_user_socket_leave_room(user_id: string, room_id: string): void {
		const client: Socket = this._client_sockets.get(user_id) as Socket;

		client.leave(room_id);
	}
}
