import { AppModule } from "src/app.module";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import * as session from "express-session";
import * as passport from "passport";
import { SocketIOAdapter } from "src/socket-io.adapter";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.setGlobalPrefix("api");

	app.useGlobalPipes(
		new ValidationPipe({
			// REMIND: Shouldn't we use `transform: true`?
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
