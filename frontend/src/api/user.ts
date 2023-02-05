import { Channel } from "./channel";
import { Id } from "./id";

/**
 * The ID of a user.
 */
export type UserId = Id;

/**
 * The ID of an avatar.
 */
export type AvatarId = Id

/**
 * Stores private information about a user.
 */
export interface PrivateUser {
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
    blocked_ids: UserId[]
    /**
     * The friends of this user.
     */
    friends_ids: UserId[],
};

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
    date_time: Date;
    /**
     * The ID of the winner.
     */
    winner_id: string;
}

/**
 * Stores public information about a user.
 */
export interface User {
    /** 
     * The ID of the user.
     */
    id: UserId,
    /**
     * The name of the user.
     */
    name: string,
};
