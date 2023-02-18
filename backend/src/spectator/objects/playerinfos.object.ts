import { IUserPublic } from "src/user/interface";
import { StreamableFile } from "@nestjs/common";

/**
 * Contains Player datas to send to frontend.
 */
export class PlayerInfos {
	public readonly name: string;
	public readonly avatar: StreamableFile;
	// public readonly skin_id: string;

	/* CONSTRUCTOR ============================================================= */

	constructor(user_data: IUserPublic, avatar: StreamableFile /* , skin: StreamableFile */) {
		this.name = user_data.name;
		this.avatar = avatar;
		// this.skin_id=
	}
}
