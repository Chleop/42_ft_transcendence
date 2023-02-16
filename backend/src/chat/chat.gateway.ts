import { Server, Socket } from "socket.io";
import { ChannelMessage, DirectMessage } from "@prisma/client";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { t_user_id } from "./alias";
import { UserService } from "src/user/user.service";
import { t_user_status } from "src/user/alias/user_update_event.alias";

@WebSocketGateway({
	namespace: "chat",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly _server: Server;
	private _client_sockets: Map<string, { socket: Socket; status: t_user_status }> = new Map<
		string,
		{ socket: Socket; status: t_user_status }
	>();
	private readonly _user_service: UserService;
	private readonly _logger: Logger;

	constructor() {
		this._server = new Server();
		this._logger = new Logger(ChatGateway.name);
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
		for (const obj of this._client_sockets.values()) {
			if (obj.socket.rooms.has(message.channelId)) {
				obj.socket.emit("channel_message", message);
			}
		}
	}

	/**
	 * @brief	Broadcast an event to a set of users.
	 * 			It is assumed that the provided user ids are valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	event_name The name of the event to broadcast.
	 * @param	users A set of users to broadcast to.
	 * @param	data Data to send with the event.
	 */
	public broadcast_to_many(event_name: string, users: Set<t_user_id>, data: any): void {
		for (const user of users) {
			const socket: Socket | undefined = this._client_sockets.get(user.id)?.socket;

			if (socket) {
				socket.emit(event_name, data);
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
		const socket: Socket = this._client_sockets.get(message.receiverId)?.socket as Socket;

		socket.emit("direct_message", message);
	}

	/**
	 * @brief	Return the status of a user.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 */
	public get_user_status(user_id: string): t_user_status {
		if (!this._client_sockets.has(user_id)) {
			return t_user_status.OFFLINE;
		}
		return this._client_sockets.get(user_id)?.status as t_user_status;
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
		this._logger.log(
			`Client ${client.id} (${client.data.user.login}) connected to chat gateway`,
		);
		this._client_sockets.set(client.data.user.id, {
			socket: client,
			status: t_user_status.ONLINE,
		});
		for (const channel of client.data.user.channels) {
			client.join(channel.id);
		}
		this._user_service.broadcast_user_update_to_many({
			id: client.data.user.id,
			status: t_user_status.ONLINE,
		});
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
		this._user_service.broadcast_user_update_to_many({
			id: client.data.user.id,
			status: t_user_status.OFFLINE,
		});
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
		const client: Socket = this._client_sockets.get(user_id)?.socket as Socket;

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
		const client: Socket = this._client_sockets.get(user_id)?.socket as Socket;

		client.leave(room_id);
	}
}
