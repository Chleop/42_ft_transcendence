// import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";
import * as nodemailer from "nodemailer";

type t_access_token = { access_token: string | undefined };
type t_payload = { sub: string | undefined };
("use strict");

@Injectable()
export class AuthService {
	private readonly _user: UserService;
	private readonly _config: ConfigService;
	private _jwt: JwtService;
	private readonly _transporter: any;
	private readonly _sender: string | undefined;
	private _confirmation_code: number;

	constructor() {
		this._user = new UserService();
		this._jwt = new JwtService();
		this._config = new ConfigService();
		const host: string | undefined = this._config.get<string>("NO_REPLY_EMAIL_HOST");
		if (host === undefined) throw new Error("NO_REPLY_EMAIL_HOST is undefined");
		const pass: string | undefined = this._config.get<string>("NO_REPLY_EMAIL_PASS");
		if (pass === undefined) throw new Error("NO_REPLY_EMAIL_PASS is undefined");

		this._sender = this._config.get<string>("NO_REPLY_EMAIL");
		if (this._sender === undefined) throw new Error("NO_REPLY_EMAIL is undefined");
		// create reusable transporter object using the default SMTP transport
		this._transporter = nodemailer.createTransport({
			host: host,
			port: 587,
			secure: false,
			auth: {
				user: this._sender,
				pass: pass,
			},
		});
	}

	public async create_access_token(login: string): Promise<t_access_token> {
		// get the user id (creates user if not already existing)
		let user_id: string | undefined;
		try {
			user_id = await this._user.get_ones_id_by_login(login);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				console.log(error.message);
				user_id = await this._user.create_one(login);
			} else throw error;
		}

		// create access_token object
		const payload: t_payload = { sub: user_id };
		const token_obj: t_access_token = await this.sign_token(payload);

		return token_obj;
	}

	public async sign_token(payload: t_payload): Promise<t_access_token> {
		// get the secret from the .env file
		const our_secret: string | undefined = this._config.get<string>("JWT_SECRET");
		if (our_secret === undefined) throw new Error("JWT_SECRET is undefined");

		// create the access_token based on user id and jwt secret
		const token: string | undefined = await this._jwt.signAsync(
			{ sub: payload.sub },
			{ secret: our_secret, expiresIn: "1h" },
		);
		if (!token) throw new Error("JWT signAsync function error");

		// include the access_token in an object and return it
		let ret: t_access_token = { access_token: token };
		return ret;
	}

	public async send_confirmation_email(receiver: string) {
		try {
			console.log("Sending email ...");
		// create the confirmation code
			this._confirmation_code = Math.floor(10000 + Math.random() * 90000);
		
		// send the confirmation email
			let info = await this._transporter.sendMail({
				from: "Transcendence team <" + this._sender + ">",
				to: receiver,
				subject: "Confirmation email ✔",
				html: "<b>Please enter the following code to our Transcendence application : " + this._confirmation_code + " </b>",
			});
			console.log("Email sent: %s", info.messageId);
		} catch (error) {
			console.log("envelope" + error.envelope);
			console.log("messageId" + error.messageId);
			throw error;
		}
	}

	public async confirm_email(@Req() req: any, user_id: string, email: string, code: number) {
		if (this._confirmation_code === code) {
			if (req.user.twoFactAuth === false) {
				this.activate_2FA(user_id);
				this.add_email_to_db(user_id, email);
				this.send_thankyou_email(email);
			}
		}
		else {
			throw new Error("Invalid code");
		}
	}

	public async add_email_to_db(user_id: string, email: string) {
			this._user.update_one(user_id, undefined, email);
	}

	public async activate_2FA(user_id: string) {
		this._user.update_one(user_id, undefined, undefined, true);
	}

	public async send_thankyou_email(receiver: string) {
		try {
			console.log("Sending email ...");
			let info = await this._transporter.sendMail({
				from: "Transcendence team <" + this._sender + ">",
				to: receiver,
				subject: "💝 Thank you 💝",
				html: "<b>Your authentication has been confirmed !</b>",
			});
			console.log("Email sent: %s", info.messageId);
		} catch (error) {
			console.log("envelope" + error.envelope);
			console.log("messageId" + error.messageId);
			throw error;
		}
	}
}
