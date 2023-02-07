import {
	t_channels_fields,
	t_games_played_fields,
	t_get_me_fields,
	t_get_me_fields_tmp,
	t_get_one_fields,
	t_get_one_fields_tmp,
} from "src/user/alias";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserBlockedError,
	UserFieldUnaivalableError,
	UserNotBlockedError,
	UserNotFoundError,
	UserNotFriendError,
	UserNotLinkedError,
	UserRelationNotFoundError,
	UserSelfBlockError,
	UserSelfMessageError,
	UserSelfUnblockError,
	UserSelfUnfriendError,
} from "src/user/error";
import { ChannelService } from "src/channel/channel.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, Logger, StreamableFile } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { DirectMessage, StateType } from "@prisma/client";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { ChatGateway } from "src/chat/chat.gateway";

@Injectable()
export class UserService {
	// REMIND: would it be better to make these properties static ?
	// REMIND: check if passing `_channel` in readonly keep it working well
	private _channel: ChannelService;
	// REMIND: check if passing `_gateway` in readonly keep it working well
	private _gateway: ChatGateway;
	// REMIND: check if passing `_prisma` in readonly keep it working well
	private _prisma: PrismaService;
	private readonly _logger: Logger;

	constructor() {
		this._channel = new ChannelService();
		this._gateway = new ChatGateway();
		this._prisma = new PrismaService();
		this._logger = new Logger(UserService.name);
	}

