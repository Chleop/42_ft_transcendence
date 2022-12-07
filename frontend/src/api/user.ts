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
     * The ID of the user's avatar.
     */
    avatar: AvatarId;
    /**
     * The channel that the user is a part of.
     */
    channels: Array<Channel>;
}
