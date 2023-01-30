import { INestApplicationContext } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";

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

	public override createIOServer(port: number, options?: ServerOptions): void {
		/* TODO for later */
		// const port_str : string |undefined= this.config_service.get('CLIENT_PORT')
		// if (port_str=== undefined)
		// const clientPort: number  = parseInt()
		const client_port: number = 3000;

		const cors: CorsOptions = {
			origin: [
				`http://localhost:${client_port}`,
				new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${client_port}$/`),
			],
		};

		// we need to return this, even though the signature says it returns void
		return super.createIOServer(port, { ...options, cors });
	}
}
