import { e_status } from "src/channel/enum";
import { ChannelMessage } from "@prisma/client";

export type t_get_ones_messages_return = {
	messages: ChannelMessage[] | null;
	status: e_status;
};
