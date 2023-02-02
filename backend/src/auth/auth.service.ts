import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";
import * as nodemailer from "nodemailer";
import { PrismaService } from "src/prisma/prisma.service";
import { StateType } from "@prisma/client";
import { t_access_token, t_email, t_payload, t_secret, t_user_auth } from "src/auth/alias";
import { AuthController } from "./auth.controller";
import * as argon2 from "argon2";
import { ExpiredCode, InvalidCode } from "./error";

("use strict");

@Injectable()
export class AuthService {
	/* ************************************************************************** */
	/*                               MEMBER TYPES                                 */
	/* ************************************************************************** */
	private readonly _user: UserService;
	private readonly _jwt: JwtService;
	private readonly _config: ConfigService;
	private readonly _prisma: PrismaService;
	private readonly _transporter: nodemailer.Transporter;
	private readonly _sender: string;
	private readonly _logger = new Logger(AuthController.name);

	/* ************************************************************************** */
	/*                               CONSTRUCTOR                                  */
	/* ************************************************************************** */
	constructor() {
		this._user = new UserService();
		this._jwt = new JwtService();
		this._config = new ConfigService();
		this._prisma = new PrismaService();
		this._sender = this.get_sender(this._config);
		const host: string = this.get_host(this._config);
		const pass: string = this.get_pass(this._config);
		this._transporter = this.get_transporter(host, pass);
	}

	/* ************************************************************************** */
	/*                                 GETTERS                                    */
	/* ************************************************************************** */
	private get_sender(config: ConfigService): string {
		this._logger.debug("IN get_sender");
		let sender = config.get<string>("NO_REPLY_EMAIL");
		if (sender === undefined) throw new Error("NO_REPLY_EMAIL is undefined");
		return sender;
	}

	private get_host(config: ConfigService): string {
		this._logger.debug("IN get_host");
		const host: string | undefined = config.get<string>("NO_REPLY_EMAIL_HOST");
		if (host === undefined) throw new Error("NO_REPLY_EMAIL_HOST is undefined");
		return host;
	}

	private get_pass(config: ConfigService): string {
		this._logger.debug("IN get_pass");
		const pass: string | undefined = config.get<string>("NO_REPLY_EMAIL_PASS");
		if (pass === undefined) throw new Error("NO_REPLY_EMAIL_PASS is undefined");
		return pass;
	}

