import { t_relations } from "src/user/alias";
import { e_status } from "src/user/enum";
import { User } from "@prisma/client";

export type t_return_get_one = {
	user: (User & t_relations) | null;
	status: e_status;
};
