import { t_user_auth } from "src/auth/alias";
import { t_user_status } from "src/chat/alias";
import { UserMessagesGetDto, UserUpdateDto } from "src/user/dto";
import { e_user_status } from "src/user/enum";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserAvatarFileFormatError,
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
import { IUserPrivate, IUserPublic } from "src/user/interface";
import { ChatGateway } from "src/chat/chat.gateway";
import { ChatService } from "src/chat/chat.service";
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
import { DirectMessage } from "@prisma/client";

@Controller("user")
@UseGuards(Jwt2FAGuard)
export class UserController {
	private readonly _user_service: UserService;
	private readonly _chat_service: ChatService;
	private readonly _chat_gateway: ChatGateway;
	private readonly _logger: Logger;

	constructor(user_service: UserService, chat_gateway: ChatGateway, chat_service: ChatService) {
		//#region
		this._user_service = user_service;
		this._chat_gateway = chat_gateway;
		this._chat_service = chat_service;
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
	): Promise<{ spectating?: string } & IUserPrivate> {
		//#region
		try {
			const user: IUserPrivate = await this._user_service.get_me(request.user.id);

			const tmp_user: t_user_status | undefined = this._chat_service.get_user(
				request.user.id,
			);
			let status: e_user_status | undefined = tmp_user?.status;
			if (status === undefined) {
				status = e_user_status.OFFLINE;
			}

			return {
				spectating: tmp_user?.spectated_user,
				...user,
			};
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
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
	): Promise<{ spectating?: string } & IUserPublic> {
		//#region
		try {
			const user: IUserPublic = await this._user_service.get_one(request.user.id, id);

			const tmp_user: t_user_status | undefined = this._chat_service.get_user(id);
			let status: e_user_status | undefined = tmp_user?.status;
			if (status === undefined) {
				status = e_user_status.OFFLINE;
			}

			return {
				spectating: tmp_user?.spectated_user,
				...user,
			};
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
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

			this._chat_gateway.forward_to_user_socket(
				"user_updated",
				request.user.id,
				await this._user_service.get_me(request.user.id),
			);

			this._chat_gateway.forward_to_user_socket(
				"user_updated",
				id,
				await this._user_service.get_me(id),
			);
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
			await this._chat_gateway.broadcast_to_online_related_users({
				id: request.user.id,
			});
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
			await this._chat_gateway.broadcast_to_online_related_users({
				id: request.user.id,
			});
		} catch (error) {
			if (error instanceof UserAvatarFileFormatError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UnknownError) {
				this._logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion
}
