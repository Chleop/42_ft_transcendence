import { e_status } from "src/channel/enum";
import { ChannelMessage } from "@prisma/client";

export type t_return_get_ones_messages = {
	messages: ChannelMessage[] | null;
	status: e_status;
};
