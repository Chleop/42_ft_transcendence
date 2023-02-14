import { t_get_me_fields, t_get_one_fields } from "src/user/alias";
import { UserUpdateDto } from "src/user/dto";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserFieldUnaivalableError,
	UserNotBlockedError,
	UserNotFoundError,
	UserNotFriendError,
	UserNotLinkedError,
	UserSelfBlockError,
	UserSelfMessageError,
	UserSelfUnblockError,
	UserSelfUnfriendError,
} from "src/user/error";
import { Jwt2FAGuard } from "src/auth/guards";
import { UserService } from "src/user/user.service";
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	Logger,
	Param,
	Patch,
	Post,
	Put,
	Req,
	StreamableFile,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserMessageSendDto } from "./dto/UserMessageSend.dto";
import { t_user_auth } from "src/auth/alias";

@Controller("user")
@UseGuards(Jwt2FAGuard)
export class UserController {
	// REMIND: Check if passing `_user_service` in readonly keep it working well
	private _user_service: UserService;
	private readonly _logger: Logger;

	constructor(user_service: UserService) {
		this._user_service = user_service;
		this._logger = new Logger(UserController.name);
	}

	@Patch(":id/block")
	async block_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		try {
			await this._user_service.block_one(request.user.id, id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof UserSelfBlockError ||
				error instanceof UserAlreadyBlockedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Delete("@me")
	async disable_me(
		@Req()
		request: {
			user: t_user_auth;
		},
	): Promise<void> {
		try {
			await this._user_service.disable_one(request.user.id);
		} catch (error) {
			if (error instanceof UnknownError) {
				this._logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get("@me")
	async get_me(
		@Req()
		request: {
			user: t_user_auth;
		},
	): Promise<t_get_me_fields> {
		try {
			return await this._user_service.get_me(request.user.id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get(":id")
	async get_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<t_get_one_fields> {
		try {
			return await this._user_service.get_one(request.user.id, id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get(":id/avatar")
	async get_ones_avatar(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<StreamableFile> {
		let sfile: StreamableFile;

		try {
			sfile = await this._user_service.get_ones_avatar(request.user.id, id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}

	@Post(":id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async send_message_to_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: UserMessageSendDto,
	): Promise<void> {
		try {
			await this._user_service.send_message_to_one(request.user.id, id, dto.content);
		} catch (error) {
			if (error instanceof UserNotFoundError || error instanceof UserSelfMessageError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch(":id/unblock")
	async unblock_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		try {
			await this._user_service.unblock_one(request.user.id, id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof UserSelfUnblockError ||
				error instanceof UserNotBlockedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch(":id/unfriend")
	async unfriend_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		try {
			await this._user_service.unfriend_two(request.user.id, id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof UserSelfUnfriendError ||
				error instanceof UserNotFriendError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch("@me")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async update_me(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Body() dto: UserUpdateDto,
	): Promise<void> {
		try {
			await this._user_service.update_one(
				request.user.id,
				dto.name,
				dto.email,
				dto.two_fact_auth,
				dto.skin_id,
			);
		} catch (error) {
			if (error instanceof UserFieldUnaivalableError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			if (error instanceof UnknownError) {
				this._logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Put("@me/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async update_ones_avatar(
		@Req()
		request: {
			user: t_user_auth;
		},
		@UploadedFile() file?: Express.Multer.File,
	): Promise<void> {
		if (!file) {
			this._logger.error("No file provided while updating avatar");
			throw new BadRequestException("No file provided");
		}
		try {
			await this._user_service.update_ones_avatar(request.user.id, file);
		} catch (error) {
			if (error instanceof UnknownError) {
				this._logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get(":id/skin/background")
	async get_background_skin(@Param("id") id: string): Promise<StreamableFile> {
		let sfile: StreamableFile;
		try {
			sfile = await this._user_service.get_ones_background(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			this._logger.error(error.message);
			throw new InternalServerErrorException();
		}

		return sfile;
	}

	@Get(":id/skin/ball")
	async get_ball_skin(@Param("id") id: string): Promise<StreamableFile> {
		let sfile: StreamableFile;
		try {
			sfile = await this._user_service.get_ones_ball(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			this._logger.error(error.message);
			throw new InternalServerErrorException();
		}

		return sfile;
	}

	@Get(":id/skin/paddle")
	async get_paddle_skin(@Param("id") id: string): Promise<StreamableFile> {
		let sfile: StreamableFile;
		try {
			sfile = await this._user_service.get_ones_paddle(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			this._logger.error(error.message);
			throw new InternalServerErrorException();
		}

		return sfile;
	}
}
