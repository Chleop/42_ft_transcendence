import { PassportSerializer } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
	constructor(private _prisma: PrismaService) {
		super();
	}
	serializeUser(user: any, done: Function): void {
		done(null, user);
	}

	async deserializeUser(payload: any, done: Function): Promise<void> {
		const user = await this._prisma.user.count({
			where: {
				login: payload.login,
			},
		});

		if (user) {
			done(null, payload);
		} else {
			done(null, null);
		}
	}
}
