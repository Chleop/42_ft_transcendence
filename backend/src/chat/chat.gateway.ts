import { t_user_id } from "src/chat/alias";
import { t_user_update_event } from "src/user/alias";
import { e_user_status } from "src/user/enum";
import { ChatService } from "src/chat/chat.service";
import { Logger } from "@nestjs/common";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChannelMessage, DirectMessage } from "@prisma/client";

@WebSocketGateway({
	namespace: "chat",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly _server: Server;
	private readonly _chat_service: ChatService;
	private readonly _logger: Logger;

	constructor(chat_service: ChatService) {
		this._server = new Server();
		this._chat_service = chat_service;
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
		this._server.to(message.channelId).emit("channel_message", message);
	}

	public async broadcast_to_online_related_users(data: t_user_update_event): Promise<void> {
		if (data.status !== undefined)
			this._chat_service.update_user(data.id, data.status, data.spectating);

		const users: t_user_id[] = await this._chat_service.get_online_related_users(data.id);
		for (const user of users) {
			const socket: Socket | undefined = this._chat_service.get_user(user.id)?.socket;

			if (socket) {
				socket.emit("user_updated", data);
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
		const socket: Socket | undefined = this._chat_service.get_user(message.receiverId)?.socket;

		// if (socket === undefined) return;
		socket?.emit("direct_message", message);
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
		this._chat_service.add_user(client);
		for (const channel of client.data.user.channels) {
			client.join(channel.id);
		}

		this.broadcast_to_online_related_users({
			id: client.data.user.id,
			status: e_user_status.ONLINE,
		});
	}

	/**
	 * @brief	Removing a client socket from the list of connected sockets.
	 *
	 * @param	client The socket that just disconnected.
	 */
	public handleDisconnect(client: Socket): void {
		this._chat_service.remove_user(client.data.user.id);

		this.broadcast_to_online_related_users({
			id: client.data.user.id,
			status: e_user_status.OFFLINE,
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
		const client: Socket | undefined = this._chat_service.get_user(user_id)?.socket;

		// if (client === undefined) return;
		client?.join(room_id);
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
		const client: Socket | undefined = this._chat_service.get_user(user_id)?.socket;

		// if (client === undefined) return;
		client?.leave(room_id);
	}
}
