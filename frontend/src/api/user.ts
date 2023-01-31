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
     * The name of the user.
     */
    name: string;
    /**
     * The channel that the user is a part of.
     */
    channels: Channel[];
    /**
     * An array of all blocked users.
     */
    blocked: UserId[]
    /**
     * The email address of that user.
     */
    email: string,
    /**
     * The friends of this user.
     */
    friends: UserId[],
    /**
     * The 42 login of this user.
     */
    login: string,
};

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
