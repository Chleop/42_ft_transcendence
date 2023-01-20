import { t_relations } from "src/user/alias";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserFieldUnaivalableError,
	UserNotBlockedError,
	UserNotFoundError,
	UserNotLinkedError,
	UserRelationNotFoundError,
	UserSelfBlockError,
	UserSelfUnblockError,
} from "src/user/error";
import { ChannelService } from "src/channel/channel.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, StreamableFile } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { StateType, User } from "@prisma/client";
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
	 * @brief	Make an user block an other user, preventing the blocking user of :
	 * 			- being challenged by the blocked user
	 * 			- being invited to a channel by the blocked user
	 * 			- seeing the blocked user's messages
	 *
	 * @param	dto The dto containing the data to block an user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UserSelfBlockError
	 * 			- UserAlreadyBlockedError
	 */
	public async block_one(blocked_user_id: string, blocking_user_id: string): Promise<void> {
		console.log("Checking if blocking user exists...");
		if (
			!(await this._prisma.user.count({
				where: {
					id: blocking_user_id,
				},
			}))
		) {
			throw new UserNotFoundError();
		}

		console.log("Checking if blocked user exists...");
		if (
			!(await this._prisma.user.count({
				where: {
					id: blocked_user_id,
				},
			}))
		) {
			throw new UserNotFoundError();
		}

		console.log("Checking for self-blocking...");
		if (blocked_user_id === blocking_user_id) {
			throw new UserSelfBlockError();
		}

		console.log("Checking for already blocked...");
		if (
			await this._prisma.user.count({
				where: {
					id: blocking_user_id,
					blocked: {
						some: {
							id: blocked_user_id,
						},
					},
				},
			})
		) {
			throw new UserAlreadyBlockedError();
		}

		console.log("Blocking user...");
		await this._prisma.user.update({
			where: {
				id: blocking_user_id,
			},
			data: {
				blocked: {
					connect: {
						id: blocked_user_id,
					},
				},
			},
		});
		console.log("User blocked");
	}

	/**
	 * @brief	Check whether two users are friends.
	 *
	 * @param	id The id of the first user.
	 * @param	friends The friends of the second user.
	 *
	 * @return	Either true if the two users are friends, or false if not.
	 */
	private _are_friends(
		id: string,
		friends: {
			id: string;
		}[],
	): boolean {
		for (let friend of friends) {
			if (friend.id === id) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @brief	Check whether two arrays of channels share at least one common channel.
	 *
	 * @param	channels0 The first array of channels.
	 * @param	channels1 The second array of channels.
	 *
	 * @return	Either true if both arrays share at least one common channel, or false if not.
	 */
	private _have_common_channel(
		channels0: {
			id: string;
		}[],
		channels1: {
			id: string;
		}[],
	): boolean {
		for (let channel0 of channels0) {
			for (let channel1 of channels1) {
				if (channel0.id === channel1.id) {
					return true;
				}
			}
		}
		return false;
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
	 * @brief	Change the account state of an user to DISABLED, before trully deleting them
	 * 			from the database a certain time later.
	 *
	 * @param	id The id of the user to delete.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
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
				switch (error.code) {
					case "P2025":
						throw new UserNotFoundError(id);
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get an user from the database.
	 * 			Both of the requesting and the requested user must be active,
	 * 			and have at least one common channel, be friends, or be the same.
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
	): Promise<User & t_relations> {
		type t_fields = {
			channels: {
				id: string;
			}[];
		};

		console.log("Searching for requesting user...");
		const requesting_user: t_fields | null = await this._prisma.user.findUnique({
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
		});

		if (!requesting_user) {
			throw new UserNotFoundError(requesting_user_id);
		}

		console.log("Searching for requested user...");
		const requested_user: (User & t_relations) | null = await this._prisma.user.findUnique({
			include: {
				skin: true,
				channels: true,
				gamesPlayed: true,
				gamesWon: true,
				friends: true,
				blocked: true,
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

		console.log(
			"Checking for both users to be linked through a channel, a friendship, or to be the same...",
		);
		if (
			requesting_user_id !== requested_user_id &&
			!this._are_friends(requesting_user_id, requested_user.friends) &&
			!this._have_common_channel(requesting_user.channels, requested_user.channels)
		) {
			throw new UserNotLinkedError(`${requesting_user_id} - ${requested_user_id}`);
		}

		console.log("User found");
		return requested_user;
	}

	/**
	 * @brief	Get an user's avatar from the database.
	 * 			Both of the requesting and the requested user must be active,
	 * 			and have at least one common channel, be friends, or be the same.
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
		const requesting_user: t_requesting_user_fields | null = await this._prisma.user.findUnique(
			{
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
			},
		);

		if (!requesting_user) {
			throw new UserNotFoundError(requesting_user_id);
		}

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

		console.log(
			"Checking for both users to be linked through a channel, a friendship, or to be the same...",
		);
		if (
			requesting_user_id !== requested_user_id &&
			!this._are_friends(requesting_user_id, requested_user.friends) &&
			!this._have_common_channel(requesting_user.channels, requested_user.channels)
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
		console.log("Searching user...");
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
	 * @brief	Make an user unblock an other user, ending the restrictions imposed by the block.
	 *
	 * @param	dto The dto containing the data to unblock an user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- SelfUnblockError
	 * 			- NotBlockedError
	 */
	public async unblock_one(unblocked_user_id: string, unblocking_user_id: string): Promise<void> {
		console.log("Checking for unblocking user's existence...");
		if (
			!(await this._prisma.user.count({
				where: {
					id: unblocking_user_id,
				},
			}))
		) {
			throw new UserNotFoundError();
		}

		console.log("Checking for unblocked user's existence...");
		if (
			!(await this._prisma.user.count({
				where: {
					id: unblocked_user_id,
				},
			}))
		) {
			throw new UserNotFoundError();
		}

		console.log("Checking for self-unblocking...");
		if (unblocked_user_id === unblocking_user_id) {
			throw new UserSelfUnblockError();
		}

		console.log("Checking for not blocked...");
		if (
			!(await this._prisma.user.count({
				where: {
					id: unblocking_user_id,
					blocked: {
						some: {
							id: unblocked_user_id,
						},
					},
				},
			}))
		) {
			throw new UserNotBlockedError();
		}

		console.log("Unblocking user...");
		await this._prisma.user.update({
			where: {
				id: unblocking_user_id,
			},
			data: {
				blocked: {
					disconnect: {
						id: unblocked_user_id,
					},
				},
			},
		});
		console.log("User unblocked");
	}

	/**
	 * @brief	Update a user in the database.
	 *
	 * @param	id The id of the user to update.
	 * @param	name The new name of the user.
	 * @param	email The new email of the user.
	 * @param	two_fact_auth The new two factor authentication state of the user.
	 * @param	skin_id The new skin id of the user.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
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

		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
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
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		console.log("User found");

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
	 *
	 * @param	id The id of the user to update the avatar from.
	 * @param	file The file containing the new avatar.
	 *
	 * @error	The following errors may be thrown :
	 * 			- UserNotFoundError
	 * 			- UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async update_ones_avatar(id: string, file: Express.Multer.File): Promise<void> {
		type t_fields = {
			avatar: string;
		};

		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			select: {
				avatar: true,
			},
			where: {
				idAndState: {
					id: id,
					state: StateType.ACTIVE,
				},
			},
		});

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
