import { Id } from "./id";
import { UserId } from "./user";

/**
 * The ID of a channel.
 */
export type ChannelId = Id;

/**
 * The ID of a message.
 */
export type MessageId = Id;

/**
 * Information about a message.
 */
export interface Message {
    /**
     * The ID of the message.
     */
    id: MessageId;
    /**
     * The ID of the author's avatar.
     */
    author_avatar: string;
    /**
     * The ID of the author.
     */
    author_id: UserId;
    /**
     * The name of the author.
     */
    author_name: string;
}

/**
 * Information sent by the server when a channel is joined.
 */
export interface ChannelJoined {
    /**
     * The ID of the channel.
     */
    id: ChannelId;
    /**
     * The last messages of the channel.
     */
    admin: boolean;
    /**
     * The last messages of the channel.
     */
    messages: Array<Message>
}

/**
 * Information about a channel.
 */
export interface Channel {
    /**
     * The ID of the channel.
     */
    id: ChannelId;
    /**
     * The name of the channel.
     */
    name: string;
    /**
     * Whether the channel requires a password.
     */
    has_password: boolean;
}
