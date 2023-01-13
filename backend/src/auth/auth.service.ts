import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { UserCreateDto } from "src/user/dto";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";

type t_access_token = { access_token: string | undefined };
type t_payload = { sub: string | undefined };

@Injectable()
export class AuthService {
	private readonly _user: UserService;
	private readonly _config: ConfigService;
	private readonly _mailer: MailerService;
	private _jwt: JwtService;
	private readonly _code: number;

	constructor() {
		this._user = new UserService();
		this._jwt = new JwtService();
		this._config = new ConfigService();
		this._mailer = new MailerService();
		this._code = Math.floor(10000 + Math.random() * 90000);
	}

	public async createAccessToken(login: string): Promise<t_access_token> {
		// get the user id (creates user if not already existing)
		let userId: string | undefined;
		try {
			userId = await this._user.get_user_id_by_login(login);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				const userObj: UserCreateDto = {
					login: login,
				};
				userId = await this._user.create_one(userObj);
			} else throw error;
		}

		// create access_token object
		const payload: t_payload = { sub: userId };
		const tokenObj: t_access_token = await this.signToken(payload);

		return tokenObj;
	}

	public async signToken(payload: t_payload): Promise<t_access_token> {
		// get the secret from the .env file
		const oursecret: string | undefined = this._config.get<string>("JWT_SECRET");
		if (oursecret === undefined) throw new Error("JWT_SECRET is undefined");

		// create the access_token based on user id and jwt secret
		const token: string | undefined = await this._jwt.signAsync(
			{ sub: payload.sub },
			{ secret: oursecret, expiresIn: "1h" },
		);
		if (!token) throw new Error("JWT signAsync function error");

		// include the access_token in an object and return it
		let ret: t_access_token = { access_token: token };
		return ret;
	}

	public async sendConfirmedEmail(user: User) {
		const login: string = user.login;
		let email: string;

		console.log("Sending email");
		if (user.email !== null) {
			email = user.email;
			await this._mailer.sendMail({
				to: email,
				subject: "Welcome to Nice App! Email Confirmed",
				template: "confirmed",
				context: {
					login,
					email,
				},
			});
			console.log("Email sent");
		} else {
			console.log("No email entered for this user");
			throw new Error("No email entered for this user");
		}
	}

	public async sendConfirmationEmail(user: any) {
		const login: string = user.login;
		let email: string;

		console.log("Sending email");
		if (user.email !== null) {
			email = user.email;
			await this._mailer.sendMail({
				to: email,
				subject: "Welcome to Nice App! Please confirm email",
				template: "confirm",
				context: {
					login,
					code: this._code,
				},
			});
			console.log("Email sent");
		} else {
			console.log("No email entered for this user");
			throw new Error("No email entered for this user");
		}
	}
}
