import { e_status } from "src/channel/enum";
import { Channel } from "@prisma/client";

export type t_join_one_return = {
	channel: Channel | null;
	status: e_status;
};
