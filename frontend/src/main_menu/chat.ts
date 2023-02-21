import {Channel, ChannelId, Message, Client, Users, UserId, User} from "../api";
import GATEWAY from "../api/gateway";
import {NOTIFICATIONS} from "../notification";
import CHANNEL_LIST from "./channel_list";
import CHANNEL_SETTINGS from "./channel_settings";
import USER_CARD from "./user_card";

function should_continuing(prev: Message, next: Message): boolean {
	return (
		prev.senderId === next.senderId &&
		Date.parse(next.dateTime) - Date.parse(prev.dateTime) < 10 * 1000
	);
}

/**
 * A message that has been instanciated in the DOM.
 */
class MessageElementInternal {
	/**
	 * The `<div>` that contains the whole message.
	 */
	public container: HTMLDivElement;

	public model: Message;

	/**
	 * This constructor should basically never be called outside of the module.
	 */
	public constructor(continuing: boolean, message: Message, channel: Channel | null) {
		this.model = message;
		const avatar = document.createElement("avatar");
		avatar.classList.add("message-avatar");
		Users.get_avatar(message.senderId).then((url) => {
			avatar.style.backgroundImage = `url(\"${url}\")`;
		});
		avatar.onclick = () =>
			Users.get(message.senderId).then((user) => USER_CARD.show(avatar, user, channel));
		const author = document.createElement("button");
		author.classList.add("message-author");
		author.onclick = () =>
			Users.get(message.senderId).then((user) => USER_CARD.show(author, user, channel));
		Users.get(message.senderId).then((user) => (author.innerText = user.name));
		const time = document.createElement("div");
		time.classList.add("message-time");
		time.innerText = new Date(message.dateTime).toLocaleString();
		const header = document.createElement("div");
		header.classList.add("message-header");
		header.appendChild(author);
		header.appendChild(time);
		const content = document.createElement("div");
		content.classList.add("message-content");
		const header_and_content = document.createElement("div");
		header_and_content.classList.add("message-header-and-content");
		header_and_content.appendChild(header);
		header_and_content.appendChild(content);
		this.container = document.createElement("div");
		this.container.classList.add("message-container");
		this.container.appendChild(avatar);
		this.container.appendChild(header_and_content);

		Users.me().then((me) => {
			if (me.blocked_ids.indexOf(message.senderId) !== -1)
				content.innerText = "<blocked message>";
			else content.innerText = message.content;
		});

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
export class ChannelElement {
	/**
	 * The `<button>` element representing the tab.
	 */
	public tab: HTMLButtonElement;
	/**
	 * The `<div>` messages that were sent in the channel. This element is the only child of
	 * the `<div id="#chat-messages">` container.
	 */
	public messages: HTMLDivElement;

	public last_message: Message | null;

	public my_last_message: string | null = null;

	public model: Channel | null;
	public dm: User | null;

	public oldest_message: MessageElementInternal | null;

	/**
	 * The saved value of the input field (if the user left the channel without clearing the
	 * prompt).
	 */
	public input: string;

	public no_more_messages: boolean;
	public requesting_more: boolean;

	public unsub: undefined | (() => void);

	public async fill_to_top(container: HTMLElement) {
		if (this.no_more_messages || this.requesting_more) return;

		this.requesting_more = true;

		while (
			!this.no_more_messages &&
			container.scrollHeight + container.scrollTop < 2 * container.clientHeight
		) {
			const QUERY_SIZE: number = 30;

			let messages;
			if (this.model) {
				if (this.oldest_message) {
					messages = await Client.messages_before(
						this.model.id,
						this.oldest_message.model.id,
						QUERY_SIZE,
					);
				} else {
					messages = await Client.last_messages(this.model.id, QUERY_SIZE);
				}
			}
			if (this.dm) {
				if (this.oldest_message) {
					messages = await Client.direct_messages_before(
						this.dm.id,
						this.oldest_message.model.id,
						QUERY_SIZE,
					);
				} else {
					messages = await Client.last_direct_messages(this.dm.id, QUERY_SIZE);
				}
			}

			if (!messages) return;

			if (messages.length < QUERY_SIZE) this.no_more_messages = true;

			messages.reverse();
			for (const msg of messages) {
				this.unshift_message(msg);
			}
		}

		this.requesting_more = false;
	}

	public unshift_message(message: Message): MessageElementInternal {
		if (this.oldest_message && should_continuing(message, this.oldest_message.model)) {
			this.oldest_message.container.classList.add("message-continuing");
		}
		const elem = new MessageElementInternal(false, message, this.model);
		this.messages.prepend(elem.container);
		this.oldest_message = elem;
		return elem;
	}

	public push_message(message: Message): MessageElementInternal {
		const cont = !!this.last_message && should_continuing(this.last_message, message);
		const elem = new MessageElementInternal(cont, message, this.model);
		this.messages.append(elem.container);
		this.last_message = message;
		return elem;
	}

	public update_model(model: Channel) {
		if (!this.model) throw "unreachable code";

		this.model = model;
		this.tab.innerText = model.name;
	}

	public update_dm(dm: User) {
		if (!this.dm) throw "unreachable code";

		this.dm = dm;
		this.tab.innerText = dm.name;
	}

	/**
	 * This constructor should basically never be called outside of the module.
	 */
	public constructor(
		container: ChatElement,
		model: Channel | null,
		dm: User | null,
		chat: ChatElement,
	) {
		this.tab = document.createElement("button");
		this.tab.classList.add("channel-tab");
		if (model) this.tab.innerText = model.name;
		if (dm) this.tab.innerText = dm.name;
		this.tab.onclick = () => container.set_selected_channel(this);
		this.tab.onauxclick = (ev) => {
			if (ev.button === 1) {
				ev.preventDefault();
				ev.stopPropagation();
			}
		};
		this.tab.onmousedown = (ev) => {
			if (ev.button === 1) {
				ev.preventDefault();
				ev.stopPropagation();
			}
		};
		this.tab.onmouseup = (ev) => {
			if (ev.button === 1) {
				if (this.model) {
					Client.leave_channel(this.model.id).then(() => {
						chat.remove_channel(this);
					});
				}
				if (this.dm) {
					chat.remove_channel(this);
				}

				ev.preventDefault();
				ev.stopPropagation();
			}
		};

		this.messages = document.createElement("div");

		this.last_message = null;

		this.input = "";
		this.model = model;
		this.dm = dm;

		this.oldest_message = null;
		this.requesting_more = false;
		this.no_more_messages = false;

		if (dm) {
			this.unsub = Users.subscribe(dm.id, (usr) => {
				this.tab.innerText = usr.name;
			});
		}
	}
}

/**
 * A channel that has been instanciated.
 */
export interface ChannelElement {}

/**
 * Stores the state of the chat.
 */
class ChatElement {
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
	private selected_channel: null | ChannelElement;

	/** The channels elements. */
	private channel_elements: ChannelElement[];

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
		create_channel_button.onclick = () => {
			CHANNEL_LIST.show(create_channel_button);
		};
		create_channel_container.appendChild(create_channel_button);

		this.messages = document.createElement("div");
		this.messages.id = "chat-messages";
		this.messages.classList.add("custom-scrollbar");
		this.container.appendChild(this.messages);
		this.messages.onscroll = () => {
			if (this.selected_channel) this.selected_channel.fill_to_top(this.messages);
		};

		const send_message_container = document.createElement("div");
		send_message_container.id = "chat-send-message-container";
		this.container.appendChild(send_message_container);

		const channel_settings_button = document.createElement("button");
		channel_settings_button.id = "chat-settings-button";
		channel_settings_button.classList.add("circle-button");
		channel_settings_button.onclick = () => {
			if (!this.selected_channel) return;
			if (this.selected_channel.model) {
				const selected_channel = this.selected_channel; // this is a data race! Yay!!
				Users.me().then((me) => {
					CHANNEL_SETTINGS.show(channel_settings_button, me, selected_channel);
				});
			}
		};
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
		this.message_input.onkeydown = (ev) => {
			if (ev.key === "Enter") {
				this.send_message_input();
			} else if (ev.key === "ArrowUp") {
				if (
					this.selected_channel &&
					this.selected_channel.my_last_message &&
					this.message_input.value === ""
				) {
					this.message_input.value = this.selected_channel.my_last_message;
					ev.preventDefault();
				}
			}
		};
		send_message_container.appendChild(this.message_input);

		this.selected_channel = null;
		this.channel_elements = [];

		let my_id: UserId | undefined;
		Users.me().then((me) => (my_id = me.id));

		GATEWAY.on_message = (msg: Message) => {
			if (msg.channelId) {
				let ch = this.get_channel(msg.channelId);
				if (ch) {
					this.add_message(ch, msg);
				} else {
					console.warn(`received a message not meant to me:`, msg);
				}
			}
			if (msg.receiverId) {
				let ch;
				if (my_id === msg.senderId) ch = this.get_dm_channel(msg.receiverId);
				else ch = this.get_dm_channel(msg.senderId);
				if (ch) {
					this.add_message(ch, msg);
				} else {
					Users.get(msg.senderId).then((sender) => {
						this.get_or_create_dm_channel(sender);
					});
				}
			}
		};

		GATEWAY.on_user_banned = (channel_id: ChannelId) => {
			const ch = this.get_channel(channel_id);
			if (ch) {
				this.remove_channel(ch);
			}
		};

		GATEWAY.on_channel_update = (channel: Channel) => {
			this.update_channel(channel);
		};
	}

	/**
	 * Sets the currently selected channel.
	 */
	public set_selected_channel(element: ChannelElement | null) {
		const element_ = element as ChannelElement | null;

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

			this.selected_channel = element_;

			this.message_input.value = element_.input;
			this.message_input.focus();

			element_.fill_to_top(this.messages);
		} else {
			while (this.messages.firstChild) this.messages.firstChild.remove();
		}
	}

