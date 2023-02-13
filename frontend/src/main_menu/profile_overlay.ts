import { Client, Users } from "../api";
import { History, Overlay, State } from "../strawberry";
import { rank_to_image, ratio_to_rank } from "../utility";
import MAIN_MENU from "./main_menu";

class ProfileOverlay extends Overlay {
    private html: HTMLDivElement;

    public get parent_state(): State {
        return MAIN_MENU;
    }

    public constructor() {
        super();

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
        editor_email.onchange = e => {
            const new_mail = editor_email.value;

            editor_email.disabled = true;

            if (new_mail === "") {
                Client.deactivate_2fa().finally(() => {
                    editor_email.disabled = false;
                });
            } else {
                Client.activate_2fa(new_mail).then(() => {
                    let code = prompt("gimme the code");
                    if (!code) {
                        editor_email.value = "";
                        editor_email.disabled = false;
                        return;
                    }

                    Client.validate_2fa(code).catch(() => {
                        Users.me().then(me => {
                            if (me.email)
                                editor_email.value = me.email;
                        })
                    }).finally(() => {
                        editor_email.disabled = false;
                    });
                }).catch(() => {
                    editor_email.value = "";
                    editor_email.disabled = false;
                });
            }
        };

        const editor_email_label = document.createElement("div");
        editor_email_label.innerText = "2FA E-Mail";
        editor_email_label.classList.add("editor-field-label");
        editor_email_container.appendChild(editor_email_label);

        const game_history = document.createElement("ul");
        game_history.id = "profile-game-history";
        game_history.classList.add("custom-scrollbar");
        card.appendChild(game_history);

        Users.me().then((me) => {
            Users.get_avatar(me.id).then(url => {
                avatar.style.backgroundImage = `url(\"${url}\")`;
            });
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
                    Client.set_avatar(file);
                    const new_url = URL.createObjectURL(file);
                    Users.set_avatar(me.id, new_url);
                    avatar.style.backgroundImage = `url(\"${new_url}\")`;
                }
            };

            for (const result of me.games_played) {
                const my_idx = (me.id === result.players_ids[0]) ? 0 : 1;

                const game_container = document.createElement("li");
                game_container.classList.add("profile-game-container");
                game_history.prepend(game_container);

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
                    box_color.style.backgroundColor = "green";
                else
                    box_color.style.backgroundColor = "red";

                box_color.style.backgroundColor
                game_container.appendChild(box_color);

                const time = document.createElement("div");
                time.classList.add("profile-game-time");
                const date = new Date(result.date_time);
                time.innerText = `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
                game_container.appendChild(time);

                my_score.innerText = "" + result.scores[my_idx];
                Users.get_avatar(result.players_ids[my_idx]).then(url => {
                    my_avatar.style.backgroundImage = `url(\"${url}\")`;
                });
                their_score.innerText = "" + result.scores[1 - my_idx];
                Users.get_avatar(result.players_ids[1 - my_idx]).then(url => {
                    their_avatar.style.backgroundImage = `url(\"${url}\")`;
                });
                Users.get(result.players_ids[1 - my_idx]).then(u => {
                    their_name.innerText = u.name;
                });
            }
        });

        this.html.appendChild(container);
    }

    public get root_html_element(): HTMLElement {
        return this.html;
    }

    public get location(): string {
        return "/profile";
    }
}

const PROFILE_OVERLAY = new ProfileOverlay();
export default PROFILE_OVERLAY;