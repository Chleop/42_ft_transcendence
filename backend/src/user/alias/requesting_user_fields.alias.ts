export type t_sending_user_fields = {
	blocked: {
		id: string;
	}[];
	channels: {
		members: {
			id: string;
		}[];
	}[];
	directMessagesReceived: {
		sender: {
			id: string;
		};
	}[];
	directMessagesSent: {
		receiver: {
			id: string;
		};
	}[];
	friends: {
		id: string;
	}[];
	gamesPlayed: {
		players: {
			id: string;
		}[];
	}[];
};
export type t_receiving_user_fields = {
	blocked: {
		id: string;
	}[];
};
