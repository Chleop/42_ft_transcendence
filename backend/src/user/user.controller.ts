import { t_get_me_fields, t_get_one_fields, t_receiving_user_fields } from "src/user/alias";
import { UserUpdateDto } from "src/user/dto";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserBlockedError,
	UserFieldUnaivalableError,
	UserMessageNotFoundError,
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
	Query,
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
import { DirectMessage } from "@prisma/client";
import { ChatGateway } from "src/chat/chat.gateway";

@Controller("user")
@UseGuards(Jwt2FAGuard)
export class UserController {
	// REMIND: Check if passing `_user_service` in readonly keep it working well
	private _user_service: UserService;
	private readonly _logger: Logger;
	private readonly chat_gateway: ChatGateway;

	constructor(user_service: UserService, chat_gateway: ChatGateway) {
		//#region
		this._user_service = user_service;
		this.chat_gateway = chat_gateway;
		this._logger = new Logger(UserController.name);
	}
	//#endregion

	@Patch(":id/block")
	async block_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		//#region
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
	//#endregion

	@Delete("@me")
	async disable_me(
		@Req()
		request: {
			user: t_user_auth;
		},
	): Promise<void> {
		//#region
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
	//#endregion

	@Get("@me")
	async get_me(
		@Req()
		request: {
			user: t_user_auth;
		},
	): Promise<t_get_me_fields> {
		//#region
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
	//#endregion

	@Get(":id")
	async get_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<t_get_one_fields> {
		//#region
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
	//#endregion

	@Get(":id/avatar")
	async get_ones_avatar(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<StreamableFile> {
		//#region
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
	//#endregion

	@Get(":id/messages")
	async get_ones_messages(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Query() dto: UserMessagesGetDto,
	): Promise<DirectMessage[]> {
		//#region
		if (dto.before && dto.after) {
			throw new BadRequestException("Unexpected both `before` and `after` received");
		}

		try {
			return await this._user_service.get_ones_messages(
				request.user.id,
				id,
				dto.limit,
				dto.before,
				dto.after,
			);
		} catch (error) {
			if (
				error instanceof UserSelfMessageError ||
				error instanceof UserNotFoundError ||
				error instanceof UserMessageNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Post(":id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async send_message_to_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: UserMessageSendDto,
	): Promise<DirectMessage> {
		//#region
		let object: {
			receiver: t_receiving_user_fields;
			message: DirectMessage;
		};

		try {
			object = await this._user_service.send_message_to_one(request.user.id, id, dto.content);

			if (!object.receiver.blocked.some((blocked) => blocked.id === request.user.id)) {
				this.chat_gateway.forward_to_user_socket(object.message);
			}
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof UserSelfMessageError ||
				error instanceof UserBlockedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			this._logger.error(error);
			throw new InternalServerErrorException();
		}

		return object.message;
	}
	//#endregion

	@Patch(":id/unblock")
	async unblock_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		//#region
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
	//#endregion

	@Patch(":id/unfriend")
	async unfriend_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		//#region
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
	//#endregion

	@Patch("@me")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async update_me(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Body() dto: UserUpdateDto,
	): Promise<void> {
		//#region
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
	//#endregion

	@Put("@me/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async update_ones_avatar(
		@Req()
		request: {
			user: t_user_auth;
		},
		@UploadedFile() file?: Express.Multer.File,
	): Promise<void> {
		//#region
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
	//#endregion

	@Get(":id/skin/background")
	async get_background_skin(@Param("id") id: string): Promise<StreamableFile> {
		//#region
		let sfile: StreamableFile;
		try {
			sfile = await this._user_service.get_ones_background(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}
	//#endregion

	@Get(":id/skin/ball")
	async get_ball_skin(@Param("id") id: string): Promise<StreamableFile> {
		//#region
		let sfile: StreamableFile;
		try {
			sfile = await this._user_service.get_ones_ball(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}
	//#endregion

	@Get(":id/skin/paddle")
	async get_paddle_skin(@Param("id") id: string): Promise<StreamableFile> {
		//#region
		let sfile: StreamableFile;
		try {
			sfile = await this._user_service.get_ones_paddle(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknow error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}
	//#endregion
}
