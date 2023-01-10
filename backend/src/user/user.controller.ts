import { t_relations } from "src/user/alias";
import { UserCreateDto, UserUpdateDto } from "src/user/dto";
import {
	UnknownError,
	UserAlreadyBlockedError,
	UserFieldUnaivalableError,
	UserNotBlockedError,
	UserNotFoundError,
	UserRelationNotFoundError,
	UserSelfBlockError,
	UserSelfUnblockError,
} from "src/user/error";
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
	Post,
	Put,
	Query,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { User } from "@prisma/client";

@Controller("user")
export class UserController {
	private _user_service: UserService;

	constructor() {
		this._user_service = new UserService();
	}

	@Patch(":blocked_user_id/block")
	// TODO: Remove the `blocking_user_id` query when the authentification is implemented
	async block_one(
		@Param("blocked_user_id") blocked_user_id: string,
		@Query("blocking_user_id") blocking_user_id: string,
	): Promise<void> {
		try {
			await this._user_service.block_one(blocked_user_id, blocking_user_id);
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
			throw new InternalServerErrorException();
		}
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(@Body() dto: UserCreateDto): Promise<void> {
		try {
			await this._user_service.create_one(dto);
		} catch (error) {
			if (
				error instanceof UserRelationNotFoundError ||
				error instanceof UserFieldUnaivalableError
			) {
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

	@Delete(":id")
	async delete_one(@Param("id") id: string): Promise<void> {
		try {
			await this._user_service.delete_one(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}

	@Get(":id")
	async get_one(@Param("id") id: string): Promise<User & t_relations> {
		let user: User & t_relations;

		try {
			user = await this._user_service.get_one(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return user;
	}

	@Get(":id/avatar")
	async get_ones_avatar(@Param("id") id: string): Promise<StreamableFile> {
		let sfile: StreamableFile;

		try {
			sfile = await this._user_service.get_ones_avatar(id);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}

		return sfile;
	}

	@Patch(":unblocked_user_id/unblock")
	// TODO: Remove the `unblocking_user_id` query when the authentification is implemented
	async unblock_one(
		@Param("unblocked_user_id") unblocked_user_id: string,
		@Query("unblocking_user_id") unblocking_user_id: string,
	): Promise<void> {
		try {
			await this._user_service.unblock_one(unblocked_user_id, unblocking_user_id);
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

	@Patch(":id")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async update_one(@Param("id") id: string, @Body() dto: UserUpdateDto): Promise<void> {
		try {
			await this._user_service.update_one(id, dto);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
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

	@Put(":id/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async update_ones_avatar(
		@Param("id") id: string,
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		try {
			await this._user_service.update_ones_avatar(id, file);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				throw new BadRequestException(error.message);
			}
			if (error instanceof UnknownError) {
				console.log(error.message);
				throw new InternalServerErrorException(error.message);
			}
			console.log("Unknown error type, this should not happen");
			throw new InternalServerErrorException();
		}
	}
}
