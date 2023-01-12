import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
	constructor() {
		const config: ConfigService = new ConfigService();
		const url: string | undefined = config.get("DATABASE_URL");

		if (url === undefined) {
			throw new Error("DATABASE_URL is undefined!");
		}

		super({
			datasources: {
				db: {
					url: url,
				},
			},
		});
	}
}
