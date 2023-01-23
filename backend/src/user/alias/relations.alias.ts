import { Channel, Game, Skin, User } from "@prisma/client";

export type t_relations = {
	skin: Skin;
	channels: Channel[];
	gamesPlayed: Game[];
	gamesWon: Game[];
	friends: User[];
	blocked: User[];
};
