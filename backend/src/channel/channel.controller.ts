import {
	ChannelBanMemberDto,
	ChannelDelegateOwnershipDto,
	ChannelDemoteOperatorDto,
	ChannelKickMemberDto,
	ChannelMessagesGetDto,
	ChannelMuteMemberDto,
	ChannelPromoteMemberDto,
	ChannelUnbanMemberDto,
	ChannelUpdateDto,
} from "src/channel/dto";
import { IChannel } from "src/channel/interface";
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
	Query,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe,
	Logger,
	ConflictException,
} from "@nestjs/common";
import { ChannelMessage } from "@prisma/client";
import {
	ChannelMemberAlreadyDemotedError,
	ChannelMemberAlreadyMutedError,
	ChannelMemberAlreadyPromotedError,
	ChannelMemberNotBannedError,
	ChannelMemberNotFoundError,
	ChannelMemberNotOperatorError,
	ChannelMessageNotFoundError,
	ChannelNameAlreadyTakenError,
	ChannelNotFoundError,
	ChannelNotJoinedError,
	ChannelNotOwnedError,
	ChannelPasswordMissingError,
	ChannelPasswordNotAllowedError,
} from "src/channel/error";
import { Jwt2FAGuard } from "src/auth/guards";
import { t_user_auth } from "src/auth/alias";
import { ChatGateway } from "src/chat/chat.gateway";

@UseGuards(Jwt2FAGuard)
@Controller("channel")
export class ChannelController {
	private readonly _chat_gateway: ChatGateway;
	private readonly _channel_service: ChannelService;
	private readonly _logger: Logger;

	constructor(chat_gateway: ChatGateway, channel_service: ChannelService) {
		//#region
		this._chat_gateway = chat_gateway;
		this._channel_service = channel_service;
		this._logger = new Logger(ChannelController.name);
	}
	//#endregion

	@Patch(":id/ban")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async ban_ones_member(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelBanMemberDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.ban_ones_member(request.user.id, id, dto.user_id);
			this._chat_gateway.forward_to_user_socket("user_banned", dto.user_id, {
				channel_id: id,
			});
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMemberNotOperatorError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id/delegate")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async delegate_ones_ownership(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelDelegateOwnershipDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.delegate_ones_ownership(request.user.id, id, dto.user_id);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelNotOwnedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Delete(":id")
	async delete_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.delete_one(request.user.id, id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelNotOwnedError || error instanceof ChannelNotJoinedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id/demote")
	async demote_ones_operator(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelDemoteOperatorDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.demote_ones_operator(request.user.id, id, dto.user_id);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotFoundError ||
				error instanceof ChannelMemberAlreadyDemotedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMemberNotOperatorError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}

			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Get("all")
	async get_all(
		@Req()
		request: {
			user: t_user_auth;
		},
	): Promise<IChannel[]> {
		//#region
		try {
			return await this._channel_service.get_all(request.user.id);
		} catch (error) {
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
	): Promise<IChannel> {
		//#region
		try {
			return await this._channel_service.get_one(request.user.id, id);
		} catch (error) {
			if (error instanceof ChannelNotFoundError) {
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
	}
	//#endregion

	@Get(":id/messages")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async get_ones_messages(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Query() dto: ChannelMessagesGetDto,
	): Promise<ChannelMessage[]> {
		//#region
		if (dto.after && dto.before) {
			throw new BadRequestException("Unexpected both `before` and `after` received");
		}

		try {
			return await this._channel_service.get_ones_messages(
				request.user.id,
				id,
				dto.limit,
				dto.before,
				dto.after,
			);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMessageNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id/mute")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async mute_ones_member(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelMuteMemberDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.mute_ones_member(
				request.user.id,
				id,
				dto.user_id,
				dto.duration,
			);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotFoundError ||
				error instanceof ChannelMemberAlreadyMutedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMemberNotOperatorError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}

			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id/kick")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async kick_ones_member(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelKickMemberDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.kick_ones_member(request.user.id, id, dto.user_id);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotFoundError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMemberNotOperatorError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}

			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id/promote")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async promote_ones_member(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelPromoteMemberDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.promote_ones_member(request.user.id, id, dto.user_id);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotFoundError ||
				error instanceof ChannelMemberAlreadyPromotedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMemberNotOperatorError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}

			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id/unban")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async unban_ones_member(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelUnbanMemberDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.unban_ones_member(request.user.id, id, dto.user_id);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelMemberNotBannedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelMemberNotOperatorError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}

			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion

	@Patch(":id")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async update_one(
		@Req()
		request: {
			user: t_user_auth;
		},
		@Param("id") id: string,
		@Body() dto: ChannelUpdateDto,
	): Promise<void> {
		//#region
		try {
			await this._channel_service.update_one(
				request.user.id,
				id,
				dto.name,
				dto.type,
				dto.password,
			);
			this._chat_gateway.broadcast_to_online_channel_members(id);
		} catch (error) {
			if (
				error instanceof ChannelNotFoundError ||
				error instanceof ChannelNotJoinedError ||
				error instanceof ChannelPasswordMissingError ||
				error instanceof ChannelPasswordNotAllowedError
			) {
				this._logger.error(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof ChannelNotOwnedError) {
				this._logger.error(error.message);
				throw new ForbiddenException(error.message);
			}
			if (error instanceof ChannelNameAlreadyTakenError) {
				this._logger.error(error.message);
				throw new ConflictException(error.message);
			}
			this._logger.error("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
	//#endregion
}
