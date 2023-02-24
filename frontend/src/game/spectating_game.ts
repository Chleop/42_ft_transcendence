import { Constants, OngoingGame, Paddle, SkinUrls } from ".";
import {
    Client,
    RoomData,
    ScoreStateUpdate,
    SpecSocket,
    SpectatorStateUpdate,
    User,
    UserId,
    Users,
} from "../api";
import { History } from "../strawberry";

/** An onging game that we are spectating. */
export class SpectatingGame extends OngoingGame {
    /**
     * Indicates whether the game has actually started or not.
     *
     * Before the server sent us the `gameStart` even, nothing moves on the board. This boolean
     * indicates that the even has been received and that we should start simulating.
     */
    private game_started: boolean;

    /**
     * The socket that's being used to play.
     */
    private socket: SpecSocket;

    public readonly overlay: HTMLDivElement;

    /**
     * The ID of the user that we are spectating.
     */
    private user_id: UserId;

    /** Becomes `true` when the player left by himself. */
    private has_left: boolean;

    private future_game: Promise<RoomData>;

    public constructor(user_id: UserId) {
        super();

        console.log(`spectating room '${user_id}'`);

        const socket = new SpecSocket(user_id);
        socket.on_connected = () =>
            console.log(`connected to spectator socket`);
        socket.on_disconnected = () => this.on_disconnected();
        socket.on_update = (st) => this.on_spec_update(st);
        socket.on_score_update = (st) => this.on_score_updated(st);


        this.game_started = false;
        this.socket = socket;
        this.has_left = false;
        this.user_id = user_id;

        this.overlay = document.createElement("div");
        this.overlay.id = "spectating-overlay";

        this.future_game = new Promise(resolve => {
            socket.on_room_data = data => {
                resolve(data);

                const left_player_container = document.createElement("div");
                left_player_container.classList.add("spectating-overlay-container");
                this.overlay.appendChild(left_player_container);

                const left_player_avatar = document.createElement("img");
                Users.invalidate_avatar(data.spectated.id);
                left_player_avatar.src = Users.get_avatar(data.spectated.id);
                left_player_container.appendChild(left_player_avatar);

                const left_player_name = document.createElement("div");
                left_player_name.innerText = data.spectated.name;
                left_player_container.appendChild(left_player_name);

                const right_player_container = document.createElement("div");
                right_player_container.classList.add("spectating-overlay-container");
                this.overlay.appendChild(right_player_container);


                const right_player_name = document.createElement("div");
                right_player_name.innerText = data.opponent.name;
                right_player_container.appendChild(right_player_name);

                const right_player_avatar = document.createElement("img");
                Users.invalidate_avatar(data.opponent.id);
                right_player_avatar.src = Users.get_avatar(data.spectated.id);
                right_player_container.appendChild(right_player_avatar);
            };
        });
    }

    private on_score_updated(state: ScoreStateUpdate) {
        this.state.left_paddle.score = state.you;
        this.state.right_paddle.score = state.opponent;
    }

    private on_spec_update(state: SpectatorStateUpdate) {
        this.state.left_paddle.position = state.player1.position;
        this.state.left_paddle.velocity = state.player1.velocity;
        this.state.right_paddle.position = state.player2.position;
        this.state.right_paddle.velocity = state.player2.velocity;
        this.state.ball.x = state.ball.x;
        this.state.ball.y = state.ball.y;
        this.state.ball.vx = state.ball.vx;
        this.state.ball.vy = state.ball.vy;
    }

    private on_disconnected() {
        console.log("disconnected from specatator!");

        this.flow = "break";

        if (!this.has_left) History.go_back();
    }

    public tick(delta_time: number): void {
        if (!this.game_started) return; // The game has not started yet.

        let s = this.state;

        // Update the position of the ball according to its velocity.
        s.ball.x += s.ball.vx * delta_time;
        s.ball.y += s.ball.vy * delta_time;

        // Make the ball "bounce" off walls. `Math.abs` is used everywhere to avoid having the ball
        // bounce multiple times on the same wall.
        if (s.ball.y - Constants.ball_radius < -Constants.board_height / 2) {
            s.ball.y = -Constants.board_height / 2 + Constants.ball_radius;
            s.ball.vy = Math.abs(s.ball.vy);
        }
        if (s.ball.y + Constants.ball_radius > Constants.board_height / 2) {
            s.ball.y = Constants.board_height / 2 - Constants.ball_radius;
            s.ball.vy = -Math.abs(s.ball.vy);
        }

        // Actually move the playerss.
        move_paddle(delta_time, this.state.left_paddle);
        move_paddle(delta_time, this.state.right_paddle);
    }

    public on_left(): void {
        console.log("disconnecting!");
        this.socket.disconnect();
        this.has_left = true;
    }

    public get location(): string {
        return `/spectate/${this.user_id}`;
    }

    public get_skins(): SkinUrls {
        return {
            left_background: this.future_game.then(d => Client.get_background(d.spectated.skin_id)),
            right_background: this.future_game.then(d => Client.get_background(d.opponent.skin_id)),
            left_paddle: this.future_game.then(d => Client.get_paddle(d.spectated.skin_id)),
            right_paddle: this.future_game.then(d => Client.get_paddle(d.opponent.skin_id)),
            left_ball: this.future_game.then(d => Client.get_ball(d.spectated.skin_id)),
            right_ball: this.future_game.then(d => Client.get_ball(d.opponent.skin_id)),
        };
    }
}

function move_paddle(dt: number, paddle: Paddle) {
    paddle.position += dt * paddle.velocity;

    if (
        paddle.position - Constants.paddle_height / 2 <
        -Constants.board_height / 2
    ) {
        paddle.position =
            -Constants.board_height / 2 + Constants.paddle_height / 2;
    }
    if (
        paddle.position + Constants.paddle_height / 2 >=
        Constants.board_height / 2
    ) {
        paddle.position =
            Constants.board_height / 2 - Constants.paddle_height / 2;
    }
}
