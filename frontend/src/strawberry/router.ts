/**
 * Describes the data extracted from a location matching a route.
 */
export type RouteData = Record<string, string>;

/**
 * A token that may be parsed out of a template.
 */
interface RouteToken {
    /**
     * The type of the token.
     */
    type: "keyword" | "field";

    /**
     * The data associated with the token.
     */
    data: string;
}

/**
 * Describes a route and how to match it.
 */
class RouteDescriptor {
    /**
     * The tokens used to parse this route.
     */
    private tokens: RouteToken[];

    /**
     * the complexity of this route descriptor.
     *
     * Routes with a greater complexity should be tried *before* routes with a lower complexity to
     * ensure that no ambiguities are encoutered.
     */
    private complexity_: number;

    /**
     * Creates a new `RouteDescriptor` instance from the provided route template.
     *
     * Each route is cut into segments, separated by `/` characters. If the segment starts with
     * `:`, then it is treated as a field rather than a regular keyword.
     */
    public constructor(template: string) {
        const segments = template.split('/');
        const tokens: RouteToken[] = [];
        let complexity = 0;

        for (const segment of segments) {
            if (segment.startsWith(':')) {
                tokens.push({
                    type: "field",
                    data: segment.substring(1),
                });
            } else {
                tokens.push({
                    type: "keyword",
                    data: segment,
                });

                complexity += 1;
            }

            complexity += 2;
        }

        this.tokens = tokens;
        this.complexity_ = complexity;
    }

    public get complexity(): number {
        return this.complexity_;
    }

    /**
     * Checks whether `location` matches this `RouteDescriptor`. If so, the data that could be
     * extracted from the route is returned. Otherwise, `null` is returned.
     */
    public matches(location: string): RouteData | null {
        const segments = location.split('/');

        if (segments.length != this.tokens.length)
            return null;

        let data: RouteData = {};
        for (let i = 0; i < segments.length; ++i) {
            const segment = segments[i];
            const token = this.tokens[i];

            if (token.type == "field") {
                data[token.data] = segment;
            } else {
                if (segment !== token.data) {
                    return null;
                }
            }
        }

        return data;
    }
}

/**
 * A route, associated with some data.
 */
interface Route<T> {
    /**
     * The descriptor of this route.
     */
    descriptor: RouteDescriptor;
    /**
     * Some metadata associated with the route.
     */
    metadata: T,
}

/**
 * A router, mapping routes to some data.
 */
export class Router<T> {
    /**
     * The routes that were registered.
     */
    private routes: Route<T>[];

    /**
     * Whether the `route` array is "dirty".
     *
     * When this is the case, it has to be sorted again by descending complexity.
     */
    private dirty: boolean;

    /**
     * Creates a new, emtpy, `Router`.
     */
    public constructor() {
        this.routes = [];
        this.dirty = false;
    }

    /**
     * Registers a new route.
     */
    public register_route(template: string, metadata: T) {
        this.routes.push({
            descriptor: new RouteDescriptor(template),
            metadata,
        });
        this.dirty = true;
    }

    /**
     * Tries to find a route to match `location`. If it is found, the result of the operation is
     * returned. Otherwise, `null` is returned.
     */
    public get(location: string): { meta: T, data: RouteData } | null {
        if (this.dirty) {
            this.routes.sort((a, b) => b.descriptor.complexity - a.descriptor.complexity);
            this.dirty = false;
        }

        for (const route of this.routes) {
            const data = route.descriptor.matches(location);
            if (data !== null) {
                return { meta: route.metadata, data };
            }
        }

        return null;
    }
}