	/**
	 * @brief	Make a user block an other user, preventing the blocking user of :
	 * 			- being challenged by the blocked user
	 * 			- being invited to a channel by the blocked user
	 * 			- seeing the blocked user's messages
	 * 			It is assumed that the provided blocking user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	blocking_user_id The id of the user blocking the other user.
	 * @param	blocked_user_id The id of the user being blocked.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfBlockError
	 * 			- UserAlreadyBlockedError
	 *
	 * @return	An empty promise.
	 */
	public async block_one(blocking_user_id: string, blocked_user_id: string): Promise<void> {
		type t_blocking_user_fields = {
			blocked: {
				id: string;
			}[];
			friends: {
				id: string;
			}[];
			pendingFriendRequests: {
				id: string;
			}[];
		};
		type t_blocked_user_fields = {
			id: string;
			pendingFriendRequests: {
				id: string;
			}[];
		};

		const blocking_user: t_blocking_user_fields = (await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				pendingFriendRequests: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: blocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_blocking_user_fields;

		const blocked_user: t_blocked_user_fields | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				pendingFriendRequests: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: blocked_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!blocked_user) {
			throw new UserNotFoundError();
		}

		if (blocked_user_id === blocking_user_id) {
			throw new UserSelfBlockError();
		}

		for (const blocked_user of blocking_user.blocked) {
			if (blocked_user.id === blocked_user_id) {
				throw new UserAlreadyBlockedError();
			}
		}

		if (blocking_user.friends.some((friend) => friend.id === blocked_user_id)) {
			await this.unfriend_two(blocking_user_id, blocked_user_id, blocking_user, blocked_user);
		}

		if (
			blocking_user.pendingFriendRequests.some(
				(friend_request) => friend_request.id === blocked_user_id,
			)
		) {
			await this._prisma.user.update({
				data: {
					pendingFriendRequests: {
						disconnect: {
							id: blocked_user_id,
						},
					},
				},
				where: {
					idAndState: {
						id: blocking_user_id,
						state: StateType.ACTIVE,
					},
				},
			});
		}
		if (
			blocked_user.pendingFriendRequests.some(
				(friend_request) => friend_request.id === blocking_user_id,
			)
		) {
			await this._prisma.user.update({
				data: {
					pendingFriendRequests: {
						disconnect: {
							id: blocking_user_id,
						},
					},
				},
				where: {
					idAndState: {
						id: blocked_user_id,
						state: StateType.ACTIVE,
					},
				},
			});
		}

		await this._prisma.user.update({
			data: {
				blocked: {
					connect: {
						id: blocked_user_id,
					},
				},
			},
			where: {
				idAndState: {
					id: blocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		this._logger.log(`User ${blocking_user_id} blocked user ${blocked_user_id}`);
	}

	/**
	 * @brief	Create a new user in the database.
	 *
	 * @param	login The login of the user to create.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserRelationNotFoundError
	 * 			- UserFieldUnaivalableError
	 * 			- UnknownError
	 *
	 * @return	A promise containing the id of the created user.
	 */
	public async create_one(login: string): Promise<string> {
		type t_fields = {
			id: string;
		};

		const skin: t_fields | null = await this._prisma.skin.findUnique({
			select: {
				id: true,
			},
			where: {
				name: "Default",
			},
		});

		if (!skin) {
			throw new UserRelationNotFoundError();
		}

		let id: string;

		try {
			let name: string = login;
			let suffix: number = 0;

			while (
				await this._prisma.user.count({
					where: {
						name: name,
					},
				})
			) {
				name = `${login}#${suffix++}`;
			}

			id = (
				await this._prisma.user.create({
					data: {
						login: login,
						name: name,
						skinId: skin.id,
					},
				})
			).id;
			this._logger.log(`User ${id} created`);
		} catch (error) {
			this._logger.error(`Error while creating user ${login}`);
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new UserFieldUnaivalableError();
				}
				this._logger.error(`PrismaClientKnownRequestError code was ${error.code}`);
			}
			throw new UnknownError();
		}

		return id;
	}

	/**
	 * @brief	Change the account state of a user to DISABLED, before trully deleting them
	 * 			from the database a certain time later.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to delete.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	// REMIND: rename into disable_me (?)
	// TODO: remove the UnknownError from potential errors
	public async disable_one(id: string): Promise<void> {
		type t_fields = {
			id: string;
			owner: {
				id: string;
			} | null;
			members: {
				id: string;
			}[];
			operators: {
				id: string;
			}[];
		};

		try {
			const channels: t_fields[] = await this._prisma.channel.findMany({
				select: {
					id: true,
					owner: {
						select: {
							id: true,
						},
					},
					members: {
						select: {
							id: true,
						},
					},
					operators: {
						select: {
							id: true,
						},
					},
				},
				where: {
					ownerId: id,
				},
			});

			for (const channel of channels) {
				await this._channel.leave_one(channel.id, id, channel);
			}

			await this._prisma.user.update({
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
				data: {
					state: StateType.DISABLED,
				},
			});
			this._logger.log(`User ${id} disabled`);
		} catch (error) {
			this._logger.error(`Error while disabling user ${id}`);
			if (error instanceof PrismaClientKnownRequestError) {
				this._logger.error(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get a user from the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted user.
	 */
	// TODO: remove the UserNotFoundError from potential errors
	public async get_me(id: string): Promise<t_get_me_fields> {
		const user_tmp: t_get_me_fields_tmp | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				login: true,
				name: true,
				email: true,
				skinId: true,
				elo: true,
				twoFactAuth: true,
				channels: {
					select: {
						id: true,
						name: true,
						chanType: true,
					},
				},
				channelsOwned: {
					select: {
						id: true,
					},
				},
				gamesPlayed: {
					select: {
						id: true,
						players: {
							select: {
								id: true,
							},
						},
						scores: true,
						dateTime: true,
						winnerId: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
				pendingFriendRequests: {
					select: {
						id: true,
					},
				},
				blocked: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!user_tmp) {
			throw new UserNotFoundError(id);
		}

		const user: t_get_me_fields = {
			id: user_tmp.id,
			login: user_tmp.login,
			name: user_tmp.name,
			email: user_tmp.email,
			skin_id: user_tmp.skinId,
			elo: user_tmp.elo,
			two_fact_auth: user_tmp.twoFactAuth,
			channels: user_tmp.channels.map((channel): t_channels_fields => {
				return {
					id: channel.id,
					name: channel.name,
					type: channel.chanType,
				};
			}),
			channels_owned_ids: user_tmp.channelsOwned.map((channel): string => {
				return channel.id;
			}),
			games_played: user_tmp.gamesPlayed.map((game): t_games_played_fields => {
				return {
					id: game.id,
					players_ids: game.players.map((player): string => {
						return player.id;
					}) as [string, string],
					scores: game.scores as [number, number],
					date_time: game.dateTime,
					winner_id: game.winnerId,
				};
			}),
			friends_ids: user_tmp.friends.map((friend): string => {
				return friend.id;
			}),
			pending_friends_ids: user_tmp.pendingFriendRequests.map((pending_friend): string => {
				return pending_friend.id;
			}),
			blocked_ids: user_tmp.blocked.map((blocked): string => {
				return blocked.id;
			}),
		};

		this._logger.verbose(`User ${id} was successfully retrieved from the database.`);
		return user;
	}

	/**
	 * @brief	Get a user from the database.
	 * 			Requested user must be active,
	 * 			and either have at least one common channel with the requesting user,
	 * 			be friends with the requesting user, or be the requesting user.
	 * 			It is assumed that the provided requesting user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	requesting_user_id The id of the user requesting the user.
	 * @param	requested_user_id The id of the user to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserNotLinkedError
	 *
	 * @return	A promise containing the wanted user.
	 */
	public async get_one(
		requesting_user_id: string,
		requested_user_id: string,
	): Promise<t_get_one_fields> {
		type t_requesting_user_fields = {
			channels: {
				id: string;
			}[];
			friends: {
				id: string;
			}[];
		};

		const requesting_user: t_requesting_user_fields = (await this._prisma.user.findUnique({
			select: {
				channels: {
					select: {
						id: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requesting_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_requesting_user_fields;

		const requested_user_tmp: t_get_one_fields_tmp | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				login: true,
				name: true,
				skinId: true,
				elo: true,
				channels: {
					select: {
						id: true,
						name: true,
						chanType: true,
					},
				},
				gamesPlayed: {
					select: {
						id: true,
					},
				},
				gamesWon: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!requested_user_tmp) {
			throw new UserNotFoundError(requested_user_id);
		}

		const requested_user: t_get_one_fields = {
			id: requested_user_tmp.id,
			login: requested_user_tmp.login,
			name: requested_user_tmp.name,
			skin_id: requested_user_tmp.skinId,
			elo: requested_user_tmp.elo,
			channels: requested_user_tmp.channels.map((channel): t_channels_fields => {
				return {
					id: channel.id,
					name: channel.name,
					type: channel.chanType,
				};
			}),
			games_played_ids: requested_user_tmp.gamesPlayed.map((game): string => game.id),
			games_won_ids: requested_user_tmp.gamesWon.map((game): string => game.id),
		};

		if (
			requesting_user_id !== requested_user_id &&
			!requesting_user.friends.some((friend): boolean => friend.id === requested_user_id) &&
			!requested_user.channels.some((requested_user_channel): boolean =>
				requesting_user.channels.some(
					(requesting_user_channel): boolean =>
						requesting_user_channel.id === requested_user_channel.id,
				),
			)
		) {
			throw new UserNotLinkedError(`${requesting_user_id} - ${requested_user_id}`);
		}

		this._logger.verbose(
			`User ${requested_user_id} was successfully retrieved from the database.`,
		);
		return requested_user;
	}

	/**
	 * @brief	Get a user's avatar from the database.
	 * 			Requested user must be active,
	 * 			and either have at least one common channel with the requesting user,
	 * 			or be friends with the requesting user, or be the requesting user.
	 * 			It is assumed that the provided requesting user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	requesting_user_id The id of the user requesting the user's avatar.
	 * @param	requested_user_id The id of the user to get the avatar from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserNotLinkedError
	 *
	 * @return	A promise containing the wanted avatar.
	 */
	public async get_ones_avatar(
		requesting_user_id: string,
		requested_user_id: string,
	): Promise<StreamableFile> {
		type t_requesting_user_fields = {
			channels: {
				id: string;
			}[];
		};
		type t_requested_user_fields = {
			avatar: string;
			channels: {
				id: string;
			}[];
			friends: {
				id: string;
			}[];
		};

		const requesting_user: t_requesting_user_fields = (await this._prisma.user.findUnique({
			select: {
				channels: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requesting_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_requesting_user_fields;

		const requested_user: t_requested_user_fields | null = await this._prisma.user.findUnique({
			select: {
				avatar: true,
				channels: {
					select: {
						id: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: requested_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!requested_user) {
			throw new UserNotFoundError(requested_user_id);
		}

		if (
			requesting_user_id !== requested_user_id &&
			!requested_user.friends.some((friend) => friend.id === requesting_user_id) &&
			!requested_user.channels.some((requested_user_channel): boolean =>
				requesting_user.channels.some(
					(requesting_user_channel): boolean =>
						requesting_user_channel.id === requested_user_channel.id,
				),
			)
		) {
			throw new UserNotLinkedError(`${requesting_user_id} - ${requested_user_id}`);
		}

		return new StreamableFile(createReadStream(join(process.cwd(), requested_user.avatar)));
	}

	/**
	 * @brief	Get user id from its login.
	 *
	 * @param	login The login of the user to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted user id.
	 */
	public async get_ones_id_by_login(login: string): Promise<string> {
		type t_fields = {
			id: string;
		};
		const user: t_fields | null = await this._prisma.user.findUnique({
			select: {
				id: true,
			},
			where: {
				loginAndState: {
					login: login,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!user) {
			throw new UserNotFoundError(login);
		}

		return user.id;
	}

	/**
	 * @brief	Make a user send a direct message to another user.
	 * 			Receiving user must be active, not be the same as the sending user,
	 * 			and either have at least one common channel with the sending user,
	 * 			or be friends with the sending user.
	 * 			Sending user must not have blocked the receiving user.
	 * 			If the sending user has been blocked by the receiving user,
	 * 			the message will be stored in the database,
	 * 			but it will not be forwarded to the receiving user.
	 * 			It is assumed that the provided sending user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	sending_user_id The id of the user sending the message.
	 * @param	receiving_user_id The id of the user receiving the message.
	 * @param	content The content of the message.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfMessageError
	 * 			- UserNotLinkedError
	 * 			- UserBlockedError
	 */
	public async send_message_to_one(
		sending_user_id: string,
		receiving_user_id: string,
		content: string,
	): Promise<void> {
		type t_sending_user_fields = {
			blocked: {
				id: string;
			}[];
			channels: {
				id: string;
			}[];
			friends: {
				id: string;
			}[];
		};
		type t_receiving_user_fields = {
			blocked: {
				id: string;
			}[];
			channels: {
				id: string;
			}[];
		};

		const sending_user: t_sending_user_fields = (await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
				channels: {
					select: {
						id: true,
					},
				},
				friends: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: sending_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_sending_user_fields;

		const receiving_user: t_receiving_user_fields | null = await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
				channels: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: receiving_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!receiving_user) {
			throw new UserNotFoundError(receiving_user_id);
		}

		if (sending_user_id === receiving_user_id) {
			throw new UserSelfMessageError();
		}

		if (
			!receiving_user.channels.some((receiving_user_channel): boolean =>
				sending_user.channels.some(
					(sending_user_channel): boolean =>
						sending_user_channel.id === receiving_user_channel.id,
				),
			) &&
			!sending_user.friends.some((friend) => friend.id === receiving_user_id)
		) {
			throw new UserNotLinkedError(`${sending_user_id} - ${receiving_user_id}`);
		}

		if (sending_user.blocked.some((blocked) => blocked.id === receiving_user_id)) {
			throw new UserBlockedError(`${receiving_user_id}`);
		}

		const message: DirectMessage = await this._prisma.directMessage.create({
			data: {
				sender: {
					connect: {
						id: sending_user_id,
					},
				},
				receiver: {
					connect: {
						id: receiving_user_id,
					},
				},
				content,
			},
		});

		if (!receiving_user.blocked.some((blocked) => blocked.id === sending_user_id)) {
			this._gateway.forward_to_user_socket(message);
		}

		this._logger.log(`User ${sending_user_id} sent a message to user ${receiving_user_id}`);
	}

	/**
	 * @brief	Make a user unblock another user, ending the restrictions imposed by the block.
	 * 			Unblocked user must be active, be currently blocked by the unblocking user,
	 * 			and not be the same as the unblocking user.
	 * 			It is assumed that the provided unblocking user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	unblocking_user_id The id of the user unblocking the other user.
	 * @param	unblocked_user_id The id of the user being unblocked.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- SelfUnblockError
	 * 			- NotBlockedError
	 *
	 * @return	An empty promise.
	 */
	public async unblock_one(unblocking_user_id: string, unblocked_user_id: string): Promise<void> {
		type t_unblocking_user_fields = {
			blocked: {
				id: string;
			}[];
		};
		type t_unblocked_user_fields = {
			id: string;
		};

		const unblocking_user: t_unblocking_user_fields = (await this._prisma.user.findUnique({
			select: {
				blocked: {
					select: {
						id: true,
					},
				},
			},
			where: {
				idAndState: {
					id: unblocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_unblocking_user_fields;

		const unblocked_user: t_unblocked_user_fields | null = await this._prisma.user.findUnique({
			select: {
				id: true,
			},
			where: {
				idAndState: {
					id: unblocked_user_id,
					state: StateType.ACTIVE,
				},
			},
		});

		if (!unblocked_user) {
			throw new UserNotFoundError();
		}

		if (unblocked_user_id === unblocking_user_id) {
			throw new UserSelfUnblockError();
		}

		let found: boolean = false;
		for (const blocked_user of unblocking_user.blocked) {
			if (blocked_user.id === unblocked_user_id) {
				found = true;
				break;
			}
		}
		if (!found) {
			throw new UserNotBlockedError();
		}

		await this._prisma.user.update({
			data: {
				blocked: {
					disconnect: {
						id: unblocked_user_id,
					},
				},
			},
			where: {
				idAndState: {
					id: unblocking_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		this._logger.log(
			`User ${unblocked_user_id} has been unblocked by user ${unblocking_user_id}`,
		);
	}

	/**
	 * @brief	Make a user unfriend another user, removing their friendship in both directions.
	 * 			Unfriended user must be active, be friend with the unfriending user,
	 * 			and not be the same as the unfriending user.
	 * 			It is assumed that the provided unfriending user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	unfriending_user_id The id of the user unfriending the other user.
	 * @param	unfriended_user_id The id of the user being unfriended.
	 * @param	unfriending_user The user unfriending the other user. (optional)
	 * @param	unfriended_user The user being unfriended. (optional)
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfUnfriendError
	 * 			- UserNotFriendError
	 *
	 * @return	An empty promise.
	 */
	public async unfriend_two(
		unfriending_user_id: string,
		unfriended_user_id: string,
		unfriending_user?: {
			friends: {
				id: string;
			}[];
		},
		unfriended_user?: {
			id: string;
		} | null,
	): Promise<void> {
		if (!unfriending_user) {
			unfriending_user = (await this._prisma.user.findUnique({
				select: {
					friends: {
						select: {
							id: true,
						},
					},
				},
				where: {
					idAndState: {
						id: unfriending_user_id,
						state: StateType.ACTIVE,
					},
				},
			})) as {
				friends: {
					id: string;
				}[];
			};
		}

		if (!unfriended_user) {
			unfriended_user = await this._prisma.user.findUnique({
				select: {
					id: true,
				},
				where: {
					idAndState: {
						id: unfriended_user_id,
						state: StateType.ACTIVE,
					},
				},
			});

			if (!unfriended_user) {
				throw new UserNotFoundError();
			}
		}

		if (unfriended_user_id === unfriending_user_id) {
			throw new UserSelfUnfriendError();
		}

		if (!unfriending_user.friends.some((friend) => friend.id === unfriended_user_id)) {
			throw new UserNotFriendError();
		}

		await this._prisma.user.update({
			data: {
				friends: {
					disconnect: {
						idAndState: {
							id: unfriended_user_id,
							state: StateType.ACTIVE,
						},
					},
				},
			},
			where: {
				idAndState: {
					id: unfriending_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		await this._prisma.user.update({
			data: {
				friends: {
					disconnect: {
						idAndState: {
							id: unfriending_user_id,
							state: StateType.ACTIVE,
						},
					},
				},
			},
			where: {
				idAndState: {
					id: unfriended_user_id,
					state: StateType.ACTIVE,
				},
			},
		});
		this._logger.log(
			`User ${unfriended_user_id} has been unfriended by user ${unfriending_user_id}`,
		);
	}

	/**
	 * @brief	Update a user in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to update.
	 * @param	name The new name of the user.
	 * @param	email The new email of the user.
	 * @param	two_fact_auth The new two factor authentication state of the user.
	 * @param	skin_id The new skin id of the user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserFieldUnaivalableError
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	// REMIND: rename into update_me (?)
	public async update_one(
		id: string,
		name?: string,
		email?: string,
		two_fact_auth?: boolean,
		skin_id?: string,
	): Promise<void> {
		type t_fields = {
			name: string;
			email: string | null;
			twoFactAuth: boolean;
			skinId: string;
		};

		const user: t_fields = (await this._prisma.user.findUnique({
			select: {
				name: true,
				email: true,
				twoFactAuth: true,
				skinId: true,
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_fields;

		if (name !== undefined) user.name = name;
		if (email !== undefined) user.email = email;
		if (two_fact_auth !== undefined) user.twoFactAuth = two_fact_auth;
		if (skin_id !== undefined) user.skinId = skin_id;

		try {
			await this._prisma.user.update({
				data: user,
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
			});
		} catch (error) {
			this._logger.error(`Error occured while updating user ${id}`);
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new UserFieldUnaivalableError();
				}
				this._logger.error(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Update a user's avatar in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is ACTIVE)
	 *
	 * @param	id The id of the user to update the avatar from.
	 * @param	file The file containing the new avatar.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async update_ones_avatar(id: string, file: Express.Multer.File): Promise<void> {
		type t_fields = {
			avatar: string;
		};

		const user: t_fields = (await this._prisma.user.findUnique({
			select: {
				avatar: true,
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		})) as t_fields;

		if (user.avatar === "resource/avatar/default.jpg") {
			await this._prisma.user.update({
				data: {
					avatar: `resource/avatar/${id}.jpg`,
				},
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
			});
		}
		try {
			createWriteStream(join(process.cwd(), user.avatar)).write(file.buffer);
		} catch (error) {
			if (error instanceof Error)
				this._logger.error(`Error occured while writing avatar to disk: ${error.message}`);
			throw new UnknownError();
		}
		this._logger.log(`Updated user ${id}'s avatar`);
	}
}
