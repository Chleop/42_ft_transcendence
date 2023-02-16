import { Injectable, Logger } from "@nestjs/common";
import { Socket } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { e_user_status } from "src/user/alias";
import { t_user_id, t_user_status } from "./alias";

@Injectable()
export class ChatService {
	private _user_map: Map<string, t_user_status>;
	private readonly _prisma_service: PrismaService;
	private readonly _logger: Logger;

	constructor(prisma_service: PrismaService) {
		this._user_map = new Map<string, t_user_status>();
		this._prisma_service = prisma_service;
		this._logger = new Logger(ChatService.name);
		this._logger.log("Chat service initialized");
	}

	// add user to map
	public add_user(socket: Socket): void {
		this._user_map.set(socket.data.user.id, {
			socket: socket,
			status: e_user_status.ONLINE,
			spectated_user: undefined,
		});
		// this._logger.debug(this._user_map.get(id));
		// console.log(this._user_map.get(id));
	}

	// remove user from map
	public remove_user(id: string): void {
		this._user_map.delete(id);
	}

	// get user from map
	public get_user(id: string): t_user_status | undefined {
		this._logger.debug(this._user_map.get(id));
		return this._user_map.get(id);
	}

	// get all users from map
	public get_all_users(): Map<string, t_user_status> {
		return this._user_map;
	}

	// update user
	public update_user(id: string, status: e_user_status, spectated_user?: string): void {
		const user: t_user_status | undefined = this._user_map.get(id);

		if (user) {
			user.status = status;
			if (spectated_user !== undefined) user.spectated_user = spectated_user;
		}
	}

	// get all users are related to a user and connected
	public async get_online_related_users(id: string): Promise<t_user_id[]> {
		const users: t_user_id[] = await this._prisma_service.user.findMany({
			select: {
				id: true,
			},
			where: {
				OR: [
					{
						friends: {
							some: {
								id,
							},
						},
					},
					{
						channels: {
							some: {
								members: {
									some: {
										id,
									},
								},
							},
						},
					},
					{
						directMessagesSent: {
							some: {
								receiverId: id,
							},
						},
					},
					{
						directMessagesReceived: {
							some: {
								senderId: id,
							},
						},
					},
					{
						gamesPlayed: {
							some: {
								players: {
									some: {
										id,
									},
								},
							},
						},
					},
				],
				NOT: {
					id,
				},
			},
		});

		return users.filter((user: t_user_id) => {
			return this._user_map.has(user.id);
		});
	}
}
