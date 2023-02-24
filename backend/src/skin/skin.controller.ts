import { SkinNotFoundError } from "src/skin/error";
import { ISkin } from "src/skin/interface";
import { SkinService } from "src/skin/skin.service";
import {
	BadRequestException,
	Controller,
	Get,
	InternalServerErrorException,
	Logger,
	Param,
	StreamableFile,
} from "@nestjs/common";

@Controller("skin")
export class SkinController {
	private readonly _skin_service: SkinService;
	private readonly _logger: Logger;

	constructor(skin_service: SkinService) {
		this._skin_service = skin_service;
		this._logger = new Logger(SkinController.name);
	}

	@Get("all")
	public async get_all(): Promise<ISkin[]> {
		//#region
		try {
			return await this._skin_service.get_all();
		} catch (error) {
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Get(":id/background")
	async get_background(@Param("id") id: string): Promise<StreamableFile> {
		//#region
		try {
			return await this._skin_service.get_background(id);
		} catch (error) {
			if (error instanceof SkinNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Get(":id/ball")
	async get_ball(@Param("id") id: string): Promise<StreamableFile> {
		//#region
		try {
			return await this._skin_service.get_ball(id);
		} catch (error) {
			if (error instanceof SkinNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Get(":id/paddle")
	async get_paddle(@Param("id") id: string): Promise<StreamableFile> {
		//#region
		try {
			return await this._skin_service.get_paddle(id);
		} catch (error) {
			if (error instanceof SkinNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unexpected error: " + error.message || "non standard error");
			throw new InternalServerErrorException();
		}
	}
	//#endregion
}
