import { Client, UnexpectedStatusCode, Users } from "../api";
import { NOTIFICATIONS } from "../notification";
import { History, Overlay, State } from "../strawberry";
import { rank_to_image, ratio_to_rank } from "../utility";
import MAIN_MENU from "./main_menu";

class ProfileOverlay extends Overlay {
    private html: HTMLDivElement;

    private current_skin: HTMLButtonElement;

    private game_history: HTMLDListElement;

    public get parent_state(): State {
        return MAIN_MENU;
    }

    public constructor() {
        super();

        this.current_skin = document.createElement("button");

        this.html = document.createElement("div");
        this.html.id = "profile";
        this.html.onclick = e => {
            if (e.target === this.html) {
                History.go_back();
            }
        };

        const container = document.createElement("div");
        container.id = "profile-container";

        const card = document.createElement("div");
        card.id = "profile-card";
        container.appendChild(card);

        const header = document.createElement("div");
        header.id = "profile-header";
        card.appendChild(header);

        const avatar = document.createElement("div");
        avatar.id = "profile-avatar";
        const avatar_input = document.createElement("input");
        avatar_input.type = "file";
        avatar_input.accept = "image/*";
        avatar.onclick = () => avatar_input.click();
        header.appendChild(avatar);

        const header_info = document.createElement("div");
        header_info.id = "profile-header-info";
        header.appendChild(header_info);

        const name = document.createElement("div");
        name.id = "profile-name";
        header_info.appendChild(name);

        const stats = document.createElement("div");
        stats.id = "profile-stats";
        header_info.appendChild(stats);

        const rank = document.createElement("div");
        rank.id = "profile-stats-rank";
        stats.appendChild(rank);

        const scores = document.createElement("div");
        scores.id = "profile-stats-scores";
        stats.appendChild(scores);

        const editor = document.createElement("div");
        editor.id = "editor";
        card.appendChild(editor);

        const editor_name_container = document.createElement("div");
        editor_name_container.classList.add("editor-field-container");
        editor.appendChild(editor_name_container);

        const editor_name = document.createElement("input");
        editor_name.classList.add("editor-field");
        editor_name.type = "text";
        editor_name.onchange = () => {
            const new_name = editor_name.value;

            if (new_name !== "") {
                editor_name.disabled = true;
                Client.patch_user({
                    name: new_name,
                }).then(() => {
                    editor_name.disabled = false;
                    name.innerText = new_name;
                    Users.patch_name(null, new_name);
                });
            }
        }
        editor_name_container.appendChild(editor_name);

        const editor_name_label = document.createElement("div");
        editor_name_label.innerText = "Display Name";
        editor_name_label.classList.add("editor-field-label");
        editor_name_container.appendChild(editor_name_label);

        const editor_email_container = document.createElement("div");
        editor_email_container.classList.add("editor-field-container");
        editor.appendChild(editor_email_container);

        const editor_email = document.createElement("input");
        editor_email.type = "text";
        editor_email.classList.add("editor-field");
        editor_email_container.appendChild(editor_email);
        editor_email.onchange = () => {
            const new_mail = editor_email.value;

            editor_email.disabled = true;

            if (new_mail === "") {
                Client.deactivate_2fa().catch(() => {
                    NOTIFICATIONS.spawn_notification("red", "failed to deactivate 2FA");
                });
                editor_email.disabled = false;
            } else {
                Client.activate_2fa(new_mail).then(() => {
                    while (true) {
                        let code = prompt("gimme the code");
                        if (!code) {
                            continue;
                        }

                        Client.validate_2fa(code).then(() => {
                            NOTIFICATIONS.spawn_notification("green", "2FA e-mail changed!");

                            Users.me().then(me => {
                                if (me.email)
                                    me.email = editor_email.value;
                            });
                        }).catch(() => {
                            Users.me().then(me => {
                                if (me.two_fact_auth && me.email)
                                    editor_email.value = me.email;
                                else
                                    editor_email.value = "";
                            });

                            NOTIFICATIONS.spawn_notification("red", "invalid 2FA code");
                        });
                        editor_email.disabled = false;

                        break;
                    }
                }).catch(() => {
                    Users.me().then(me => {
                        if (me.two_fact_auth && me.email)
                            editor_email.value = me.email;
                        else
                            editor_email.value = "";
                    });
                    editor_email.disabled = false;

                    NOTIFICATIONS.spawn_notification("red", "invalid EMAIL");
                });
            }
        };

        const editor_email_label = document.createElement("div");
        editor_email_label.innerText = "2FA E-Mail";
        editor_email_label.classList.add("editor-field-label");
        editor_email_container.appendChild(editor_email_label);

        const skin_picker = document.createElement("div");
        skin_picker.id = "profile-skin-picker";

        card.appendChild(skin_picker);

        const game_history = document.createElement("ul");
        game_history.id = "profile-game-history";
        game_history.classList.add("custom-scrollbar");
        card.appendChild(game_history);

        Users.me().then((me) => {
            Client.get_all_skins().then(skins => {
                for (const skin of skins) {
                    const skin_button = document.createElement("button");
                    skin_button.classList.add("profile-skin-button");

                    if (skin.id === me.skin_id) {
                        skin_button.classList.add("profile-current-skin");
                        this.current_skin = skin_button;
                    }

                    const content = document.createElement("div");
                    content.classList.add("profile-skin-content");
                    content.innerText = skin.name;
                    skin_button.appendChild(content);

                    Client.get_background(skin.id).then(url => {
                        skin_button.style.backgroundImage = `url('${url}')`;
                    });

                    skin_picker.appendChild(skin_button);

                    skin_button.onclick = () => {
                        Client.patch_user({
                            skin_id: skin.id,
                        }).then(() => {
                            this.current_skin.classList.remove("profile-current-skin");
                            this.current_skin = skin_button;
                            this.current_skin.classList.add("profile-current-skin");

                            me.skin_id = skin.id;
                        });
                    };
                }
            });

            avatar.style.backgroundImage = `url(\"${Users.get_avatar(me.id)}\")`;
            name.innerText = me.name;

            let wins = 0;
            let losses = 0;
            for (const game of me.games_played) {
                if (game.winner_id === me.id) {
                    wins += 1;
                } else {
                    losses += 1;
                }
            }

            rank.style.backgroundImage = `url('${rank_to_image(ratio_to_rank(wins, losses))}')`;
            scores.innerText = `${wins} W / ${losses} L`;

            editor_name.value = me.name;
            if (me.two_fact_auth && me.email) {
                editor_email.value = me.email;
            } else {
                editor_email.value = "";
            }

            avatar_input.onchange = () => {
                if (avatar_input.files && avatar_input.files[0]) {
                    const file = avatar_input.files[0];
                    Client.set_avatar(file).then(() => {
                        const new_url = URL.createObjectURL(file);
                        // Users.set_avatar(me.id, new_url);
                        avatar.style.backgroundImage = `url(\"${new_url}\")`;
                    }).catch((e) => {
                        if (e instanceof UnexpectedStatusCode)
                            NOTIFICATIONS.spawn_notification("red", e.message || "failed to set the avatar");
                    });
                }
            };

        });

        this.html.appendChild(container);

        this.game_history = game_history;
    }

