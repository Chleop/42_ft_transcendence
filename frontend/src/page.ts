import { Client } from "./api/Client";
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
interface ChannelElements {
    /**
     * The `<button>` element representing the tab.
     */
    tab: Element;
}

/**
 * Stores references to some data associated with the page, as well as ways to manipulate it.
 */
export class Page {
    /**
     * The `div` that contains the channel tabs.
     */
    channel_tabs: Element;

    /**
     * The channel tab that currently selected. `null` if no channel is selected.
     */
    selected_channel: ChannelElements|null;

    /**
     * Queries the document.
     */
    constructor() {
        this.channel_tabs = query_element("#chat-channels");
        this.selected_channel = null;

        // Make sure that the HTML is clean.
        while (this.channel_tabs.firstChild) {
            this.channel_tabs.firstChild.remove();
        }
    }

    /**
     * Sets the currently selected channel.
     *
     * @param elements
     */
    set_selected_channel(elements: ChannelElements) {
        if (this.selected_channel) {
            this.selected_channel.tab.classList.remove("active-channel-tab");
            this.selected_channel = null;
        }

        elements.tab.classList.add("active-channel-tab");
        this.selected_channel = elements;
    }

    /**
     * Adds a channel to the list of channels.
     *
     * @param name The name of the added channel.
     * @param select Whether the channel should take focus.
     * @param icon An optional icon ID for the added channel.
     */
    public add_channel(name: string, select: boolean, _icon?: AvatarId) {
        const tab = document.createElement("button");
        tab.innerText = name;
        tab.classList.add("channel-tab");

        const channel_elements = { tab };

        if (select) {
            this.set_selected_channel(channel_elements);
        }

        this.channel_tabs.appendChild(tab);
    }

    /**
     * Focuses the first channel in the list (if any channel is present!).
     */
    public focus_first_channel() {
        if (this.channel_tabs.firstElementChild) {
            this.set_selected_channel({ tab: this.channel_tabs.firstElementChild });
        }
    }
}
