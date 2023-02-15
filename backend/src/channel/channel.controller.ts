import { t_get_all_fields } from "src/channel/alias";
import { ChannelService } from "src/channel/channel.service";
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
	Logger,
} from "@nestjs/common";
import {
	ChannelCreateDto,
	ChannelJoinDto,
	ChannelMessageGetDto,
	ChannelMessageSendDto,
} from "src/channel/dto";
import { Channel, ChannelMessage } from "@prisma/client";
import {
	ChannelAlreadyJoinedError,
	ChannelFieldUnavailableError,
	ChannelInvitationIncorrectError,
	ChannelInvitationUnexpectedError,
	ChannelMessageNotFoundError,
	ChannelMessageTooLongError,
	ChannelNotFoundError,
	ChannelNotJoinedError,
	ChannelNotOwnedError,
	ChannelPasswordIncorrectError,
	ChannelPasswordMissingError,
	ChannelPasswordNotAllowedError,
	ChannelPasswordUnexpectedError,
	ChannelRelationNotFoundError,
	UnknownError,
} from "src/channel/error";
import { Jwt2FAGuard } from "src/auth/guards";
import { t_user_auth } from "src/auth/alias";
import { ChatGateway } from "src/chat/chat.gateway";

@UseGuards(Jwt2FAGuard)
@Controller("channel")
export class ChannelController {
	// REMIND: check if passing `_channel_service` in readonly keep it working well
	private _channel_service: ChannelService;
	private readonly _logger: Logger;
	private readonly gateway: ChatGateway;

	constructor(channel_service: ChannelService, chat_gateway: ChatGateway) {
		this._channel_service = channel_service;
		this.gateway = chat_gateway;
		this._logger = new Logger(ChannelController.name);
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Body() dto: ChannelCreateDto,
	): Promise<Channel> {
		let channel: Channel;

		try {
			channel = await this._channel_service.create_one(
				request.user.id,
				dto.name,
				dto.is_private,
				dto.password,
			);
		} catch (error) {
			if (
				error instanceof ChannelPasswordNotAllowedError ||
				error instanceof ChannelRelationNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelFieldUnavailableError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			if (error instanceof UnknownError) {
				this._logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return channel;
	}

	@Delete(":id")
	async delete_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") channel_id: string,
	): Promise<void> {
		try {
			await this._channel_service.delete_one(request.user.id, channel_id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelNotOwnedError || error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			if (error instanceof UnknownError) {
				this._logger.error(error.message);
				throw new InternalServerErrorException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get("all")
	async get_all(
		@Req()
		request: {
			user: t_user_auth;
		},
	): Promise<t_get_all_fields> {
		let channels: t_get_all_fields;

		try {
			channels = await this._channel_service.get_all(request.user.id);
		} catch (error) {
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return channels;
	}

	@Get(":id/messages")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async get_ones_messages(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Query() dto: ChannelMessageGetDto,
	): Promise<ChannelMessage[]> {
		if (dto.after && dto.before) {
			throw new BadRequestException("Unexpected both `before` and `after` received");
		}

		let messages: ChannelMessage[];

		try {
			messages = await this._channel_service.get_ones_messages(
				request.user.id,
				id,
				dto.limit,
				dto.before,
				dto.after,
			);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelMessageNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return messages;
	}

	@Patch(":id/join")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async join_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelJoinDto,
	): Promise<Channel> {
		let channel: Channel;

		try {
			channel = await this._channel_service.join_one(
				request.user.id,
				id,
				dto.password,
				dto.inviting_user_id,
			);
			this.gateway.make_user_socket_join_room(request.user.id, id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelAlreadyJoinedError ||
				error instanceof ChannelPasswordUnexpectedError ||
				error instanceof ChannelInvitationIncorrectError ||
				error instanceof ChannelInvitationUnexpectedError ||
				error instanceof ChannelPasswordMissingError ||
				error instanceof ChannelPasswordIncorrectError ||
				error instanceof ChannelRelationNotFoundError
			) {
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

		return channel;
	}

	@Patch(":id/leave")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async leave_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		try {
			await this._channel_service.leave_one(request.user.id, id);
			this.gateway.make_user_socket_leave_room(request.user.id, id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
		}
	}

	@Post(":id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async send_message_to_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelMessageSendDto,
	): Promise<ChannelMessage> {
		try {
			const message: ChannelMessage = await this._channel_service.send_message_to_one(
				request.user.id,
				id,
				dto.content,
			);
			this.gateway.broadcast_to_room(message);
			return message;
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMessageTooLongError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
