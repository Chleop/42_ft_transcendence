import { e_status } from "src/user/enum";
import { StreamableFile } from "@nestjs/common";

export type t_return_get_ones_avatar = {
	sfile: StreamableFile | null;
	status: e_status;
};