    public on_entered(prev: State): void {
        while (this.game_history.firstChild)
            this.game_history.firstChild.remove();

        Users.me().then((me) => {
            for (const result of me.games_played) {
                const my_idx = (me.id === result.players_ids[0]) ? 0 : 1;

                const game_container = document.createElement("li");
                game_container.classList.add("profile-game-container");
                this.game_history.prepend(game_container);

                const my_avatar = document.createElement("div");
                my_avatar.classList.add("profile-game-avatar");
                game_container.appendChild(my_avatar);

                const my_score = document.createElement("div");
                my_score.classList.add("profile-game-score");
                game_container.appendChild(my_score);

                const separator = document.createElement("div");
                separator.classList.add("profile-game-separator");
                separator.innerText = "-";
                game_container.appendChild(separator);

                const their_score = document.createElement("div");
                their_score.classList.add("profile-game-score");
                game_container.appendChild(their_score);

                const their_avatar = document.createElement("div");
                their_avatar.classList.add("profile-game-avatar");
                game_container.appendChild(their_avatar);

                const their_name = document.createElement("div");
                their_name.classList.add("profile-game-their-name");
                game_container.appendChild(their_name);

                const box_color = document.createElement("div");
                box_color.classList.add("profile-game-box-color");
                if (result.winner_id === me.id)
                    box_color.style.backgroundColor = "#44FF66";
                else
                    box_color.style.backgroundColor = "#FF4444";

                box_color.style.backgroundColor
                game_container.appendChild(box_color);

                const time = document.createElement("div");
                time.classList.add("profile-game-time");
                const date = new Date(result.date_time);
                time.innerText = `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
                game_container.appendChild(time);

                my_score.innerText = "" + result.scores[my_idx];
                my_avatar.style.backgroundImage = `url(\"${Users.get_avatar(result.players_ids[my_idx])}\")`;
                their_score.innerText = "" + result.scores[1 - my_idx];
                their_avatar.style.backgroundImage = `url(\"${Users.get_avatar(result.players_ids[1 - my_idx])}\")`;
                Users.get(result.players_ids[1 - my_idx]).then(u => {
                    their_name.innerText = u.name;
                });
            }
        });

        super.on_entered(prev);
    }

    public get root_html_element(): HTMLElement {
        return this.html;
    }

    public get location(): string {
        return "/profile";
    }
}

let PROFILE_OVERLAY = new ProfileOverlay();
export default PROFILE_OVERLAY;
