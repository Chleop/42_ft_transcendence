import { t_user_auth } from "src/auth/alias";
import { t_receiving_user_fields } from "src/user/alias";
import { UserMessageSendDto } from "src/user/dto";
import {
	UserBlockedError,
	UserNotFoundError,
	UserNotLinkedError,
	UserSelfMessageError,
} from "src/user/error";
import { Jwt2FAGuard } from "src/auth/guards";
import { ChatGateway } from "src/chat/chat.gateway";
import { UserService } from "src/user/user.service";
import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	InternalServerErrorException,
	Logger,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { ChannelMessage, DirectMessage } from "@prisma/client";
import { ChannelJoinDto, ChannelMessageSendDto } from "src/channel/dto";
import { IChannel } from "src/channel/interface";
import {
	ChannelAlreadyJoinedError,
	ChannelForbiddenToJoinError,
	ChannelMemberMutedError,
	ChannelMessageTooLongError,
	ChannelNotFoundError,
	ChannelNotJoinedError,
	ChannelPasswordIncorrectError,
	ChannelPasswordMissingError,
	ChannelPasswordUnexpectedError,
} from "src/channel/error";
import { ChannelService } from "src/channel/channel.service";

@Controller("chat")
@UseGuards(Jwt2FAGuard)
export class ChatController {
	// REMIND: Check if passing `_user_service` in readonly keep it working well
	private readonly _channel_service: ChannelService;
	private readonly _user_service: UserService;
	private readonly _chat_gateway: ChatGateway;
	private readonly _logger: Logger;

	constructor(
		channel_service: ChannelService,
		user_service: UserService,
		chat_gateway: ChatGateway,
	) {
		this._channel_service = channel_service;
		this._user_service = user_service;
		this._chat_gateway = chat_gateway;
		this._logger = new Logger(ChatController.name);
	}

	@Patch("channel/:id/join")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async join_channel(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelJoinDto,
	): Promise<IChannel> {
		//#region
		let response: IChannel;

		try {
			response = await this._channel_service.join_one(request.user.id, id, dto.password);
			this._chat_gateway.make_user_socket_join_room(request.user.id, id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelAlreadyJoinedError ||
				error instanceof ChannelPasswordUnexpectedError ||
				error instanceof ChannelPasswordMissingError ||
				error instanceof ChannelPasswordIncorrectError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelForbiddenToJoinError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return response;
	}
	//#endregion

	@Patch("channel/:id/leave")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async leave_channel(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.leave_one(request.user.id, id);
			this._chat_gateway.make_user_socket_leave_room(request.user.id, id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
		}
	}
	//#endregion

	@Post("channel/:id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async send_channel_message(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelMessageSendDto,
	): Promise<ChannelMessage> {
		//#region
		try {
			const message: ChannelMessage = await this._channel_service.send_message_to_one(
				request.user.id,
				id,
				dto.content,
			);
			this._chat_gateway.broadcast_to_room(message);
			return message;
		} catch (error) {
			if (error instanceof ChannelNotFoundError || error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (
				error instanceof ChannelMemberMutedError ||
				error instanceof ChannelMessageTooLongError
			) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Post("user/:id/message")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async send_direct_message(
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
				this._chat_gateway.forward_to_user_socket(object.message);
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
}
