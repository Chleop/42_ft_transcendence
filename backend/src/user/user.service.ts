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
	UserFieldUnaivalableError,
	UserNotBlockedError,
	UserNotFoundError,
	UserNotFriendError,
	UserNotLinkedError,
	UserRelationNotFoundError,
	UserSelfBlockError,
	UserSelfUnblockError,
	UserSelfUnfriendError,
} from "src/user/error";
import { ChannelService } from "src/channel/channel.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, StreamableFile } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { StateType } from "@prisma/client";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";

@Injectable()
export class UserService {
	private _prisma: PrismaService;
	private _channel: ChannelService;

	constructor() {
		this._channel = new ChannelService();
		this._prisma = new PrismaService();
	}

	/**
	 * @brief	Make a user block an other user, preventing the blocking user of :
	 * 			- being challenged by the blocked user
	 * 			- being invited to a channel by the blocked user
	 * 			- seeing the blocked user's messages
	 * 			It is assumed that the provided blocking user id is valid.
	 * 			(user exists and is not DISABLED)
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

		console.log("Searching for blocking user...");
		const blocking_user: t_blocking_user_fields | null = await this._prisma.user.findUnique({
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
		});

		if (!blocking_user) {
			throw new UserNotFoundError();
		}

		console.log("Searching for blocked user...");
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

		console.log("Checking for self blocking...");
		if (blocked_user_id === blocking_user_id) {
			throw new UserSelfBlockError();
		}

		console.log("Checking for already blocked...");
		for (const blocked_user of blocking_user.blocked) {
			if (blocked_user.id === blocked_user_id) {
				throw new UserAlreadyBlockedError();
			}
		}

		console.log("Checking for friendship to remove...");
		if (blocking_user.friends.some((friend) => friend.id === blocked_user_id)) {
			await this.unfriend_two(blocking_user_id, blocked_user_id, blocking_user, blocked_user);
		}

		console.log("Checking for pending friend request to remove...");
		if (
			blocking_user.pendingFriendRequests.some(
				(friend_request) => friend_request.id === blocked_user_id,
			)
		) {
			console.log("Removing pending friend request...");
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

		console.log("Blocking user...");
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
		console.log("User blocked");
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

		console.log("Getting default skin...");
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

			console.log("Creating user...");
			id = (
				await this._prisma.user.create({
					data: {
						login: login,
						name: name,
						skinId: skin.id,
					},
				})
			).id;
			console.log("User created");
		} catch (error) {
			console.log("Error occured while creating user");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new UserFieldUnaivalableError();
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}
			throw new UnknownError();
		}

		return id;
	}

	/**
	 * @brief	Change the account state of a user to DISABLED, before trully deleting them
	 * 			from the database a certain time later.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	id The id of the user to delete.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
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
			console.log("Searching channels joined by the user to disable...");
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

			console.log("Disabling user...");
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
			console.log("User disabled");
		} catch (error) {
			console.log("Error occured while disabling user");
			if (error instanceof PrismaClientKnownRequestError) {
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get a user from the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
	 *
	 * @param	id The id of the user to get.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 *
	 * @return	A promise containing the wanted user.
	 */
	public async get_me(id: string): Promise<t_get_me_fields> {
		console.log("Searching for user...");
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

		console.log("User found");
		return user;
	}

