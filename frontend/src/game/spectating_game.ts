import { Constants, OngoingGame, Paddle, } from ".";
import { SpecSocket, SpectatorRoomId, SpectatorStateUpdate } from "../api";
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

    /**
     * The ID of the room that we are spectating.
     */
    private room_id: SpectatorRoomId;

    /** Becomes `true` when the player left by himself. */
    private has_left: boolean;

    public constructor(room_id: SpectatorRoomId) {
        super();

        console.log(`spectating room '${room_id}'`);

        const socket = new SpecSocket(room_id);
        socket.on_connected = () => console.log(`connected to spectator socket`);
        socket.on_disconnected = () => this.on_disconnected();
        socket.on_update = st => this.on_spec_update(st);

        this.game_started = false;
        this.socket = socket;
        this.has_left = false;
        this.room_id = room_id;
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
        console.log("disconnected!");

        this.flow = "break";

        if (!this.has_left)
            History.go_back();
    }

    public tick(delta_time: number): void {
        if (!this.game_started)
            return; // The game has not started yet.

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
        return `/spectate/${this.room_id}`;
    }
}

function move_paddle(dt: number, paddle: Paddle) {
    paddle.position += dt * paddle.velocity;

    if (paddle.position - Constants.paddle_height / 2 < -Constants.board_height / 2) {
        paddle.position = -Constants.board_height / 2 + Constants.paddle_height / 2;
    }
    if (paddle.position + Constants.paddle_height / 2 >= Constants.board_height / 2) {
        paddle.position = Constants.board_height / 2 - Constants.paddle_height / 2;
    }
}
