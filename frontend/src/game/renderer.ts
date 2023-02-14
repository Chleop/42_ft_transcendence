import { hitbox_fragment_shader_source, hitbox_vertex_shader_source } from "./hitbox_shader";
import { image_fragment_shader_source, image_vertex_shader_source } from "./image_shader";
import { sprite_fragment_shader_source, sprite_vertex_shader_source } from "./sprite_shader";
import { warp_fragment_shader_source, warp_vertex_shader_source } from "./warp_shader";
import { wtf_fragment_shader_source, wtf_vertex_shader_source } from "./wtf_shader";

/**
 * An exception which indicates that the WebGL2 renderer produced an error.
 */
export class RendererError {
    /**
     * Some additional information about the error.
     */
    context: string;

    /**
     * Creates a new `RendererInitError` exception.
     */
    constructor(context: string) {
        this.context = context;
    }
}

/**
 * Creates a new shader, properly handling errors.
 */
function create_shader(gl: WebGL2RenderingContext, source: string, type: GLenum): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new RendererError("failed to create a shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success)
        throw new RendererError(gl.getShaderInfoLog(shader) || "");

    return shader;
}

/**
 * Creates a new shader program, properly handling errors.
 */
function create_program(gl: WebGL2RenderingContext, vertex_source: string, fragment_source: string): WebGLProgram {
    const vertex_shader = create_shader(gl, vertex_source, gl.VERTEX_SHADER);
    const fragment_shader = create_shader(gl, fragment_source, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new RendererError("failed to create a shader program");
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success)
        throw new RendererError(gl.getProgramInfoLog(program) || "");

    return program;
}

/**
 * Gets the location of a uniform.
 */
function get_uniform_location(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
    const location = gl.getUniformLocation(program, name);
    if (!location)
        throw new RendererError(`could not find uniform '${name}' in shader program`);
    return location;
}

export class Framebuffer implements WithTexture {
    public texture: WebGLTexture;
    public width: number;
    public height: number;
    public framebuffer: WebGLFramebuffer;

    public constructor(gl: WebGL2RenderingContext, w: number, h: number) {
        const tex = gl.createTexture();
        if (!tex)
            throw new RendererError("failed to create a framebuffer texture");
        const f = gl.createFramebuffer();
        if (!f)
            throw new RendererError("failed to create the framebuffer");

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

        this.texture = tex;
        this.framebuffer = f;
        this.width = w;
        this.height = h;
    }
}

interface WithTexture {
    readonly texture: WebGLTexture;
}

/**
 * Internal information about a sprite.
 */
export class Sprite implements WithTexture {
    /**
     * The texture.
     */
    public texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, albedo: string) {
        const texture = gl.createTexture();
        if (!texture)
            throw new RendererError(`failed to create texture for '${albedo}'`);

        // Temporarily use a white pixel for the image and start loading the true image.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        const image = new Image();
        image.src = albedo;
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);

            console.log(`loaded image '${image.src}' (${image.width}x${image.height})`);
        };

        this.texture = texture;
    }
}

/**
 * The renderer wraps functions to draw on the canvas.
 */
export class Renderer {
    /**
     * The rendering context, probably tied to an existing canvas.
     */
    private gl: WebGL2RenderingContext;

    /**
     * The shader program used to render sprites.
     */
    private sprite_program: WebGLProgram;

    /**
     * The location of `uniform vec2 model_position` in the vertex shader.
     */
    private sprite_uniform_model_position: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 model_transform` in the vertex shader.
     */
    private sprite_uniform_model_transform: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 view_transform` in the vertex shader.
     */
    private sprite_uniform_view_transform: WebGLUniformLocation;


    /**
     * The shader program used to render hitboxes.
     */
    private hitbox_program: WebGLProgram;

