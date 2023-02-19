import { IUserPublic, IUserPublicTmp } from "src/user/interface";
import { IGame, IGameTmp } from "src/game/interface";

export interface IUserPrivate extends IUserPublic {
	login: string;
	email: string | null;
	two_fact_auth: boolean;
	channels_owned_ids: string[];
	games_played: IGame[];
	friends_ids: string[];
	pending_friends_ids: string[];
	blocked_ids: string[];
}

export interface IUserPrivateTmp extends IUserPublicTmp {
	login: string;
	email: string | null;
	twoFactAuth: boolean;
	channelsOwned: IChannelOwned[];
	gamesPlayed: IGameTmp[];
	friends: IFriend[];
	pendingFriendRequests: IPendingFriendRequests[];
	blocked: IBlocked[];
}

interface IChannelOwned {
	id: string;
}

interface IFriend {
	id: string;
}

interface IPendingFriendRequests {
	id: string;
}

interface IBlocked {
	id: string;
}
