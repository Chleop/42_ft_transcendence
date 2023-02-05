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
     * The provided data will be turned into json.
     */
    public constructor(data: any) {
        super();

        this.data = JSON.stringify(data);
        this.content_type = "application/json";
    }
}

export class FileBody extends Body {
    public readonly data: BodyInit;
    public readonly content_type: string;

    public constructor(file: File) {
        super();

        this.data = file;
        this.content_type = file.type;
    }
}
