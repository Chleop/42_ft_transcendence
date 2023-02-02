import { t_get_one_fields } from "src/user/alias";
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
	Param,
	Patch,
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

@Controller("user")
@UseGuards(Jwt2FAGuard)
export class UserController {
	private _user_service: UserService;

	constructor() {
		this._user_service = new UserService();
	}

	@Patch(":id/block")
	async block_one(
		@Param("id") id: string,
		@Req()
		request: {
			user: t_get_one_fields;
		},
	): Promise<void> {
		try {
			await this._user_service.block_one(request.user.id, id);
		} catch (error) {
			if (
				error instanceof UserNotFoundError ||
				error instanceof UserSelfBlockError ||
				error instanceof UserAlreadyBlockedError
			) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			console.log(error);
			throw new InternalServerErrorException();
		}
	}

	@Delete("@me")
	async disable_me(
		@Req()
		request: {
			user: t_get_one_fields;
		},
	): Promise<void> {
		try {
			await this._user_service.disable_one(request.user.id);
		} catch (error) {
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get("@me")
	async get_me(
		@Req()
		request: {
			user: t_get_one_fields;
		},
	): Promise<t_get_one_fields> {
		let user: t_get_one_fields;

		try {
			user = await this._user_service.get_one(request.user.id, request.user.id);
		} catch (error) {
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return user;
	}

	@Get(":id")
	async get_one(
		@Req()
		request: {
			user: t_get_one_fields;
		},
		@Param("id") id: string,
	): Promise<t_get_one_fields> {
		let user: t_get_one_fields;

		try {
			user = await this._user_service.get_one(request.user.id, id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
			console.log("Unknown error type, this should not happen" + error);
			throw new InternalServerErrorException();
		}

		return user;
	}

	@Get(":id/avatar")
	async get_ones_avatar(
		@Req()
		request: {
			user: t_get_one_fields;
		},
		@Param("id") id: string,
	): Promise<StreamableFile> {
		let sfile: StreamableFile;

		try {
			sfile = await this._user_service.get_ones_avatar(request.user.id, id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UserNotLinkedError) {
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}

	@Patch(":id/unblock")
	async unblock_one(
		@Req()
		request: {
			user: t_get_one_fields;
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
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch(":id/unfriend")
	async unfriend_one(
		@Req()
		request: {
			user: t_get_one_fields;
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
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Patch("@me")
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
	async update_me(
		@Req()
		request: {
			user: t_get_one_fields;
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
				console.log(error.message);
				throw new ForbiddenException(error.message);
			}
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Put("@me/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async update_ones_avatar(
		@Req()
		request: {
			user: t_get_one_fields;
		},
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		try {
			await this._user_service.update_ones_avatar(request.user.id, file);
		} catch (error) {
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
