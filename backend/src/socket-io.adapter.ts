import { ForbiddenException, INestApplicationContext } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions, Socket } from "socket.io";

/**
 * Allows gateway to have dynamic ports (imported from env)
 * amongst other goodies that I'll add later
 */
export class SocketIOAdapter extends IoAdapter {
	private readonly app: INestApplicationContext;
	private readonly config_service: ConfigService;

	constructor(app: INestApplicationContext, configService: ConfigService) {
		console.log("Adapter created");
		super(app);
		this.app = app;
		this.config_service = configService;
		this.app; // useless, just to avoid stupid error
		this.config_service; // same
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from IoAdapter)
	 * Called from main (when SocketIOAdapter instanciated)
	 *
	 * Defines extra indications for the new gateway instanciated,
	 * allows middleware usage
	 */
	public override createIOServer(port: number, options?: ServerOptions): Server {
		/* TODO for later */
		// const port_str : string |undefined= this.config_service.get('CLIENT_PORT')
		// if (port_str=== undefined)
		// const clientPort: number  = parseInt()
		// const client_port: number = 3000;

		const cors: CorsOptions = {
			origin: [
				// `http://localhost:${client_port}`,
				// new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${client_port}$/`),
				"*"
			],
		};

		const jwt_service: JwtService = this.app.get(JwtService);
		const cfg_service: ConfigService = this.app.get(ConfigService);
		const server: Server = super.createIOServer(port, { ...options, cors });

		server.of("game").use(websocketMiddleware(jwt_service, cfg_service));
		server.of("spectate").use(websocketMiddleware(jwt_service, cfg_service));

		return server;
	}
}

/**
 * Middleware function
 * Will verify jwt token (located in socket.handshake.auth.token)
 */
const websocketMiddleware =
	(jwt_service: JwtService, cfg_service: ConfigService) => (client: Socket, next: (error?: any) => void) => {
		const token: string | undefined = client.handshake.auth.token;
		const secret: string|undefined = cfg_service.get<string>("JWT_SECRET");

		if (!secret)
			throw "lol il faut mettre la variable d'environnemnet `JWT_SECRET` sinon on peut pas vérifier les token";

		try {
			if (token === undefined) {
				throw new Error("No token provided");
			}
			console.log(`Validating token: ${token}`);
			const payload: { sub: string } = jwt_service.verify(token, { secret });
			client.handshake.auth.token = payload.sub;
			next();
		} catch (e) {
			console.error(e);
			next(new ForbiddenException("Invalid token"));
		}
	};
