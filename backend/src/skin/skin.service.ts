import { SkinNotFoundError } from "src/skin/error";
import { ISkin } from "src/skin/interface";
import { PrismaService } from "src/prisma/prisma.service";
import { Injectable, StreamableFile } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";

@Injectable()
export class SkinService {
	private readonly _prisma_service: PrismaService;

	constructor(prisma_service: PrismaService) {
		//#region
		this._prisma_service = prisma_service;
	}
	//#endregion

	/**
	 * @brief	Get the list of available skins.
	 *
	 * @return	A promise containing the list of the available skins.
	 */
	public async get_all(): Promise<ISkin[]> {
		//#region
		return await this._prisma_service.skin.findMany({
			//#region
			select: {
				id: true,
				name: true,
			},
		});
		//#endregion
	}
	//#endregion

	/**
	 * @brief	Get a background skin from the database.
	 *
	 * @param	skin_id The id of the skin to get the background image from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- SkinNotFoundError
	 *
	 * @return	A promise containing the wanted background skin.
	 */
	public async get_background(skin_id: string): Promise<StreamableFile> {
		//#region
		type t_fields = {
			//#region
			background: string;
		};
		//#endregion

		const skin: t_fields | null = await this._prisma_service.skin.findUnique({
			//#region
			select: {
				background: true,
			},
			where: {
				id: skin_id,
			},
		});
		//#endregion

		if (!skin) {
			throw new SkinNotFoundError(skin_id);
		}

		return new StreamableFile(createReadStream(join(process.cwd(), skin.background)));
	}
	//#endregion

	/**
	 * @brief	Get a ball skin from the database.
	 *
	 * @param	skin_id The id of the skin to get the ball image from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- SkinNotFoundError
	 *
	 * @return	A promise containing the wanted ball skin.
	 */
	public async get_ball(skin_id: string): Promise<StreamableFile> {
		//#region
		type t_fields = {
			//#region
			ball: string;
		};
		//#endregion

		const skin: t_fields | null = await this._prisma_service.skin.findUnique({
			//#region
			select: {
				ball: true,
			},
			where: {
				id: skin_id,
			},
		});
		//#endregion

		if (!skin) {
			throw new SkinNotFoundError(skin_id);
		}

		return new StreamableFile(createReadStream(join(process.cwd(), skin.ball)));
	}
	//#endregion

	/**
	 * @brief	Get a paddle skin from the database.
	 *
	 * @param	skin_id The id of the skin to get the paddle image from.
	 *
	 * @error	The following errors may be thrown :
	 * 			- SkinNotFoundError
	 *
	 * @return	A promise containing the wanted paddle skin.
	 */
	public async get_paddle(skin_id: string): Promise<StreamableFile> {
		//#region
		type t_fields = {
			//#region
			paddle: string;
		};
		//#endregion

		const skin: t_fields | null = await this._prisma_service.skin.findUnique({
			//#region
			select: {
				paddle: true,
			},
			where: {
				id: skin_id,
			},
		});
		//#endregion

		if (!skin) {
			throw new SkinNotFoundError(skin_id);
		}

		return new StreamableFile(createReadStream(join(process.cwd(), skin.paddle)));
	}
	//#endregion
}