	/**
	 * @brief	Get a user from the database.
	 * 			Requested user must be active,
	 * 			and either have at least one common channel with the requesting user,
	 * 			be friends with the requesting user, or be the requesting user.
	 * 			It is assumed that the provided requesting user id is valid.
	 * 			(user exists and is not DISABLED)
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

		console.log("Searching for requesting user...");
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

		console.log("Searching for requested user...");
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

		console.log("Checking for both users to be linked through a channel, a friendship, or to be the same...");
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

		console.log("User found");
		return requested_user;
	}

	/**
	 * @brief	Get a user's avatar from the database.
	 * 			Requested user must be active,
	 * 			and either have at least one common channel with the requesting user,
	 * 			or be friends with the requesting user, or be the requesting user.
	 * 			It is assumed that the provided requesting user id is valid.
	 * 			(user exists and is not DISABLED)
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

		console.log("Searching for requesting user...");
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

		console.log("Searching for requested user...");
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

		console.log("Checking for both users to be linked through a channel, a friendship, or to be the same...");
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

		console.log("Returning wanted avatar...");
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
		console.log("Searching for user...");
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

		console.log("User found");
		return user.id;
	}

	/**
	 * @brief	Make a user unblock another user, ending the restrictions imposed by the block.
	 * 			Unblocked user must be active, by currently blocked by the unblocking user,
	 * 			and not be the same as the unblocking user.
	 * 			It is assumed that the provided unblocking user id is valid.
	 * 			(user exists and is not DISABLED)
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

		console.log("Searching for unblocking user...");
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

		console.log("Searching for unblocked user...");
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

		console.log("Checking for self unblocking...");
		if (unblocked_user_id === unblocking_user_id) {
			throw new UserSelfUnblockError();
		}

		console.log("Checking for not blocked...");
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

		console.log("Unblocking user...");
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
		console.log("User unblocked");
	}

	/**
	 * @brief	Make a user unfriend another user, removing their friendship in both directions.
	 * 			Unfriended user must be active, be friend with the unfriending user,
	 * 			and not be the same as the unfriending user.
	 * 			It is assumed that the provided unfriending user id is valid.
	 * 			(user exists and is not DISABLED)
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
			console.log("Searching for unfriending user...");
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

			if (!unfriending_user) {
				throw new UserNotFoundError();
			}
		}

		if (!unfriended_user) {
			console.log("Searching for unfriended user...");
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

		console.log("Checking for self unfriending...");
		if (unfriended_user_id === unfriending_user_id) {
			throw new UserSelfUnfriendError();
		}

		console.log("Checking for not friends...");
		if (!unfriending_user.friends.some((friend) => friend.id === unfriended_user_id)) {
			throw new UserNotFriendError();
		}

		console.log("Unfriending users...");
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
		console.log("Users unfriended");
	}

	/**
	 * @brief	Update a user in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
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

		console.log("Searching for user...");
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
			console.log("Updating user...");
			await this._prisma.user.update({
				data: user,
				where: {
					idAndState: {
						id: id,
						state: StateType.ACTIVE,
					},
				},
			});
			console.log("User updated");
		} catch (error) {
			console.log("Error occured while updating user");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new UserFieldUnaivalableError();
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Update a user's avatar in the database.
	 * 			It is assumed that the provided user id is valid.
	 * 			(user exists and is not DISABLED)
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

		console.log("Searching for user...");
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

		if (!user) {
			throw new UserNotFoundError(id);
		}

		console.log("Updating user's avatar...");
		if (user.avatar === "resource/avatar/default.jpg") {
			console.log("User's avatar is default, creating new one");
			user.avatar = `resource/avatar/${id}.jpg`;

			try {
				console.log("Updating user...");
				await this._prisma.user.update({
					data: user,
					where: {
						idAndState: {
							id: id,
							state: StateType.ACTIVE,
						},
					},
				});
				console.log("User updated");
			} catch (error) {
				console.log("Error occured while updating user's avatar");
				if (error instanceof PrismaClientKnownRequestError) {
					console.log(`PrismaClientKnownRequestError code was ${error.code}`);
				}

				throw new UnknownError();
			}
		}
		try {
			console.log("Updating avatar's file...");
			createWriteStream(join(process.cwd(), user.avatar)).write(file.buffer);
			console.log("Avatar's file updated");
		} catch (error) {
			if (error instanceof Error)
				console.log(`Error occured while writing avatar to disk: ${error.message}`);
			throw new UnknownError();
		}

		console.log("User's avatar updated");
	}
}
