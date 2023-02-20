import { ChanType } from "@prisma/client";

export interface IChannel {
	id: string;
	name: string;
	type: ChanType;
	owner_id: string | null;
	members_count: number;
	operators_ids: string[];
	banned_ids: string[];
}

export interface IChannelTmp {
	id: string;
	name: string;
	chanType: ChanType;
	hash: string | null;
	ownerId: string | null;
	members: IMember[];
	operators: IOperator[];
	banned: IBanned[];
}

interface IMember {
	id: string;
}

interface IOperator {
	id: string;
}

interface IBanned {
	id: string;
}
