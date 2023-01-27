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
} from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Response } from "express";
import { t_get_one_fields } from "src/user/alias";
import { UserService } from "src/user/user.service";
import { AuthService } from "./auth.service";
import { FtOauthGuard, JwtGuard } from "./guards";

type t_access_token = { access_token: string | undefined };

@Controller("auth")
export class AuthController {
	private _authService: AuthService;
	private readonly _user: UserService;

	constructor() {
		this._authService = new AuthService();
		this._user = new UserService();
	}

	@Get("42/login")
	@UseGuards(FtOauthGuard)
	login() {
		//
	}

	@Get("42/callback")
	@UseGuards(FtOauthGuard)
	async signin(@Req() request: any, @Res() response: Response) {
		let token: t_access_token;
		const user: t_get_one_fields = await this._user.get_one(request.user.id, request.user.id);
		try {
			if (user.twoFactAuth === true) {
				if (user.email !== null)
					this._authService.send_confirmation_email(user.id, user.email);
			} else {
				token = await this._authService.create_access_token(user.login);
				response.cookie("access_token", token.access_token); // REMIND try with httpOnly
				response.redirect("http://localhost:3000/");
			}
		} catch (error) {
			console.info(error);
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code == "P2002")
					throw new ForbiddenException("One of the provided fields is already taken");
			} else throw new InternalServerErrorException("An unknown error occured");
		}
	}

	@UseGuards(JwtGuard)
	@Get("42/2FAActivate")
	async activateTwoFactAuth(@Req() req: any, @Body("email") email: string): Promise<void> {
		try {
			await this._authService.add_email_to_db(req.user.id, email);
			await this._authService.create_and_add_secret_to_db(req.user.id);
			await this._authService.send_confirmation_email(req.user.id, email);
		} catch (error) {
			// TODO: Ameliorer la gestion d'erreurs
			console.log(error);
			throw error;
		}
	}

	@UseGuards(JwtGuard)
	@Post("42/2FAValidate")
	async validateTwoFactAuth(
		@Req() req: any,
		@Res() res: Response,
		@Body("code") code: string,
	): Promise<void> {
		try {
			const user: t_get_one_fields = await this._user.get_one(req.user.id, req.user.id);
			await this._authService.confirm_email(user, res, Number(code));
		} catch (error) {
			throw new ForbiddenException(error);
		}
	}
}
