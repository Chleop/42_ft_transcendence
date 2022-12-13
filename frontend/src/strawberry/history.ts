/**
 * A state that may be saved in history.
 */
export abstract class State {
    /**
     * Indicates that the state has entered the history.
     */
    public abstract on_entered(): void;

    /**
     * The location associated with this state.
     *
     * When `null` is returned, the old location is preserved.
     */
    public abstract get location(): string|null;

    /**
     * Indicates that the state has been replaced by another.
     */
    public abstract on_left(): void;
}

/**
 * Returns an empty, default, state.
 */
export class EmptyState extends State {
    public on_entered(): void {}
    public get location(): string|null { return null; }
    public on_left(): void {}
    public on_buried(_beneath: State): void {}
    public on_replaced(_by: State): void {}
}

/**
 * Wraps methods to manipulate the history.
 */
export const History = (function() {
    class HistoryClass {
        /**
         * The current state.
         *
         * Note that we cannot use `window.history.state` because it is updated too soon
         * during the `onpopstate` event.
         */
        private current_state_: State;

        constructor() {
            window.onpopstate = (ev: PopStateEvent) => {
                const old_state = this.current_state_;

                old_state.on_left();
                if (ev.state instanceof State) {
                    this.current_state_ = ev.state;
                } else {
                    this.current_state_ = new EmptyState();
                }
                this.current_state_.on_entered();
            };

            this.current_state_ = new EmptyState();
        }

        /**
         * Go to a specific state, trying to burry the current one.
         */
        public push_state(new_state: State) {
            const old_state = this.current_state_;

            old_state.on_left();
            window.history.pushState(new_state, "", new_state.location);
            new_state.on_entered();
            this.current_state_ = new_state;
        }

        /**
         * Replaces the current state by another.
         */
        public replace_state(new_state: State) {
            const old_state = this.current_state_;

            old_state.on_left();
            window.history.pushState(new_state, "", new_state.location);
            new_state.on_entered();
            this.current_state_ = new_state;
        }

        /**
         * Pops the current state.
         */
        public pop_state() {
            const old_state = this.current_state_;
            window.history.back();
            old_state.on_left();

            if (window.history.state instanceof State) {
                this.current_state_ = window.history.state;
            } else {
                this.current_state_ = new EmptyState();
            }
        }

        /**
         * The current state.
         */
        public get current_state(): State {
            return this.current_state_;
        }
    }

    return new HistoryClass();
})();
