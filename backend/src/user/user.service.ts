import { t_relations } from "./alias";
import { UserCreateDto, UserUpdateDto } from "./dto";
import { e_status } from "./enum";
import { Injectable, StreamableFile } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { PrismaService } from "src/prisma/prisma.service";
import { User } from "@prisma/client";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";

@Injectable()
export class UserService {
	private _prisma: PrismaService;

	constructor(prisma: PrismaService) {
		this._prisma = prisma;
	}

	/**
	 * @brief	Create a new user in the database.
	 *
	 * @param	dto The dto containing the data to create the user.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async create_one(dto: UserCreateDto): Promise<e_status> {
		type t_fields = {
			id: string;
		};

		const skin: t_fields | null = await this._prisma.skin.findUnique({
			where: {
				name: "Default",
			},
			select: {
				id: true,
			},
		});

		if (skin === null) {
			return e_status.ERR_USER_RELATION_NOT_FOUND;
		}

		try {
			// DBG
			console.log("Creating user...");
			await this._prisma.user.create({
				data: {
					name: dto.name,
					// email: dto.email,
					// twoFactAuth: dto.two_fact_auth,
					// twoFactSecret: dto.two_fact_secret,
					skinId: skin.id,
				},
			});
			// DBG
			console.log("User created");
		} catch (error) {
			// DBG
			console.log("Error occured while creating user");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						return e_status.ERR_USER_FIELD_UNAVAILABLE;
				}
				console.log(error.code);
			}

			return e_status.ERR_UNKNOWN;
		}

		return e_status.SUCCESS;
	}

	/**
	 * @brief	Delete a user from the database.
	 *
	 * @param	id The id of the user to delete.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async delete_one(id: string): Promise<e_status> {
		try {
			// DBG
			console.log("Deleting user...");
			await this._prisma.user.delete({
				where: {
					id: id,
				},
			});
			// DBG
			console.log("User deleted");
		} catch (error) {
			// DBG
			console.log("Error occured while deleting user");
			if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
				return e_status.ERR_USER_NOT_FOUND;
			}
			return e_status.ERR_UNKNOWN;
		}
		return e_status.SUCCESS;
	}

	/**
	 * @brief	Get a user from the database.
	 *
	 * @param	name The name of the user to get.
	 *
	 * @return	A promise containing the user and the status of the operation.
	 */
	public async get_one(
		name: string,
	): Promise<{ user: (User & t_relations) | null; status: e_status }> {
		// DBG
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
				name: name,
			},
		});

		if (user === null) {
			// DBG
			console.log("No such user");
			return { user: null, status: e_status.ERR_USER_NOT_FOUND };
		}

		// DBG
		console.log("User found");
		return { user, status: e_status.SUCCESS };
	}

	/**
	 * @brief	Get a user's avatar from the database.
	 *
	 * @param	id The id of the user to get the avatar from.
	 *
	 * @return	A promise containing the avatar and the status of the operation.
	 */
	public async get_ones_avatar(
		id: string,
	): Promise<{ sfile: StreamableFile | null; status: e_status }> {
		type t_fields = {
			avatar: string;
		};

		// DBG
		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			select: {
				avatar: true,
			},
			where: {
				id: id,
			},
		});

		if (user === null) {
			// DBG
			console.log("No such user");
			return { sfile: null, status: e_status.ERR_USER_NOT_FOUND };
		}

		// DBG
		console.log("User found");
		return {
			sfile: new StreamableFile(createReadStream(join(process.cwd(), user.avatar))),
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Update a user in the database.
	 *
	 * @param	id The id of the user to update.
	 * @param	dto The dto containing the fields to update.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async update_one(id: string, dto: UserUpdateDto): Promise<e_status> {
		type t_fields = {
			name: string;
			// email: string;
			twoFactAuth: boolean;
			skinId: string;
		};

		// DBG
		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			where: {
				id: id,
			},
			select: {
				name: true,
				// email: true,
				twoFactAuth: true,
				skinId: true,
			},
		});

		if (user === null) {
			// DBG
			console.log("No such user");
			return e_status.ERR_USER_NOT_FOUND;
		}

		// DBG
		console.log("User found");

		if (dto.name !== undefined) user.name = dto.name;
		// if (dto.email !== undefined) user.email = dto.email;
		if (dto.two_fact_auth !== undefined) user.twoFactAuth = dto.two_fact_auth;
		if (dto.skin_id !== undefined) user.skinId = dto.skin_id;

		try {
			// DBG
			console.log("Updating user...");
			await this._prisma.user.update({
				where: {
					id: id,
				},
				data: user,
			});
			// DBG
			console.log("User updated");
		} catch (error) {
			// DBG
			console.log("Error occured while updating user");
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						return e_status.ERR_USER_FIELD_UNAVAILABLE;
				}
				console.log(error.code);
			}
			return e_status.ERR_UNKNOWN;
		}
		return e_status.SUCCESS;
	}

	/**
	 * @brief	Update a user's avatar in the database.
	 *
	 * @param	id The id of the user to update the avatar from.
	 * @param	file The file containing the new avatar.
	 *
	 * @return	A promise containing the status of the operation.
	 */
	public async update_ones_avatar(id: string, file: Express.Multer.File): Promise<e_status> {
		type t_fields = {
			avatar: string;
		};

		// DBG
		console.log("Searching user...");
		const user: t_fields | null = await this._prisma.user.findUnique({
			where: {
				id: id,
			},
			select: {
				avatar: true,
			},
		});

		if (user === null) {
			// DBG
			console.log("No such user");
			return e_status.ERR_USER_NOT_FOUND;
		}

		// DBG
		console.log("User found");

		// DBG
		console.log("Updating user's avatar...");
		if (user.avatar === "resource/avatar/default.jpg") {
			// DBG
			console.log("User's avatar is default, creating new one");
			user.avatar = `resource/avatar/${id}.jpg`;

			try {
				// DBG
				console.log("Updating user...");
				await this._prisma.user.update({
					where: {
						id: id,
					},
					data: user,
				});
				// DBG
				console.log("User updated");
			} catch (error) {
				// DBG
				console.log("Error occured while updating user");
				if (error instanceof PrismaClientKnownRequestError) {
					console.log(error.code);
				}
				return e_status.ERR_UNKNOWN;
			}
		}
		createWriteStream(join(process.cwd(), user.avatar)).write(file.buffer);

		// DBG
		console.log("User's avatar updated");
		return e_status.SUCCESS;
	}
}
