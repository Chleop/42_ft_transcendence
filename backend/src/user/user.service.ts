import {
	t_relations,
	t_return_create_one,
	t_return_get_one,
	t_return_get_ones_avatar,
} from "src/user/alias";
import { UserCreateDto, UserUpdateDto } from "src/user/dto";
import { e_status } from "src/user/enum";
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
	 * @return	A promise containing the status of the operation.
	 */
	public async create_one(dto: UserCreateDto): Promise<t_return_create_one> {
		type t_fields = {
			id: string;
		};

		console.log("Getting default skin..."); /* DBG */
		const skin: t_fields | null = await this._prisma.skin.findUnique({
			where: {
				name: "Default",
			},
			select: {
				id: true,
			},
		});

		if (!skin) {
			console.log("No such skin"); /* DBG */
			return {
				id: null,
				status: e_status.ERR_USER_RELATION_NOT_FOUND,
			};
		}

		let id: string;

		try {
			console.log("Creating user..."); /* DBG */
			id = (
				await this._prisma.user.create({
					data: {
						name: dto.name,
						skinId: skin.id,
					},
				})
			).id;
			console.log("User created"); /* DBG */
		} catch (error) {
			console.log("Error occured while creating user"); /* DBG */
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						console.log("Field already taken"); /* DBG */
						return {
							id: null,
							status: e_status.ERR_USER_FIELD_UNAVAILABLE,
						};
				}
				console.log(error.code); /* DBG */
			}
			console.log("Unknown error"); /* DBG */
			return {
				id: null,
				status: e_status.ERR_UNKNOWN,
			};
		}

		return {
			id,
			status: e_status.SUCCESS,
		};
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
			console.log("Deleting user..."); /* DBG */
			await this._prisma.user.delete({
				where: {
					id: id,
				},
			});
			console.log("User deleted"); /* DBG */
		} catch (error) {
			console.log("Error occured while deleting user"); /* DBG */
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2025":
						console.log("No such user"); /* DBG */
						return e_status.ERR_USER_NOT_FOUND;
				}
				console.log(error.code); /* DBG */
			}
			console.log("Unknown error"); /* DBG */
			return e_status.ERR_UNKNOWN;
		}

		return e_status.SUCCESS;
	}

	/**
	 * @brief	Get a user from the database.
	 *
	 * @param	id The id of the user to get.
	 *
	 * @return	A promise containing the user and the status of the operation.
	 */
	public async get_one(id: string): Promise<t_return_get_one> {
		console.log("Searching user..."); /* DBG */
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
			console.log("No such user"); /* DBG */
			return {
				user: null,
				status: e_status.ERR_USER_NOT_FOUND,
			};
		}

		console.log("User found"); /* DBG */
		return {
			user,
			status: e_status.SUCCESS,
		};
	}

	/**
	 * @brief	Get a user's avatar from the database.
	 *
	 * @param	id The id of the user to get the avatar from.
	 *
	 * @return	A promise containing the avatar and the status of the operation.
	 */
	public async get_ones_avatar(id: string): Promise<t_return_get_ones_avatar> {
		type t_fields = {
			avatar: string;
		};

		console.log("Searching user..."); /* DBG */
		const user: t_fields | null = await this._prisma.user.findUnique({
			select: {
				avatar: true,
			},
			where: {
				id: id,
			},
		});

		if (!user) {
			console.log("No such user"); /* DBG */
			return {
				sfile: null,
				status: e_status.ERR_USER_NOT_FOUND,
			};
		}

		console.log("User found"); /* DBG */
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
			email: string | null;
			twoFactAuth: boolean;
			skinId: string;
		};

		console.log("Searching user..."); /* DBG */
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
			console.log("No such user"); /* DBG */
			return e_status.ERR_USER_NOT_FOUND;
		}

		console.log("User found"); /* DBG */

		if (dto.name !== undefined) user.name = dto.name;
		if (dto.email !== undefined) user.email = dto.email;
		if (dto.two_fact_auth !== undefined) user.twoFactAuth = dto.two_fact_auth;
		if (dto.skin_id !== undefined) user.skinId = dto.skin_id;

		try {
			console.log("Updating user..."); /* DBG */
			await this._prisma.user.update({
				where: {
					id: id,
				},
				data: user,
			});
			console.log("User updated"); /* DBG */
		} catch (error) {
			console.log("Error occured while updating user"); /* DBG */
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

		console.log("Searching user..."); /* DBG */
		const user: t_fields | null = await this._prisma.user.findUnique({
			where: {
				id: id,
			},
			select: {
				avatar: true,
			},
		});

		if (!user) {
			console.log("No such user"); /* DBG */
			return e_status.ERR_USER_NOT_FOUND;
		}

		console.log("User found"); /* DBG */

		console.log("Updating user's avatar..."); /* DBG */
		if (user.avatar === "resource/avatar/default.jpg") {
			console.log("User's avatar is default, creating new one"); /* DBG */
			user.avatar = `resource/avatar/${id}.jpg`;

			try {
				console.log("Updating user..."); /* DBG */
				await this._prisma.user.update({
					where: {
						id: id,
					},
					data: user,
				});
				console.log("User updated"); /* DBG */
			} catch (error) {
				console.log("Error occured while updating user"); /* DBG */
				if (error instanceof PrismaClientKnownRequestError) {
					console.log(error.code);
				}
				return e_status.ERR_UNKNOWN;
			}
		}
		createWriteStream(join(process.cwd(), user.avatar)).write(file.buffer);

		console.log("User's avatar updated"); /* DBG */
		return e_status.SUCCESS;
	}
}