	/**
	 * Adds a channel to the list of channels.
	 */
	public add_channel(channel: Channel): ChannelElement {
		let element = new ChannelElement(this, channel, null, this);

		this.channel_tabs.appendChild(element.tab);

		// Try to get the twenty last messages of the channel.
		// Client.last_messages(channel.id, 50).then((messages) => {
		//     for (const m of messages) {
		//         this.add_message(element, m);
		//     }
		// });

		this.channel_elements.push(element);
		return element;
	}

	public remove_channel(channel: ChannelElement) {
		const index = this.channel_elements.indexOf(channel);
		if (index === -1) throw new Error("Trying a remove a channel that does not exist.");
		channel.tab.remove();
		if (channel.unsub) channel.unsub();
		this.channel_elements.splice(index, 1);
		if (!this.selected_channel) return;
		if (
			this.selected_channel.model &&
			channel.model &&
			this.selected_channel.model.id !== channel.model.id
		)
			return;
		if (this.selected_channel.dm && channel.dm && this.selected_channel.dm.id !== channel.dm.id)
			return;
		if (this.channel_elements.length > 0) this.set_selected_channel(this.channel_elements[0]);
		else this.set_selected_channel(null);
	}

	/** Returns a channel element by ID */
	public get_channel(channel: ChannelId): undefined | ChannelElement {
		return this.channel_elements.find((e) => e.model && e.model.id === channel);
	}

