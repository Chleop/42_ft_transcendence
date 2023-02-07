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
     * The ID of the author.
     */
    senderId: UserId;
    /**
     * The content of the message.
     */
    content: string;
    /**
     * The ID of the channel.
     */
    channelId: ChannelId,
    /**
     * The time of the message.
     */
    dateTime: string,
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
    /** The type of this channel. */
    type: "PUBLIC"|"PROTECTED",
    /** Member count. */
    member_count: number,
}
