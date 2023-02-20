import { Channel } from "./channel";
import { Id } from "./id";
import { SkinId } from "./skin";

/**
 * The ID of a user.
 */
export type UserId = Id;

/**
 * Stores private information about a user.
 */
export interface PrivateUser extends User {
    /**
     * The ID of the user.
     */
    id: UserId;
    /**
     * The login of the user.
     */
    login: string;
    /**
     * The name of the user (this is user-defined).
     */
    name: string;
    /**
     * The e-mail of the user, used for 2FA.
     */
    email: string | null;

    elo: number;
    /**
     * Pending friend requests.
     */
    pending_friends_ids: UserId[];
    /**
     * Whether 2FA is enabled.
     */
    two_fact_auth: boolean;
    /**
     * The channel that the user is a part of.
     */
    channels: Channel[];
    /**
     * Channel IDs owned by this user.
     */
    channels_owned_ids: string[];
    /**
     * The result of the games of this user.
     */
    games_played: GameResult[];
    /**
     * An array of all blocked users.
     */
    blocked_ids: UserId[];
    /**
     * The friends of this user.
     */
    friends_ids: UserId[];
    /**
     * The ID of the skin of this user.
     */
    skin_id: SkinId,
}

/** Information about the result of a game. */
export interface GameResult {
    /**
     * The ID of the game.
     */
    id: string;
    /**
     * The ID of the players.
     */
    players_ids: [string, string];
    /**
     * The score of said players.
     */
    scores: [number, number];
    /**
     * The time of the game.
     */
    date_time: string;
    /**
     * The ID of the winner.
     */
    winner_id: string;
}

export type UserStatus = "online" | "offline" | "ingame" | "spectating";

export type UserUpdate = {
    id: string;
    name?: string;
    status?: UserStatus;
    spectating?: string;
    game_won?: number;
    game_played?: number;
    is_avatar_changed?: boolean;
};

/**
 * Stores public information about a user.
 */
export interface User {
    /**
     * The ID of the user.
     */
    id: UserId;
    /**
     * The name of the user.
     */
    name: string;
    /** The ID of played games. */
    games_played_count: number;
    /** ID of won games. */
    games_won_count: number;
    status: UserStatus;
    spectating: UserId | undefined;
    skin_id: SkinId,
}
