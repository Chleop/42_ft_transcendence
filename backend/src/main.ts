import { AppModule } from "src/app.module";
import { SocketIOAdapter } from "src/socket-io.adapter";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import * as session from "express-session";
import * as passport from "passport";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger: ["log", "debug", "error", "verbose"],
	});

	app.setGlobalPrefix("api");

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
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
