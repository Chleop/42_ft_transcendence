import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FtOauthStrategy extends PassportStrategy(Strategy, "42") {
	constructor(private readonly httpService: HttpService, readonly configService: ConfigService) {
		super({
			authorizationURL: "https://api.intra.42.fr/oauth/authorize",
			tokenURL: "https://api.intra.42.fr/oauth/token",
			clientID: configService.get<string>("FT_API_CLIENT_ID"),
			clientSecret: configService.get<string>("FT_API_CLIENT_SECRET"),
			callbackURL: configService.get<string>("FT_API_CALLBACK_URL"),
			scope: ["public"],
		});
	}

	async validate(accessToken: string) {
		const { data } = await firstValueFrom(
			this.httpService.get("https://api.intra.42.fr/v2/me", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}),
		);
		return { login: data.login };
	}
}
