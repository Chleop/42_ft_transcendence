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
     * The ID of the channel. Null for direct messages.
     */
    channelId: ChannelId | null,
    /**
     * The time of the message.
     */
    dateTime: string,
}

export type ChanType = "PROTECTED" | "PUBLIC" | "PRIVATE";

/**
 * Information about a channel.
 */
export interface Channel {
    id: string;
    name: string;
    type: ChanType;
    owner_id: string | null;
    members_count: number;
    operators_ids: string[];
}
