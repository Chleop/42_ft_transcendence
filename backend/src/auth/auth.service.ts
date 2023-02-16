import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserNotFoundError } from "src/user/error";
import { UserService } from "src/user/user.service";
import { Response } from "express";
import * as nodemailer from "nodemailer";
import { PrismaService } from "src/prisma/prisma.service";
import { StateType } from "@prisma/client";
import { t_access_token, t_email, t_payload, t_secret, t_user_auth } from "src/auth/alias";
import * as argon2 from "argon2";
import { CodeIsNotSet, ExpiredCode, InvalidCode, PendingUser } from "./error";

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
	private readonly _logger: Logger;

	/* ************************************************************************** */
	/*                               CONSTRUCTOR                                  */
	/* ************************************************************************** */
	constructor(user_service: UserService, jwt_service: JwtService, config_service: ConfigService,
		prisma_service: PrismaService) {
		this._user = user_service;
		this._jwt = jwt_service;
		this._config = config_service;
		this._prisma = prisma_service;
		this._logger = new Logger(AuthService.name);
		this._sender = this.get_sender(this._config);
		const host: string = this.get_host(this._config);
		const pass: string = this.get_pass(this._config);
		this._transporter = this.get_transporter(host, pass);
	}

	/* ************************************************************************** */
	/*                                 GETTERS                                    */
	/* ************************************************************************** */
	private get_sender(config: ConfigService): string {
		let sender = config.get<string>("NO_REPLY_EMAIL");
		if (sender === undefined) throw new Error("NO_REPLY_EMAIL is undefined");
		return sender;
	}

	private get_host(config: ConfigService): string {
		const host: string | undefined = config.get<string>("NO_REPLY_EMAIL_HOST");
		if (host === undefined) throw new Error("NO_REPLY_EMAIL_HOST is undefined");
		return host;
	}

	private get_pass(config: ConfigService): string {
		const pass: string | undefined = config.get<string>("NO_REPLY_EMAIL_PASS");
		if (pass === undefined) throw new Error("NO_REPLY_EMAIL_PASS is undefined");
		return pass;
	}

	private get_transporter(host: string, pass: string): nodemailer.Transporter {
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
	public async signin(login: string, res: Response): Promise<void> {
		let user: t_user_auth | null;

		user = await this.get_user_auth_by_login(login);
		if (!user) {
			await this._user.create_one(login);
			user = await this.get_user_auth_by_login(login);
			if (!user) throw new Error("Failed to create user");
		}
		if (user.state === StateType.PENDING) throw new PendingUser();
		const token: t_access_token = await this.create_access_token(user.id);
		res.cookie("access_token", token.access_token);
		if (user.twoFactAuth === true) {
			await this.set_status_to_pending(user.id);
			await this.generate_and_send_code(user.id);
		}
		res.redirect(<string>this._config.get<string>("SITE_URL"));
	}

	public async activate_2FA(user_id: string, email: string): Promise<void> {
		await this.add_email_to_db(user_id, email);
		await this.generate_and_send_code(user_id);
	}

	public async deactivate_2FA(user_id: string): Promise<void> {
		await this.deactivate_2FA_in_db(user_id);
	}

	public async generate_and_send_code(user_id: string): Promise<void> {
		const user: t_user_auth = await this.get_user_auth(user_id);
		const email: string | null = user.email;
		if (email === null) throw new Error("Email was not set in the database");
		const code: string = this.create_code();
		await this.add_code_to_db(user_id, code);
		await this.send_confirmation_email(email, code);
	}

	public async validate_2FA(user_id: string, code: string): Promise<void> {
		const user: t_user_auth = await this.get_user_auth(user_id);
		await this.validate_code(user_id, code);
		if (user.twoFactAuth === false) {
			await this.activate_2FA_in_db(user_id);
			if (user.email !== null) await this.send_thankyou_email(user.email);
		}
		await this.delete_secret(user_id);
		await this.set_status_to_active(user_id);
	}

	/* ************************************************************************** */
	/*                            PRIVATE FUNCTIONS                               */
	/* ************************************************************************** */
	private async create_access_token(user_id: string): Promise<t_access_token> {
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

	private create_code(): string {
		const code: number = Math.floor(10000 + Math.random() * 900000);
		const string_code: string = code.toString();
		this._logger.log("Code is : " + code);
		return string_code;
	}

	private async validate_code(user_id: string, code: string): Promise<boolean> {
		const secret: t_secret = await this.get_secret_from_db(user_id);
		if (!secret.twoFACode || !secret.twoFACreationDate) throw new CodeIsNotSet();
		if ((await argon2.verify(secret.twoFACode, code)) === false) throw new InvalidCode();
		if (this.is_expired(secret.twoFACreationDate) === true) throw new ExpiredCode();
		return true;
	}

	private is_expired(creation_time: Date): boolean {
		const current_time: Date = new Date();
		const secret_lifetime: number = current_time.getMinutes() - creation_time.getMinutes();
		if (secret_lifetime <= 10) return false;
		else return true;
	}

	private async send_confirmation_email(receiver_email: string, secret: string): Promise<void> {
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
			await this._transporter.sendMail(confirmation_email);
		} catch (error) {
			this._logger.error("sendMail() error : " + error);
			throw new Error("sendMail() error : " + error);
		}
	}

	private async send_thankyou_email(receiver: string): Promise<void> {
		try {
			const thankyou_email: t_email = {
				from: "Transcendence team <" + this._sender + ">",
				to: receiver,
				subject: "🐹  💝  🐹  Thank you  🐹  💝  🐹",
				html:
					"<p>The two fact authorization has been activated!</p>" +
					"<p> 🐹  We love you so much  🐹 </p>",
			};
			await this._transporter.sendMail(thankyou_email);
		} catch (error) {
			this._logger.error("sendMail() error : " + error);
			throw new Error("sendMail() error : " + error);
		}
	}

	/* ************************************************************************** */
	/*                              DATABASE CALLS                                */
	/* ************************************************************************** */
	private async get_secret_from_db(user_id: string): Promise<t_secret> {
		const secret: t_secret | null = await this._prisma.user.findUnique({
			where: { id: user_id },
			select: { twoFACode: true, twoFACreationDate: true },
		});
		if (!secret) throw new UserNotFoundError();
		return secret;
	}

	public async get_user_auth(user_id: string): Promise<t_user_auth> {
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

	public async get_user_auth_by_login(login: string): Promise<t_user_auth | null> {
		const user: t_user_auth | null = await this._prisma.user.findUnique({
			select: {
				id: true,
				email: true,
				twoFactAuth: true,
				state: true,
			},
			where: {
				login: login,
			},
		});
		return user;
	}

	private async add_code_to_db(user_id: string, code: string): Promise<void> {
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
		await this._prisma.user.update({
			where: { id: user_id },
			data: { email: email },
		});
	}

	private async activate_2FA_in_db(user_id: string): Promise<void> {
		await this._prisma.user.update({
			data: { twoFactAuth: true },
			where: { id: user_id },
		});
	}

	private async deactivate_2FA_in_db(user_id: string): Promise<void> {
		await this._prisma.user.update({
			data: { twoFactAuth: false },
			where: { id: user_id },
		});
	}

	private async delete_secret(user_id: string): Promise<void> {
		await this._prisma.user.update({
			where: { id: user_id },
			data: { twoFACode: null, twoFACreationDate: null },
		});
	}

	private async set_status_to_active(user_id: string): Promise<void> {
		await this._prisma.user.update({
			where: { id: user_id },
			data: { state: StateType.ACTIVE },
		});
	}

	private async set_status_to_pending(user_id: string): Promise<void> {
		await this._prisma.user.update({
			where: { idAndState: { id: user_id, state: StateType.ACTIVE } },
			data: { state: StateType.PENDING },
		});
	}
}
