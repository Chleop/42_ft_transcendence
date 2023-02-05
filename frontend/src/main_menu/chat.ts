import { Channel, ChannelId, Message, Client, Users, Gateway, UserId } from "../api";

class UserCardElement {
    private screen: HTMLDivElement;
    private card: HTMLDivElement;
    private banner: HTMLDivElement;
    private avatar: HTMLDivElement;
    private name: HTMLDivElement;
    private status: HTMLDivElement;
    private stats: HTMLDivElement;
    private friend_button: HTMLButtonElement;
    private blocked_button: HTMLButtonElement;

    private current_user: UserId|null;

    public constructor() {
        const screen = document.createElement("div");
        screen.id = "user-card-screen";
        screen.onclick = ev => {
            if (ev.target === screen)
            {
                this.screen.remove();
                this.current_user = null;
            }
        };

        const card = document.createElement("div");
        card.id = "user-card";
        screen.appendChild(card);

        const banner = document.createElement("div");
        banner.id = "user-card-banner";
        card.appendChild(banner);

        const content_container = document.createElement("div");
        content_container.id = "user-card-content-container";
        card.appendChild(content_container);

        const header = document.createElement("div");
        header.id = "user-card-header";
        content_container.appendChild(header);

        const avatar = document.createElement("div");
        avatar.id = "user-card-avatar";
        header.appendChild(avatar);

        const name = document.createElement("div");
        name.id = "user-card-name";
        header.appendChild(name);

        const status = document.createElement("div");
        status.id = "user-card-status";
        content_container.appendChild(status);

        const stats = document.createElement("div");
        stats.id = "user-card-stats";
        content_container.appendChild(stats);

        const menu = document.createElement("div");
        menu.id = "user-card-menu";
        content_container.appendChild(menu);

        const friend_button = document.createElement("button");
        friend_button.classList.add("user-card-menu-button");
        menu.appendChild(friend_button);

        const blocked_button = document.createElement("button");
        blocked_button.classList.add("user-card-menu-button");
        menu.appendChild(blocked_button);

        const send_message_button = document.createElement("button");
        send_message_button.classList.add("user-card-menu-button");
        send_message_button.innerText = "Send Message";
        menu.appendChild(send_message_button);

        this.screen = screen;
        this.card = card;
        this.banner = banner;
        this.avatar = avatar;
        this.name = name;
        this.status = status;
        this.stats = stats;
        this.friend_button = friend_button;
        this.blocked_button = blocked_button;
        this.current_user = null;
    }

    public show(elem: HTMLElement, user: UserId) {
        this.current_user = user;

        Users.get(user).then(user => {
            Users.me().then(me => {
                this.name.innerText = user.name;

                // TODO: use the status of the user when it is sent by the backend.
                this.status.innerText = "STATUS HERE";
                this.stats.innerText = "STATS HERE";

                const friend = !!me.friends_ids.find(id => user.id === id);
                const pending = !!me.pending_friends_ids.find(id => user.id === id);
                const blocked = !!me.blocked_ids.find(id => user.id === id);

                if (friend) {
                    this.friend_button.innerText = "Remove Friend";
                } else if (pending) {
                    this.friend_button.innerText = "Accept Friend";
                } else {
                    this.friend_button.innerText = "Add Friend";
                }

                if (blocked) {
                    this.blocked_button.innerText = "Unblock User";
                } else {
                    this.blocked_button.innerText = "Block User";
                }
            });
        });
        Users.get_avatar(user).then(url => {
            // TODO: use the skin here.
            this.avatar.style.backgroundImage = `url(\"${url}\")`;
            this.banner.style.backgroundImage = `url(\"${url}\")`;
        });

        const box = elem.getBoundingClientRect();
        const top = box.top;
        const left = box.left - 10;

        this.card.style.top = `${top}px`;
        this.card.style.left = `${left}px`;
        document.body.appendChild(this.screen);
        const box2 = this.card.getBoundingClientRect();
        if (box2.bottom >= window.innerHeight - 20)
            this.card.style.top = `${window.innerHeight - 20 - box2.height}px`;
    }
}

const USER_CARD = new UserCardElement();

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
        Users.get_avatar(message.senderId).then(url => {
            avatar.style.backgroundImage = `url(\"${url}\")`;
        });
        avatar.onclick = _ => USER_CARD.show(avatar, message.senderId);
        const author = document.createElement("button");
        author.classList.add("message-author");
        author.onclick = _ => USER_CARD.show(author, message.senderId);
        Users.get(message.senderId).then(user => author.innerText = user.name);
        const time = document.createElement("div");
        time.classList.add("message-time");
        time.innerText = new Date(message.dateTime).toLocaleString();
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
export interface MessageElement { }

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

    public last_message: Message|null;

    public my_last_message: string|null = null;

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

        this.last_message = null;
        this.channel_id = channel.id;

        this.input = "";
    }
}

