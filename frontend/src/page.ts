import { Channel, Message } from "./api/channel";
import { AvatarId } from "./api/user";

/**
 * An element query failed.
 */
export class MissingElement {
    /**
     * The element selector that had not match in the document.
     */
    public readonly selector: string;

    /**
     * Creates a new `MissingElement` exception.
     *
     * @param selector The selector that was used.
     */
    constructor(selector: string) {
        this.selector = selector;
    }
}

/**
 * Queries an element from the document. If the element does not exist, an exception is thrown.
 *
 * @param selector The element selector.
 *
 * @returns The queried element.
 */
function query_element(selector: string): Element {
    const maybe = document.querySelector(selector);

    if (maybe) {
        return maybe;
    } else {
        throw new MissingElement(selector);
    }
}

/**
 * Stores references to the elements related to a specific channel.
 */
export class ChannelElement {
    /**
     * The `<button>` element representing the tab.
     */
    tab: HTMLButtonElement;
    /**
     * The `<div>` messages that were sent in the channel. This element is the only child of
     * the `<div id="#chat-messages">` container.
     */
    messages: HTMLDivElement;

    /**
     * The ID of the author of the last message that sent in the channel.
     */
    last_message_author: null|string;

    /**
     * This constructor should basically never be called outside of the module.
     */
    constructor(page: Page, channel: Channel) {
        this.tab = document.createElement("button");
        this.tab.classList.add("channel-tab");
        this.tab.innerText = channel.name;
        this.tab.onclick = () => page.set_selected_channel(this);

        this.messages = document.createElement("div");

        this.last_message_author = null;
    }
}

/**
 * Stores references to some data associated with the page, as well as ways to manipulate it.
 */
export class Page {
    /**
     * The `<div>` that contains the channel tabs.
     */
    channel_tabs: Element;

    /**
     * The channel tab that currently selected. `null` if no channel is selected.
     */
    selected_channel: ChannelElement|null;

    /**
     * The `<div id="#chat-messages">` that contains the messages.
     */
    messages: Element;

    /**
     * Queries the document.
     */
    constructor() {
        this.channel_tabs = query_element("#chat-channels");
        this.selected_channel = null;
        this.messages = query_element("#chat-messages");

        // Make sure that the HTML is clean.
        //
        // TODO:
        //  Figure out whether we can remove this logic (in case we're sure that the HTML won't
        //  include any placeholder data).
        //  This code will always work, even in production and just acts as an additional check.
        while (this.channel_tabs.firstChild) {
            this.channel_tabs.firstChild.remove();
        }
        while (this.messages.firstChild) {
            this.messages.firstChild.remove();
        }
    }

    /**
     * Sets the currently selected channel.
     *
     * @param element
     */
    public set_selected_channel(element: ChannelElement|null) {
        if (this.selected_channel) {
            this.selected_channel.tab.classList.remove("active-channel-tab");
            this.selected_channel.messages.remove();

            this.selected_channel = null;
        }

        if (element) {
            element.tab.classList.add("active-channel-tab");
            this.messages.appendChild(element.messages);

            // FIXME:
            //  When we want to support upward scrolling, messages should be queried once here if
            //  we can fit some more.

            this.selected_channel = element;
        }
    }

    /**
     * Adds a channel to the list of channels.
     *
     * @param channel The channel object that will be represented on the page.
     */
    public add_channel(channel: Channel): ChannelElement {
        let element = new ChannelElement(this, channel);

        this.channel_tabs.appendChild(element.tab);

        return element;
    }

    /**
     * Adds a message.
     *
     * @param message The message object that will be represented on the page.
     */
    public add_message(channel: ChannelElement, message: Message) {
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
        header_and_content.appendChild(header);
        header_and_content.appendChild(content);
        const container = document.createElement("div");
        container.classList.add("message-container");
        container.appendChild(avatar);
        container.appendChild(header_and_content);

        // If the last child is the same author, add the `message-continuing` class.
        if (channel.last_message_author && channel.last_message_author == message.author_id) {
            container.classList.add("message-continuing");
        } else {
            channel.last_message_author = message.author_id;
        }

        channel.messages.appendChild(container);
    }
}
