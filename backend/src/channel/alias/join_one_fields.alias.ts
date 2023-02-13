import { ChanType } from "@prisma/client";

export type t_join_one_fields = {
	id: string;
	name: string;
	type: ChanType;
	owner_id: string | null;
};

export type t_join_one_fields_tmp = {
	id: string;
	name: string;
	chanType: ChanType;
	hash: string | null;
	ownerId: string | null;
	members: t_member_fields[];
	banned: t_banned_fields[];
};

type t_member_fields = {
	id: string;
};

type t_banned_fields = {
	id: string;
};
