/**
 * A state that may be saved in history.
 */
export abstract class State {
    /**
     * Indicates that the state has entered the history.
     */
    public abstract on_entered(prev: State): void;

    /**
     * The location associated with this state.
     *
     * When `null` is returned, the old location is preserved.
     */
    public abstract get location(): string | null;

    /**
     * Indicates that the state has been replaced by another.
     */
    public abstract on_left(next: State): void;
}

/**
 * Returns an empty, default, state.
 */
export class EmptyState extends State {
    public on_entered(): void { }
    public get location(): string | null { return null; }
    public on_left(): void { }
    public on_buried(_beneath: State): void { }
    public on_replaced(_by: State): void { }
}

/**
 * Wraps methods to manipulate the history.
 */
export const History = (function() {
    class HistoryClass {
        /**
         * The current state stack. It's not possible to use the window's state system because it
         * wants to clone the states for some reason.
         */
        private state_stack: State[];

        /**
         * The current index within the state stack.
         */
        private state_stack_index: number;

        public default_state: State | null = null;

        /**
         * Creates a new `HistoryClass` instance.
         */
        constructor() {
            window.onpopstate = (ev: PopStateEvent) => {
                const old_state = this.state_stack[this.state_stack_index];

                if (typeof ev.state === "number")
                    this.state_stack_index = ev.state;
                if (this.state_stack_index < this.state_stack.length) {
                    old_state.on_left(this.current_state);
                    this.current_state.on_entered(old_state);
                }

                console.log("going to state: ", this.current_state.location);
            };

            this.state_stack = [new EmptyState()];
            this.state_stack_index = 0;
        }

        /**
         * Go to a specific state, trying to burry the current one.
         */
        public push_state(new_state: State) {
            console.log("pushing state: " + new_state.location);

            const new_state_index = this.state_stack_index + 1;

            const old_state = this.current_state;
            while (this.state_stack.length != new_state_index)
                this.state_stack.pop();

            window.history.pushState(new_state_index, "", new_state.location);
            this.state_stack.push(new_state);
            this.state_stack_index = new_state_index;
            old_state.on_left(new_state);
            new_state.on_entered(old_state);
        }

        /**
         * Replaces the current state by another.
         */
        public replace_state(new_state: State) {
            console.log("replacing state: " + new_state.location);

            const old_state = this.current_state;

            window.history.replaceState(this.state_stack_index, "", new_state.location);
            this.state_stack[this.state_stack_index] = new_state;
            old_state.on_left(new_state);
            new_state.on_entered(old_state);
        }

        /**
         * Pops the current state.
         */
        public go_back() {
            console.log("going back");

            if (this.state_stack_index == 0) {
                if (this.default_state)
                    this.replace_state(this.default_state);
                return;
            }

            // const prev_state = this.state_stack[this.state_stack_index];
            // const new_state = this.state_stack[this.state_stack_index - 1];

            // prev_state.on_left(new_state);
            window.history.back();
            // this.state_stack_index -= 1;
            // new_state.on_entered(prev_state);
        }

        /**
         * The current state.
         */
        public get current_state(): State {
            return this.state_stack[this.state_stack_index];
        }
    }

    return new HistoryClass();
})();
