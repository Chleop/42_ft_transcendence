import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as session from "express-session";
import * as passport from "passport";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger: ["debug", "error", "warn"],
	});

	// REMIND remove the exclude part when removing the file server.
	app.setGlobalPrefix("api", { exclude: ["/", "/script.js", "/style.css"] });

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

	await app.listen(3000);
}
bootstrap();
