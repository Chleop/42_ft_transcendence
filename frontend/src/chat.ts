import { Channel, ChannelId, Message } from "./api/channel";
import { UserId } from "./api/user";
import { Client as ApiClient } from "./api/client";

/**
 * A message that has been instanciated in the DOM.
 */
class MessageElementInternal {
    /**
     * The `<div>` that contains the whole message.
     */
    public container: HTMLDivElement;

    /**
     * This constructor should basically never be called outside of the module.
     */
    public constructor(continuing: boolean, message: Message) {
        const avatar = document.createElement("avatar");
        avatar.classList.add("message-avatar");
        avatar.style.backgroundImage = `/avatar/${message.author_avatar}`;
        const author = document.createElement("button");
        author.classList.add("message-author");
        author.innerText = message.author_name;
        const time = document.createElement("div");
        time.classList.add("message-time");
        time.innerText = "121"; // TODO: Use real message time.
        const header = document.createElement("div");
        header.classList.add("message-header");
        header.appendChild(author);
        header.appendChild(time);
        const content = document.createElement("div");
        content.classList.add("message-content");
        content.innerText = message.content;
        const header_and_content = document.createElement("div");
        header_and_content.classList.add("message-header-and-content");
        header_and_content.appendChild(header);
        header_and_content.appendChild(content);
        this.container = document.createElement("div");
        this.container.classList.add("message-container");
        this.container.appendChild(avatar);
        this.container.appendChild(header_and_content);

        if (continuing) {
            this.container.classList.add("message-continuing");
        }
    }

    /**
     * Returns the root HTML node of the chat.
     */
    public get html(): HTMLElement {
        return this.container;
    }
}

/**
 * A message that has been instanciated.
 */
export interface MessageElement {}

/**
 * A channel that has been instanciated in the DOM.
 */
class ChannelElementInternal {
    /**
     * The `<button>` element representing the tab.
     */
    public tab: HTMLButtonElement;
    /**
     * The `<div>` messages that were sent in the channel. This element is the only child of
     * the `<div id="#chat-messages">` container.
     */
    public messages: HTMLDivElement;

    /**
     * The ID of the author of the last message that was sent in the channel.
     */
    public last_message_author: null|UserId;

    /**
     * The ID of the channel.
     */
    public channel_id: ChannelId;

    /**
     * The saved value of the input field (if the user left the channel without clearing the
     * prompt).
     */
    public input: string;

    /**
     * This constructor should basically never be called outside of the module.
     */
    public constructor(container: ChatElement, channel: Channel) {
        this.tab = document.createElement("button");
        this.tab.classList.add("channel-tab");
        this.tab.innerText = channel.name;
        this.tab.onclick = () => container.set_selected_channel(this);

        this.messages = document.createElement("div");

        this.last_message_author = null;
        this.channel_id = channel.id;

        this.input = "";
    }
}

/**
 * A channel that has been instanciated.
 */
export interface ChannelElement {}

/**
 * Stores the state of the chat.
 */
export class ChatElement {
    /**
     * The actual HTML `<div>` element.
     */
    private container: HTMLDivElement;

    /**
     * The `<div>` that contains all the channel tabs.
     */
    private channel_tabs: HTMLDivElement;

    /**
     * The `<div>` that contains the messages.
     *
     * In reality another DIV will be actually store the messages.
     *
     * ```
     * <div id="chat-messages">
     *     <div>
     *         <Message />
     *     </div>
     * </div>
     * ```
     */
    private messages: HTMLDivElement;

    /**
     * The `<input type="text">` that is used by the user to write messages.
     */
    private message_input: HTMLInputElement;

    /**
     * Information about the channel that is currently selected.
     */
    private selected_channel: null|ChannelElementInternal;

    /**
     * Creates a new `ChatContainer` element.
     */
    public constructor(client: ApiClient) {
        this.container = document.createElement("div");
        this.container.id = "chat-container";

        const chat_nav = document.createElement("div");
        chat_nav.id = "chat-nav";
        this.container.appendChild(chat_nav);

        this.channel_tabs = document.createElement("div");
        this.channel_tabs.id = "chat-channels";
        chat_nav.appendChild(this.channel_tabs);

        const create_channel_container = document.createElement("div");
        create_channel_container.id = "chat-create-channel-container";
        chat_nav.appendChild(create_channel_container);

        const create_channel_button = document.createElement("button");
        create_channel_button.id = "chat-create-channel";
        create_channel_container.appendChild(create_channel_button);

        this.messages = document.createElement("div");
        this.messages.id = "chat-messages";
        this.container.appendChild(this.messages);

        const send_message_container = document.createElement("div");
        send_message_container.id = "chat-send-message-container";
        this.container.appendChild(send_message_container);

        const channel_settings_button = document.createElement("button");
        channel_settings_button.id = "chat-settings-button";
        send_message_container.appendChild(channel_settings_button);

        this.message_input = document.createElement("input");
        this.message_input.id = "chat-send-message";
        this.message_input.type = "text";
        this.message_input.onkeydown = ev => { if (ev.key === "Enter") { this.send_message_input(client); } };
        send_message_container.appendChild(this.message_input);
    }

    /**
     * Sets the currently selected channel.
     */
    public set_selected_channel(element: ChannelElement|null) {
        const element_ = element as ChannelElementInternal|null;

        if (this.selected_channel) {
            this.selected_channel.tab.classList.remove("active-channel-tab");
            this.selected_channel.messages.remove();
            this.selected_channel.input = this.message_input.value;

            this.selected_channel = null;
            this.message_input.value = "";
        }

        if (element_) {
            element_.tab.classList.add("active-channel-tab");
            this.messages.appendChild(element_.messages);

            // FIXME:
            //  When we want to support upward scrolling, messages should be queried once here if
            //  we can fit some more.

            this.selected_channel = element_;

            this.message_input.value = element_.input;
            this.message_input.focus();
        }
    }

    /**
     * Adds a channel to the list of channels.
     */
    public add_channel(channel: Channel): ChannelElement {
        let element = new ChannelElementInternal(this, channel);

        this.channel_tabs.appendChild(element.tab);

        return element;
    }

    /**
     * Adds a message to a specific channel.
     */
    public add_message(channel: ChannelElement, message: Message): MessageElement {
        const channel_ = channel as ChannelElementInternal;

        let continuing = false;
        if (channel_.last_message_author && channel_.last_message_author === message.author_id) {
            continuing = true;
        }

        // If the last child is the same author, add the `message-continuing` class.
        if (!continuing) {
            channel_.last_message_author = message.author_id;
        }

        const element = new MessageElementInternal(continuing, message);
        channel_.messages.appendChild(element.container);
        return element;
    }

    /**
     * Sends the content of the `<input id="chat-send-message">` to the currently selected
     * channel, and through the network.
     */
    public async send_message_input(_client: ApiClient): Promise<Message|null> {
        if (!this.selected_channel) {
            return null;
        }

        const content = this.message_input.value;
        this.message_input.value = "";

        // TODO:
        //  Use the API for real here.
        let message: Message = /* await client.send_message(this.selected_channel.channel_id, content); */ {
            author_avatar: "",
            author_id: "Nils",
            author_name: "Nils",
            content,
            id: "",
        };

        this.add_message(this.selected_channel, message);

        return message;
    }

    /**
     * Returns the root node of this element.
     */
    public get html(): HTMLElement {
        return this.container;
    }
}
