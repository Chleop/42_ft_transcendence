// import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";
import * as nodemailer from "nodemailer";
import { PrismaService } from "src/prisma/prisma.service";
import { t_get_one_fields } from "src/user/alias";

type t_access_token = { access_token: string | undefined };
type t_payload = { sub: string | undefined };
("use strict");

@Injectable()
export class AuthService {
	private readonly _user: UserService;
	private _jwt: JwtService;
	private readonly _config: ConfigService;
	private readonly _prisma: PrismaService;
	private readonly _transporter: any;
	private readonly _sender: string | undefined;

	constructor() {
		this._user = new UserService();
		this._jwt = new JwtService();
		this._config = new ConfigService();
		this._prisma = new PrismaService();
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

	private async sign_token(payload: t_payload): Promise<t_access_token> {
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

	public async create_and_add_secret_to_db(user_id: string): Promise<void> {
		// TODO: encrypt code
		const code: number = Math.floor(10000 + Math.random() * 9000000000);
		const currentTime: Date = new Date();
		try {
			await this._prisma.user.update({
				where: { id: user_id },
				data: { twoFactSecret: code, tFSecretCreationDate: currentTime },
			});
		} catch (error) {
			console.log("ERROR in create_secret: " + error);
		}
	}

	public async delete_secret(user_id: string): Promise<void> {
		try {
			console.log("I AM IN DELETE SECRET");
			await this._prisma.user.update({
				where: { id: user_id },
				data: { twoFactSecret: null, tFSecretCreationDate: null },
			});
			console.log("I FINISHED DELETING SECRET");
		} catch (error) {
			console.log("ERROR in create_secret: " + error);
		}
	}

	public async send_confirmation_email(user_id: string, receiver_email: string): Promise<void> {
		try {
			const secret: { twoFactSecret: number | null } | null =
				await this._prisma.user.findUnique({
					where: { id: user_id },
					select: { twoFactSecret: true },
				});
			// send confirmation email
			if (secret !== null && secret.twoFactSecret !== null) {
				console.log("Sending email ...");
				let info = await this._transporter.sendMail({
					from: "Transcendence team <" + this._sender + ">",
					to: receiver_email,
					subject: "Confirmation email ✔",
					html:
						"<b>Please enter the following code to our Transcendence application : " +
						secret.twoFactSecret +
						" </b>",
				});
				console.log("Email sent: %s", info.messageId);
			}
		} catch (error) {
			console.log("envelope" + error.envelope);
			console.log("messageId" + error.messageId);
			throw error;
		}
	}

	public async confirm_email(
		user: t_get_one_fields,
		@Res() res: any,
		code: number,
	): Promise<void> {
		let token: t_access_token;
		if ((await this.isValid(user, code)) === true) {
			if (user.twoFactAuth === false) {
				console.log("user.twoFactAuth === false");
				await this.activate_2FA(user.id);
				if (user.email !== null) await this.send_thankyou_email(user.email);
			} else {
				console.log("user.twoFactAuth === true");
				token = await this.create_access_token(user.login);
				await res.cookie("access_token", token.access_token); // REMIND try with httpOnly
				await res.redirect("http://localhost:3000/");
			}
			await this.delete_secret(user.id);
		} else {
			throw new Error("Invalid code");
		}
	}

	private async isValid(user: t_get_one_fields, code: number): Promise<boolean> {
		console.log("In isvalide, code = " + code);
		const secret: { twoFactSecret: number | null; tFSecretCreationDate: Date | null } | null =
			await this._prisma.user.findUnique({
				where: { id: user.id },
				select: { twoFactSecret: true, tFSecretCreationDate: true },
			});
		if (
			secret !== null &&
			secret.tFSecretCreationDate !== null &&
			secret.twoFactSecret !== null &&
			secret.twoFactSecret === code &&
			this.isExpired(code, secret.twoFactSecret, secret.tFSecretCreationDate) === false
		)
			return true;
		await this.delete_secret(user.id);
		// TODO: delete
		console.log("is valid = false");
		return false;
	}

	private isExpired(received_code: number, secret: number, creation_time: Date): boolean {
		const current_time: Date = new Date();
		const secret_lifetime: number = current_time.getMinutes() - creation_time.getMinutes();
		console.log("secret.twoFactSecret = " + secret);
		console.log("received_code = " + received_code);
		console.log("secret_lifetime = " + secret_lifetime);
		if (secret_lifetime <= 5) {
			// TODO: delete
			console.log("is valid = true");
			return false;
		} else return true;
	}

	private async activate_2FA(user_id: string): Promise<void> {
		await this._user.update_one(user_id, undefined, undefined, true);
	}

	public async add_email_to_db(user_id: string, email: string): Promise<void> {
		await this._user.update_one(user_id, undefined, email);
	}

	private async send_thankyou_email(receiver: string): Promise<void> {
		try {
			console.log("Sending email ...");
			let info = await this._transporter.sendMail({
				from: "Transcendence team <" + this._sender + ">",
				to: receiver,
				subject: "🐹  💝  🐹  Thank you  🐹  💝  🐹",
				html:
					"<p>Your authentication has been confirmed !</p>" +
					"<p> 🐹  We love you so much  🐹 </p>",
			});
			console.log("Email sent: %s", info.messageId);
		} catch (error) {
			console.log("envelope" + error.envelope);
			console.log("messageId" + error.messageId);
			throw error;
		}
	}
}
