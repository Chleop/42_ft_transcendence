import {
	Controller,
	Get,
	ForbiddenException,
	InternalServerErrorException,
	UseGuards,
	Req,
	Post,
	Body,
	Res,
	Logger,
	BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Response } from "express";
import { UserService } from "src/user/user.service";
import { AuthService } from "./auth.service";
import { FtOauthGuard, Jwt2FAGuard, JwtPendingStateGuard } from "./guards";
import { ExpiredCode, InvalidCode } from "./error";
import { t_access_token, t_user_auth } from "./alias";
import { CodeDto, EmailDto } from "./dto";

@Controller("auth")
export class AuthController {
	private _authService: AuthService;
	private readonly _user: UserService;
	private readonly _logger: Logger;
	private readonly _config: ConfigService;

	constructor() {
		this._authService = new AuthService();
		this._user = new UserService();
		this._config = new ConfigService();
		this._logger = new Logger(AuthController.name);
	}

	@Get("42/login")
	@UseGuards(FtOauthGuard)
	login() {
		//
	}

	@Get("42/callback")
	@UseGuards(FtOauthGuard)
	async signin(@Req() request: any, @Res() response: Response) {
		try {
			const token: t_access_token = await this._authService.create_access_token(
				request.user.login,
			);
			const user_id: string = await this._user.get_ones_id_by_login(request.user.login);
			const user: t_user_auth = await this._authService.get_user_auth(user_id);
			response.cookie("access_token", token.access_token); // REMIND try with httpOnly
			if (user.twoFactAuth === true) {
				await this._authService.trigger_2FA(user_id);
				response.redirect(<string>this._config.get<string>("SITE_URL") + "/2FA");
			} else response.redirect(<string>this._config.get<string>("SITE_URL"));
		} catch (error) {
			this._logger.error(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException(
						"One of the provided fields is already taken (unique constraint)",
					);
			} else throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@Get("42/2FARedirect")
	async two_factor_authentication_redirect(): Promise<void> {}

	@UseGuards(Jwt2FAGuard)
	@Post("42/2FAActivate")
	async activate_2FA(@Req() req: any, @Body() dto: EmailDto): Promise<void> {
		try {
			await this._authService.activate_2FA(req.user.id, dto.email);
		} catch (error) {
			this._logger.error(error);
			throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@UseGuards(Jwt2FAGuard)
	@Post("42/2FADeactivate")
	async deactivate_2FA(@Req() req: any): Promise<void> {
		try {
			await this._authService.deactivate_2FA(req.user.id);
		} catch (error) {
			this._logger.error(error);
			throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@UseGuards(JwtPendingStateGuard)
	@Post("42/2FAValidate")
	async validate_2FA(@Req() req: any, @Body() dto: CodeDto): Promise<void> {
		try {
			await this._authService.validate_2FA(req.user.id, dto.code);
		} catch (error) {
			this._logger.error(error);
			if (error instanceof InvalidCode || error instanceof ExpiredCode)
				throw new BadRequestException(error.message);
			else throw new InternalServerErrorException("An unknown error occured");
		}
	}
}
