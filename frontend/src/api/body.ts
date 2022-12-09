/**
 * An interface for objects which can be sent through the network.
 */
export abstract class Body {
    /**
     * The data that will be sent.
     */
    public abstract get data(): BodyInit;
    /**
     * The MIME type of the data.
     */
    public abstract get content_type(): string;
}

/**
 * Some JSON data.
 */
export class JsonBody extends Body {
    /**
     * The JSON data.
     */
    public readonly data: string;
    /**
     * The content type for `JsonBody`.
     */
    public readonly content_type: string;

    /**
     * Creates a new `JsonBody` instance.
     *
     * @param data The data that will be turned into JSON.
     */
    public constructor(data: any) {
        super();

        this.data = JSON.stringify(data);
        this.content_type = "application/json";
    }
}
