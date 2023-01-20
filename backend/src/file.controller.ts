import { Controller, Get, StreamableFile, Res } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import type { Response } from "express";

@Controller()
export class FileController {
	@Get()
	getIndex(@Res({ passthrough: true }) res: Response): StreamableFile {
		const file = createReadStream(join(process.cwd(), "www/index.html"));
		res.set({
			"Content-Type": "text/html",
		});
		return new StreamableFile(file);
	}

	@Get("script.js")
	getScript(@Res({ passthrough: true }) res: Response): StreamableFile {
		const file = createReadStream(join(process.cwd(), "www/script.js"));
		res.set({
			"Content-Type": "text/javascript",
		});
		return new StreamableFile(file);
	}

	@Get("style.css")
	getStyle(@Res({ passthrough: true }) res: Response): StreamableFile {
		const file = createReadStream(join(process.cwd(), "www/style.css"));
		res.set({
			"Content-Type": "text/css",
		});
		return new StreamableFile(file);
	}
}
