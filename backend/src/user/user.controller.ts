import { t_relations } from "./alias";
import { UserCreateDto, UserUpdateDto } from "./dto";
import { e_status } from "./enum";
import { UserService } from "./user.service";
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
	StreamableFile,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { User } from "@prisma/client";
import { AuthGuard } from "@nestjs/passport";

@Controller("user")
export class UserController {
	private _user_service: UserService;

	constructor(user_service: UserService) {
		this._user_service = user_service;
	}

	@Post()
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async create_one(@Body() dto: UserCreateDto): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._user_service.create_one(dto);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_USER_FIELD_UNAVAILABLE:
				throw new ForbiddenException("One of the provided fields is already taken");
			case e_status.ERR_USER_RELATION_NOT_FOUND:
				throw new ForbiddenException("One of the provided relations does not exist");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Delete(":id")
	async delete_one(@Param("id") id: string): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._user_service.delete_one(id);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_USER_NOT_FOUND:
				throw new BadRequestException("No such user");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@UseGuards(AuthGuard('jwt'))
	@Get(":id")
	async get_one(@Param("id") id: string): Promise<(User & t_relations) | null> {
		type t_ret = {
			user: (User & t_relations) | null;
			status: e_status;
		};

		const ret: t_ret = await this._user_service.get_one(id);

		switch (ret.status) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_USER_NOT_FOUND:
				throw new BadRequestException("No such user");
		}
		return ret.user;
	}

	@Get(":id/avatar")
	async get_ones_avatar(@Param("id") id: string): Promise<StreamableFile | null> {
		type t_ret = {
			sfile: StreamableFile | null;
			status: e_status;
		};

		const ret: t_ret = await this._user_service.get_ones_avatar(id);

		switch (ret.status) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_USER_NOT_FOUND:
				throw new BadRequestException("No such user");
		}
		return ret.sfile;
	}

	@Patch(":id")
	@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
	async update_one(@Param("id") id: string, @Body() dto: UserUpdateDto): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._user_service.update_one(id, dto);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_USER_NOT_FOUND:
				throw new BadRequestException("No such user");
			case e_status.ERR_USER_FIELD_UNAVAILABLE:
				throw new ForbiddenException("One of the provided fields is already taken");
			case e_status.ERR_UNKNOWN:
				throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Put(":id/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async update_ones_avatar(
		@Param("id") id: string,
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		type t_ret = e_status;

		const ret: t_ret = await this._user_service.update_ones_avatar(id, file);

		switch (ret) {
			case e_status.SUCCESS:
				break;
			case e_status.ERR_USER_NOT_FOUND:
				throw new BadRequestException("No such user");
		}
	}
}
