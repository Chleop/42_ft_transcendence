import { t_relations } from "src/user/alias";
import { UserCreateDto, UserUpdateDto } from "src/user/dto";
import {
	UnknownError,
	UserFieldUnaivalableError,
	UserNotFoundError,
	UserRelationNotFoundError,
} from "src/user/error";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, StreamableFile } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { User } from "@prisma/client";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";

@Injectable()
export class UserService {
	private _prisma: PrismaService;

	constructor() {
		this._prisma = new PrismaService();
	}

	/**
	 * @brief	Create a new user in the database.
	 *
	 * @param	dto The dto containing the data to create the user.
	 *
	 * @potential_throws
	 * - UserRelationNotFoundError
	 * - UserFieldUnaivalableError
	 * - UnknownError
	 *
	 * @return	A promise containing the id of the created user.
	 */
	public async create_one(dto: UserCreateDto): Promise<string> {
		type t_fields = {
			id: string;
		};

		console.log("Getting default skin...");
		const skin: t_fields | null = await this._prisma.skin.findUnique({
			where: {
				name: "Default",
			},
			select: {
				id: true,
			},
		});

		if (!skin) {
			throw new UserRelationNotFoundError();
		}

		let id: string;

		try {
			console.log("Creating user...");
			id = (
				await this._prisma.user.create({
					data: {
						name: dto.name,
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
	 * @brief	Delete a user from the database.
	 *
	 * @param	id The id of the user to delete.
	 *
	 * @potential_throws
	 * - UserNotFoundError
	 * - UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async delete_one(id: string): Promise<void> {
		try {
			console.log("Deleting user...");
			await this._prisma.user.delete({
				where: {
					id: id,
				},
			});
			console.log("User deleted");
		} catch (error) {
			console.log("Error occured while deleting user");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2025":
						throw new UserNotFoundError();
				}
				console.log(`PrismaClientKnownRequestError code was ${error.code}`);
			}

			throw new UnknownError();
		}
	}

	/**
	 * @brief	Get a user from the database.
	 *
	 * @param	id The id of the user to get.
	 *
	 * @potential_throws
	 * - UserNotFoundError
	 *
	 * @return	A promise containing the wanted user.
	 */
	public async get_one(id: string): Promise<User & t_relations> {
		console.log("Searching user...");
		const user: (User & t_relations) | null = await this._prisma.user.findUnique({
			include: {
				skin: true,
				channels: true,
				gamesPlayed: true,
				gamesWon: true,
				friends: true,
				blocked: true,
			},
			where: {
				id: id,
			},
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		console.log("User found");
		return user;
	}

	/**
	 * @brief	Get a user's avatar from the database.
	 *
	 * @param	id The id of the user to get the avatar from.
	 *
	 * @potential_throws
	 * - UserNotFoundError
	 *
	 * @return	A promise containing the wanted avatar.
	 */
	public async get_ones_avatar(id: string): Promise<StreamableFile> {
		type t_fields = {
			avatar: string;
		};

		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			select: {
				avatar: true,
			},
			where: {
				id: id,
			},
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		console.log("User found");
		return new StreamableFile(createReadStream(join(process.cwd(), user.avatar)));
	}

	/**
	 * @brief	Update a user in the database.
	 *
	 * @param	id The id of the user to update.
	 * @param	dto The dto containing the fields to update.
	 *
	 * @potential_throws
	 * - UserNotFoundError
	 * - UserFieldUnaivalableError
	 * - UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async update_one(id: string, dto: UserUpdateDto): Promise<void> {
		type t_fields = {
			name: string;
			email: string | null;
			twoFactAuth: boolean;
			skinId: string;
		};

		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			where: {
				id: id,
			},
			select: {
				name: true,
				email: true,
				twoFactAuth: true,
				skinId: true,
			},
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		console.log("User found");

		if (dto.name !== undefined) user.name = dto.name;
		if (dto.email !== undefined) user.email = dto.email;
		if (dto.two_fact_auth !== undefined) user.twoFactAuth = dto.two_fact_auth;
		if (dto.skin_id !== undefined) user.skinId = dto.skin_id;

		try {
			console.log("Updating user...");
			await this._prisma.user.update({
				where: {
					id: id,
				},
				data: user,
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
	 * @potential_throws
	 * - UserNotFoundError
	 * - UnknownError
	 *
	 * @return	An empty promise.
	 */
	public async update_ones_avatar(id: string, file: Express.Multer.File): Promise<void> {
		type t_fields = {
			avatar: string;
		};

		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			where: {
				id: id,
			},
			select: {
				avatar: true,
			},
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		console.log("User found");

		console.log("Updating user's avatar...");
		if (user.avatar === "resource/avatar/default.jpg") {
			console.log("User's avatar is default, creating new one");
			user.avatar = `resource/avatar/${id}.jpg`;

			try {
				console.log("Updating user...");
				await this._prisma.user.update({
					where: {
						id: id,
					},
					data: user,
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
