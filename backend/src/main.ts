import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SocketIOAdapter } from "./socket-io.adapter";
import * as session from "express-session";
import * as passport from "passport";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger: ["log", "error"],
	});

	app.setGlobalPrefix("api");

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
		}),
	);

	const configService = app.get(ConfigService);
	app.use(
		session({
			secret: <string>configService.get<string>("SESSION_SECRET"),
			resave: false,
			saveUninitialized: false,
		}),
	);
	app.use(passport.initialize());
	app.use(passport.session());
	app.useWebSocketAdapter(new SocketIOAdapter(app, configService));

	await app.listen(3000);
}
bootstrap();
