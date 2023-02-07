import { StateType } from "@prisma/client";

export type t_user_auth = {
	id: string;
	email: string | null;
	twoFactAuth: boolean;
	state: StateType;
};
