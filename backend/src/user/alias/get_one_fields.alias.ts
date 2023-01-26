export type t_get_one_fields = {
	id: string;
	login: string;
	name: string;
	email: string | null;
	skinId: string;
	elo: number;
	twoFactAuth: boolean;
	channels: {
		id: string;
	}[];
	channelsOwned: {
		id: string;
	}[];
	gamesPlayed: {
		id: string;
	}[];
	gamesWon: {
		id: string;
	}[];
	friends: {
		id: string;
	}[];
	pendingFriendRequests: {
		id: string;
	}[];
	blocked: {
		id: string;
	}[];
};