	private get_transporter(host: string, pass: string): nodemailer.Transporter {
		this._logger.debug("IN get_transporter");
		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
			host: host,
			port: 587,
			secure: false,
			auth: {
				user: this._sender,
				pass: pass,
			},
		});
		transporter.verify((error: any) => {
			if (error) throw new Error("SMTP configuration error: " + error);
		});
		return transporter;
	}

	/* ************************************************************************** */
	/*                             PUBLIC FUNCTIONS                               */
	/* ************************************************************************** */
	public async create_access_token(login: string): Promise<t_access_token> {
		this._logger.debug("IN create_access_token");
		// get the user id (creates user if not already existing)
		let user_id: string | undefined;
		try {
			this._logger.debug("login = ", login);
			user_id = await this._user.get_ones_id_by_login(login);
		} catch (error) {
			if (error instanceof UserNotFoundError) {
				this._logger.error(error.message);
				user_id = await this._user.create_one(login);
			} else throw error;
		}
		// create access_token object
		const payload: t_payload = { sub: user_id };
		const token_obj: t_access_token = await this.sign_token(payload);
		return token_obj;
	}

	public async initiate_2FA(user_id: string, email: string): Promise<void> {
		this._logger.debug("IN initiate_2FA");
		await this.add_email_to_db(user_id, email);
		await this.activate_2FA(user_id);
	}

	public async activate_2FA(user_id: string): Promise<void> {
		this._logger.debug("IN activate_2FA");
		const user: t_user_auth = await this.get_user_auth(user_id);
		const email: string | null = user.email;
		if (email === null) throw new Error("Email was not set in the database");
		const code: string = this.create_code();
		await this.add_code_to_db(user_id, code);
		await this.set_status_to_pending(user_id);
		this.send_confirmation_email(email, code);
	}

	public async validate_2FA(user_id: string, code: string): Promise<void> {
		this._logger.debug("IN validate_2FA");
		const user: t_user_auth = await this.get_user_auth(user_id);
		await this.validate_code(user_id, code);
		if (user.twoFactAuth === false) {
			await this.activate_2FA_in_db(user_id);
			if (user.email !== null) this.send_thankyou_email(user.email);
		}
		await this.delete_secret(user_id);
		await this.set_status_to_active(user_id);
	}

	/* ************************************************************************** */
	/*                            PRIVATE FUNCTIONS                               */
	/* ************************************************************************** */
	private async sign_token(payload: t_payload): Promise<t_access_token> {
		this._logger.debug("IN sign_token");
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

	private create_code(): string {
		this._logger.debug("IN create_code");
		const code: number = Math.floor(10000 + Math.random() * 900000);
		const string_code: string = code.toString();
		return string_code;
	}

	private async validate_code(user_id: string, code: string): Promise<boolean> {
		this._logger.debug("IN validate_code");
		const secret: t_secret = await this.get_secret_from_db(user_id);
		if (!secret.twoFACode || !secret.twoFACreationDate)
			throw new Error("Code is not set in the database");
		if ((await argon2.verify(secret.twoFACode, code)) === false) throw new InvalidCode();
		if (this.is_expired(secret.twoFACreationDate) === true) throw new ExpiredCode();
		return true;
	}

	private is_expired(creation_time: Date): boolean {
		this._logger.debug("IN is_expired");
		const current_time: Date = new Date();
		const secret_lifetime: number = current_time.getMinutes() - creation_time.getMinutes();
		if (secret_lifetime <= 10) return false;
		else return true;
	}

	private send_confirmation_email(receiver_email: string, secret: string): void {
		this._logger.debug("IN send_confirmation_email");
		try {
			const confirmation_email: t_email = {
				from: "Transcendence team <" + this._sender + ">",
				to: receiver_email,
				subject: "Confirmation email ✔",
				html:
					"<b>Please enter the following code to our Transcendence application : " +
					secret +
					" </b>",
			};
			this._transporter.sendMail(confirmation_email);
		} catch (error) {
			this._logger.error("sendMail() error : " + error);
			throw new Error("sendMail() error : " + error);
		}
	}

	private send_thankyou_email(receiver: string): void {
		this._logger.debug("IN send_thankyou_email");
		try {
			let error: any;
			const thankyou_email: t_email = {
				from: "Transcendence team <" + this._sender + ">",
				to: receiver,
				subject: "🐹  💝  🐹  Thank you  🐹  💝  🐹",
				html:
					"<p>Your authentication has been confirmed !</p>" +
					"<p> 🐹  We love you so much  🐹 </p>",
			};
			this._transporter.sendMail(thankyou_email, error);
		} catch (error) {
			this._logger.error("sendMail() error : " + error);
			throw new Error("sendMail() error : " + error);
		}
	}

	/* ************************************************************************** */
	/*                              DATABASE CALLS                                */
	/* ************************************************************************** */
	private async get_secret_from_db(user_id: string): Promise<t_secret> {
		this._logger.debug("IN get_secret_from_db");
		const secret: t_secret | null = await this._prisma.user.findUnique({
			where: { id: user_id },
			select: { twoFACode: true, twoFACreationDate: true },
		});
		if (!secret) throw new UserNotFoundError();
		return secret;
	}

	public async get_user_auth(user_id: string): Promise<t_user_auth> {
		this._logger.debug("IN get_user_auth");
		const user: t_user_auth | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				email: true,
				twoFactAuth: true,
				state: true,
			},
			where: {
				id: user_id,
			},
		});
		if (!user) throw new UserNotFoundError();
		return user;
	}

	private async add_code_to_db(user_id: string, code: string): Promise<void> {
		this._logger.debug("IN add_code_to_db");
		const crypted_code = await argon2.hash(code);
		const currentTime: Date = new Date();
		try {
			await this._prisma.user.update({
				where: { id: user_id },
				data: { twoFACode: crypted_code, twoFACreationDate: currentTime },
			});
		} catch (error) {
			this._logger.error("ERROR in create_secret: " + error);
		}
	}

	private async add_email_to_db(user_id: string, email: string): Promise<void> {
		this._logger.debug("IN add_email_to_db");
		await this._user.update_one(user_id, undefined, email);
	}

	private async activate_2FA_in_db(user_id: string): Promise<void> {
		this._logger.debug("IN activate_2FA_in_db");
		await this._prisma.user.update({
			data: { twoFactAuth: true },
			where: { id: user_id },
		});
	}

	private async delete_secret(user_id: string): Promise<void> {
		this._logger.debug("IN delete_secret");
		await this._prisma.user.update({
			where: { id: user_id },
			data: { twoFACode: null, twoFACreationDate: null },
		});
	}

	private async set_status_to_active(user_id: string): Promise<void> {
		this._logger.debug("IN set_status_to_active");
		await this._prisma.user.update({
			where: { idAndState: { id: user_id, state: StateType.PENDING } },
			data: { state: StateType.ACTIVE },
		});
	}

	private async set_status_to_pending(user_id: string): Promise<void> {
		this._logger.debug("IN set_status_to_pending");
		await this._prisma.user.update({
			where: { idAndState: { id: user_id, state: StateType.ACTIVE } },
			data: { state: StateType.PENDING },
		});
	}
}
