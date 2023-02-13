export const image_vertex_shader_source = `#version 300 es
precision highp float;

out vec2 tex_coords;

void main() {
    vec2 vertex = vec2(float(gl_VertexID % 2), float(gl_VertexID >> 1));
    tex_coords = vec2(vertex.x, vertex.y);
    vertex.x *= 2.0;
    vertex.x -= 1.0;
    vertex.y *= 2.0;
    vertex.y -= 1.0;
    gl_Position = vec4(vertex, 0.0, 1.0);
}
`;

export const image_fragment_shader_source = `#version 300 es
precision highp float;

in vec2 tex_coords;

uniform sampler2D target;

out vec4 fragment_color;

void main() {
    fragment_color = texture(target, tex_coords);
}
`;
