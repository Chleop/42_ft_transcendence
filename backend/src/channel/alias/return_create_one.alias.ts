import { e_status } from "src/channel/enum";
import { Channel } from "@prisma/client";

export type t_return_create_one = {
	channel: Channel | null;
	status: e_status;
};