/**
 * A channel that has been instanciated.
 */
export interface ChannelElement { }

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
    private selected_channel: null | ChannelElementInternal;

    /** The channels elements. */
    private channel_elements: ChannelElementInternal[];

    /**
     * Creates a new `ChatContainer` element.
     */
    public constructor() {
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
        create_channel_button.classList.add("circle-button");
        create_channel_button.id = "chat-create-channel";
        create_channel_container.appendChild(create_channel_button);

        this.messages = document.createElement("div");
        this.messages.id = "chat-messages";
        this.messages.classList.add("custom-scrollbar");
        this.container.appendChild(this.messages);

        const send_message_container = document.createElement("div");
        send_message_container.id = "chat-send-message-container";
        this.container.appendChild(send_message_container);

        const channel_settings_button = document.createElement("button");
        channel_settings_button.id = "chat-settings-button";
        channel_settings_button.classList.add("circle-button");
        send_message_container.appendChild(channel_settings_button);

        const handle = document.createElement("div");
        handle.id = "chat-handle";
        handle.onclick = () => {
            this.container.classList.toggle("chat-hidden");
            if (this.container.classList.contains("chat-hidden")) {
                window.localStorage.setItem("chat-hidden", "true");
            } else {
                window.localStorage.setItem("chat-hidden", "false");
            }
        };
        if (window.localStorage.getItem("chat-hidden") === "true") {
            setTimeout(() => {
                this.container.classList.add("chat-hidden");
            }, 0);
        }
        this.container.appendChild(handle);

        this.message_input = document.createElement("input");
        this.message_input.id = "chat-send-message";
        this.message_input.type = "text";
        this.message_input.onkeydown = ev => {
            if (ev.key === "Enter") {
                this.send_message_input();
            } else if (ev.key === "ArrowUp") {
                if (this.selected_channel && this.selected_channel.my_last_message && this.message_input.value === "") {
                    this.message_input.value = this.selected_channel.my_last_message;
                    ev.preventDefault();
                }
            }
        };
        send_message_container.appendChild(this.message_input);

        this.selected_channel = null;
        this.channel_elements = [];

        Gateway.on_connected = () => {
            console.log("Connected to the gateway!");
        };

        Gateway.on_message = (msg: Message) => {
            let ch = this.get_channel(msg.channelId);
            if (ch) {
                this.add_message(ch, msg);
            } else {
                console.warn(`received a message not meant to me:`, msg);
            }
        };
    }

    /**
     * Sets the currently selected channel.
     */
    public set_selected_channel(element: ChannelElement | null) {
        const element_ = element as ChannelElementInternal | null;

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

        // Try to get the twenty last messages of the channel.
        Client.last_messages(channel.id, 20).then(messages => {
            for (const m of messages) {
                this.add_message(element, m);
            }
        });

        this.channel_elements.push(element);
        return element;
    }

    /** Returns a channel element by ID */
    public get_channel(channel: ChannelId): undefined | ChannelElement {
        return this.channel_elements.find(e => e.channel_id == channel);
    }

    /**
     * Adds a message to a specific channel.
     */
    public add_message(channel: ChannelElement, message: Message): MessageElement {
        const channel_ = channel as ChannelElementInternal;

        let continuing = false;
        if (channel_.last_message) {
            if (channel_.last_message.senderId === message.senderId && Date.parse(message.dateTime) - Date.parse(channel_.last_message.dateTime) < 5 * 60 * 1000)
                continuing = true;
        }

        // If the last child is the same author, add the `message-continuing` class.
        channel_.last_message = message;

        const element = new MessageElementInternal(continuing, message);
        channel_.messages.appendChild(element.container);
        return element;
    }

    /**
     * Sends the content of the `<input id="chat-send-message">` to the currently selected
     * channel, and through the network.
     */
    public async send_message_input(): Promise<Message | null> {
        if (!this.selected_channel) {
            return null;
        }

        // Do nothing if the input contains nothing.
        if (!this.message_input.value) {
            return null;
        }

        const content = this.message_input.value.trim();
        this.message_input.value = "";

        if (content === "") {
            return null;
        }

        this.selected_channel.my_last_message = content; 
        return Client.send_message(this.selected_channel.channel_id, content);
    }

    /**
     * Returns the root node of this element.
     */
    public get html(): HTMLElement {
        return this.container;
    }
}