	public get_dm_channel(user: UserId): undefined | ChannelElement {
		return this.channel_elements.find((e) => e.dm && e.dm.id === user);
	}

	public get_or_create_dm_channel(user: User): ChannelElement {
		const ch = this.get_dm_channel(user.id);
		if (ch) return ch;

		let element = new ChannelElement(this, null, user, this);

		this.channel_tabs.appendChild(element.tab);

		// Try to get the twenty last messages of the channel.
		// TODO: get the last messages of the DM channel.
		// Client.last_messages(channel.id, 50).then(messages => {
		//     for (const m of messages) {
		//         this.add_message(element, m);
		//     }
		// });

		this.channel_elements.push(element);
		return element;
	}

	/**
	 * Adds a message to a specific channel.
	 */
	public add_message(channel: ChannelElement, message: Message): MessageElement {
		const channel_ = channel as ChannelElement;
		return channel_.push_message(message);
	}

	/**
	 * Sends the content of the `<input id="chat-send-message">` to the currently selected
	 * channel, and through the network.
	 */
	public async send_message_input(): Promise<void> {
		if (!this.selected_channel) {
			return;
		}

		// Do nothing if the input contains nothing.
		if (!this.message_input.value) {
			return;
		}

		const content = this.message_input.value.trim();
		this.message_input.value = "";

		if (content === "") {
			return;
		}

		this.selected_channel.my_last_message = content;
		if (this.selected_channel.model)
			await Client.send_message(this.selected_channel.model.id, content).catch(() => {
				NOTIFICATIONS.spawn_notification(
					"red",
					"your are not allowed to speak in this channel",
				);
			});
		if (this.selected_channel.dm) {
			await Client.send_dm(this.selected_channel.dm.id, content);
			// TODO:
			//  Put the message itself.
		}
	}

	public update_channel(channel: Channel) {
		const ch = this.get_channel(channel.id);
		if (!ch) return;
		ch.update_model(channel);
	}

	/**
	 * Returns the root node of this element.
	 */
	public get html(): HTMLElement {
		return this.container;
	}
}

const CHAT_ELEMENT = new ChatElement();
export default CHAT_ELEMENT;
