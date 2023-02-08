import { ChanType } from "@prisma/client";

export type t_get_all_fields = {
	id: string;
	name: string;
	type: ChanType;
	owner_id: string | null;
	members_count: number;
}[];

export type t_get_all_fields_tmp = {
	id: string;
	name: string;
	chanType: ChanType;
	ownerId: string | null;
	members: t_member_fields[];
}[];

type t_member_fields = {
	id: string;
};
