/** A value that will soon be available. */
export class Soon<T> {
    /** The stored value. */
    private value: T|null;

    public constructor() {
        this.value = null;
    }

    /** Resolves this `Soon<T>` to a value. */
    public resolve(value: T): void {
        this.value = value;
    }

    /** Waits until the value is available. */
    public async get(): Promise<T> {
        return new Promise(resolve => {
            const try_resolve = () => {
                if (this.value) {
                    resolve(this.value);
                    return true;
                } else {
                    setTimeout(try_resolve, 5);
                }
            };

            try_resolve();
        });
    }
}