    /**
     * The location of `uniform vec2 model_position` in the vertex shader.
     */
    private hitbox_uniform_model_position: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 model_transform` in the vertex shader.
     */
    private hitbox_uniform_model_transform: WebGLUniformLocation;
    /**
     * The location of `uniform mat2 view_transform` in the vertex shader.
     */
    private hitbox_uniform_view_transform: WebGLUniformLocation;

    private image_program: WebGLProgram;
    
    private warp_program: WebGLProgram;

    private warp_uniform_screen: WebGLUniformLocation;

    private wtf_program: WebGLProgram;
    private wtf_uniform_screen: WebGLUniformLocation;

    private canvas_width: number;
    private canvas_height: number;

    /**
     * The view matrix.
     */
    private view_matrix: number[];

    /**
     * Creates a new renderer.
     */
    public constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.gl.clearColor(0, 0, 0, 0);

        console.log("loading shader programs...");
        this.sprite_program = create_program(this.gl, sprite_vertex_shader_source, sprite_fragment_shader_source);
        this.sprite_uniform_model_position = get_uniform_location(this.gl, this.sprite_program, "model_position");
        this.sprite_uniform_model_transform = get_uniform_location(this.gl, this.sprite_program, "model_transform");
        this.sprite_uniform_view_transform = get_uniform_location(this.gl, this.sprite_program, "view_transform");
        this.hitbox_program = create_program(this.gl, hitbox_vertex_shader_source, hitbox_fragment_shader_source);
        this.hitbox_uniform_model_position = get_uniform_location(this.gl, this.hitbox_program, "model_position");
        this.hitbox_uniform_model_transform = get_uniform_location(this.gl, this.hitbox_program, "model_transform");
        this.hitbox_uniform_view_transform = get_uniform_location(this.gl, this.hitbox_program, "view_transform");
        this.image_program = create_program(this.gl, image_vertex_shader_source, image_fragment_shader_source);
        this.warp_program = create_program(this.gl, warp_vertex_shader_source, warp_fragment_shader_source);
        this.warp_uniform_screen = get_uniform_location(this.gl, this.warp_program, "screen");
        this.wtf_program = create_program(this.gl, wtf_vertex_shader_source, wtf_fragment_shader_source);
        this.wtf_uniform_screen = get_uniform_location(this.gl, this.wtf_program, "screen");

        this.canvas_width = 1;
        this.canvas_height = 1;

        this.view_matrix = [1, 0, 0, 1];
    }

    /**
     * Notifies the renderer that the size of the canvas changed.
     *
     * @param width The new width of the canvas.
     * @param height The new height of the canvas.
     */
    public notify_size_changed(width: number, height: number): void {
        this.canvas_width = width;
        this.canvas_height = height;
    }

    /** Sets the global view matrix. */
    public set_view_matrix(a: number, b: number, c: number, d: number): void {
        this.view_matrix = [a, b, c, d];
    }

    /**
     * Creates a new `Sprite` for this renderer.
     */
    public create_sprite(albedo: string): Sprite {
        return new Sprite(this.gl, albedo);
    }

    /**
     * Clears the screen with a specific color.
     */
    public clear(red: number, green: number, blue: number) {
        this.gl.clearColor(red, green, blue, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    /**
     * Draws a sprite.
     */
    public draw_sprite(sprite: WithTexture, x: number, y: number, w: number, h: number): void {
        this.gl.useProgram(this.sprite_program);
        this.gl.uniform2f(this.sprite_uniform_model_position, x, y);
        this.gl.uniformMatrix2fv(this.sprite_uniform_model_transform, false, [w, 0, 0, h]);
        this.gl.uniformMatrix2fv(this.sprite_uniform_view_transform, false, this.view_matrix);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, sprite.texture);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public draw_hitbox(x: number, y: number, w: number, h: number) {
        this.gl.useProgram(this.hitbox_program);
        this.gl.uniform2f(this.hitbox_uniform_model_position, x, y);
        this.gl.uniformMatrix2fv(this.hitbox_uniform_model_transform, false, [w, 0, 0, h]);
        this.gl.uniformMatrix2fv(this.hitbox_uniform_view_transform, false, this.view_matrix);
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, 5);
    }

    public draw_image(image: WithTexture) {
        this.gl.useProgram(this.image_program);
        this.gl.bindTexture(this.gl.TEXTURE_2D, image.texture);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public warp(sprite: WithTexture, width: number, height: number) {
        this.gl.useProgram(this.warp_program);
        this.gl.bindTexture(this.gl.TEXTURE_2D, sprite.texture);
        this.gl.uniform2f(this.warp_uniform_screen, width, height);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public wtf(sprite: WithTexture, width: number, height: number) {
        this.gl.useProgram(this.wtf_program);
        this.gl.bindTexture(this.gl.TEXTURE_2D, sprite.texture);
        this.gl.uniform2f(this.wtf_uniform_screen, width, height);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public create_framebuffer(width: number, height: number): Framebuffer {
        return new Framebuffer(this.gl, width, height);
    }

    public bind_framebuffer(framebuffer: Framebuffer|null) {
        if (framebuffer)
        {
            this.gl.viewport(0, 0, framebuffer.width, framebuffer.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer.framebuffer);
        }
        else
        {
            this.gl.viewport(0, 0, this.canvas_width, this.canvas_height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
    }
}
