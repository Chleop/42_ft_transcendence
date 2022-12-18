import { ChanType } from "@prisma/client";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class ChannelCreateDto {
	@IsNotEmpty()
	@IsString()
	public name: string = "";

	@IsNotEmpty()
	@IsString()
	public password: string = "";

	@IsBoolean()
	public type: ChanType = ChanType.public;
}
