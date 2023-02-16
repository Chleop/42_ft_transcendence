export const wtf_vertex_shader_source = `#version 300 es
precision highp float;

out vec2 tex_coords;

void main() {
    vec2 vertex = vec2(float(gl_VertexID % 2), float(gl_VertexID >> 1));
    tex_coords = vec2(vertex.x, vertex.y);
    vertex = vertex * 2.0f - 1.0f;
    gl_Position = vec4(vertex, 0.0f, 1.0f);
}
`;

export const wtf_fragment_shader_source = `#version 300 es
precision highp float;

in vec2 tex_coords;

uniform vec2 screen;
uniform sampler2D target;

out vec4 fragment_color;

vec2 vortex(vec2 uv, float center, float falloff, float base) {
    float sq_dist = uv.x * uv.x + uv.y * uv.y;
    float a = base / (center + sq_dist * falloff);
    return vec2(
        uv.x * cos(a) - uv.y * sin(a),
        uv.x * sin(a) + uv.y * cos(a)
    );
}

void main() {
    vec2 uv = tex_coords;
    uv = uv * 2.0f - 1.0f;

    screen.x;

    uv.x += 0.5f;
    uv = vortex(uv, 0.05f, 10.0f, 1.0f);
    uv.x -= 1.0f;
    uv = vortex(uv, 0.05f, 10.0f, -1.0f);
    uv.x += 0.5f;

    uv = uv * 0.5f + 0.5f;
    fragment_color = texture(target, uv);
}
`;
