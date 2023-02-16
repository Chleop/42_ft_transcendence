import { StreamableFile } from "@nestjs/common";
import { t_get_one_fields } from "../../user/alias";

/**
 * Contains Player datas to send to frontend.
 */
export class PlayerInfos {
	public readonly login: string;
	public readonly name: string;
	public readonly avatar: StreamableFile;
	// public readonly skin_id: string;
	public readonly elo: number;

	/* CONSTRUCTOR ============================================================= */

	constructor(user_data: t_get_one_fields, avatar: StreamableFile /* , skin: StreamableFile */) {
		this.login = user_data.login;
		this.name = user_data.name;
		this.avatar = avatar;
		// this.skin_id=
		this.elo = user_data.elo;
	}
}
