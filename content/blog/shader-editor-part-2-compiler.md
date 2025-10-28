---
external: false
title: "Compiling shaders (coming soon)"
description: "Generating portable and efficient programs from .wgsl shaders (shader editor - part 2)"
date: 2025-10-28
---
--- draft 1 ---
todo: write outline

This article is a continuation of [part 1](./shader-editor-part-1). It assumes the reader is familiar with the [WebGPU Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html).

We now have the tools to create gorgeous designs. They have the potential to run in any browser, because they're using WebGPU.
To enable that, we need a compiler that can generate the JavaScript that will instruct browsers how to render our designs.

A couple of runtime constraints for our programs before we start:
- Don't waste memory.
- Don't waste compute cycles.

With those in mind, let's begin by taking a look at what information [wgsl_reflect](https://github.com/brendan-duncan/wgsl_reflect/) can give us.
- How many compute entrypoints are there?
- What type of resources does our shader use?
- How big are they?

Given a shader like this:

```wgsl
struct ViewUniforms {
    viewProjection: mat4x4<f32>
}

struct ModelUniforms {
    model: mat4x4<f32>,
    color: vec4<f32>,
    intensity: f32
}

@binding(0) @group(0) var<uniform> viewUniforms: ViewUniforms;
@binding(1) @group(0) var<uniform> modelUniforms: ModelUniforms;
@binding(2) @group(0) var u_sampler: sampler;
@binding(3) @group(0) var u_texture: texture_2d<f32>;

struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(1) a_normal: vec3<f32>,
    @location(2) a_color: vec4<f32>,
    @location(3) a_uv: vec2<f32>
}

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) v_position: vec4<f32>,
    @location(1) v_normal: vec3<f32>,
    @location(2) v_color: vec4<f32>,
    @location(3) v_uv: vec2<f32>
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.Position = viewUniforms.viewProjection * modelUniforms.model * vec4<f32>(input.a_position, 1.0);
    output.v_position = output.Position;
    output.v_normal = input.a_normal;
    output.v_color = input.a_color * modelUniforms.color * modelUniforms.intensity;
    output.v_uv = input.a_uv;
    return output;
}
```

[wgsl_reflect](https://github.com/brendan-duncan/wgsl_reflect/) can calculate the bind group information, including sizes and offsets for members of uniform buffers.

```ts
import { WgslReflect } from "./wgsl_reflect.module.js";


const shader = `/* ... */`;

const reflect = new WgslReflect(shader);

console.log(reflect.functions.length); // 1
console.log(reflect.structs.length); // 4
console.log(reflect.uniforms.length); // 2

// Shader entry points
console.log(reflect.entry.vertex.length); // 1, there is 1 vertex entry function.
console.log(reflect.entry.fragment.length); // 0, there are no fragment entry functions.
console.log(reflect.entry.compute.length); // 0, there are no compute entry functions.

console.log(reflect.entry.vertex[0].name); // "main", the name of the vertex entry function.

console.log(reflect.entry.vertex[0].resources.length); // 2, main uses modelUniforms and viewUniforms resource bindings.
console.log(reflect.entry.vertex[0].resources[0].name); // viewUniforms
console.log(reflect.entry.vertex[0].resources[1].name); // modelUniforms

// Vertex shader inputs
console.log(reflect.entry.vertex[0].inputs.length); // 4, inputs to "main"
console.log(reflect.entry.vertex[0].inputs[0].name); // "a_position"
console.log(reflect.entry.vertex[0].inputs[0].location); // 0
console.log(reflect.entry.vertex[0].inputs[0].locationType); // "location" (can be "builtin")
console.log(reflect.entry.vertex[0].inputs[0].type.name); // "vec3"
console.log(reflect.entry.vertex[0].inputs[0].type.format.name); // "f32"

// Gather the bind groups used by the shader.
const groups = reflect.getBindGroups();
console.log(groups.length); // 1
console.log(groups[0].length); // 4, bindings in group(0)

console.log(groups[0][1].resourceType); // ResourceType.Uniform, the type of resource at group(0) binding(1)
console.log(groups[0][1].size); // 96, the size of the uniform buffer.
console.log(groups[0][1].members.length); // 3, members in ModelUniforms.
console.log(groups[0][1].members[0].name); // "model", the name of the first member in the uniform buffer.
console.log(groups[0][1].members[0].offset); // 0, the offset of 'model' in the uniform buffer.
console.log(groups[0][1].members[0].size); // 64, the size of 'model'.
console.log(groups[0][1].members[0].type.name); // "mat4x4", the type of 'model'.
console.log(groups[0][1].members[0].type.format.name); // "f32", the format of the mat4x4.

console.log(groups[0][2].resourceType); // ResourceType.Sampler

console.log(groups[0][3].resourceType); // ResourceType.Texture
console.log(groups[0][3].type.name); // "texture_2d"
console.log(groups[0][3].type.format.name); // "f32"
```


The only missing parts in the WGSL standard we need are:
- What initial values should the variables have?
- How many times should the compute functions be dispatched?



## Compilation process overview
1. Reflection - parse shader and metadata
2. Optimization - Include only used bindings
3. Code Generation - Produce self-contained GPU runner and framework component (Astro, React, etc.)
4. Zero dependencies

```javascript
export function BloomShader(props) {
  // Props: preset, param overrides
  // Wire input events (if used) on mount
  // Wire GPU runner on mount
}

export class BloomGPURunner {
  // Creates only needed resources
  // Dispatches compute passes matching user configuration 
  // No bloat
}
```

## Generating code like cavemen
- (Ab)using string templates
- Sticking shader reflection deta in one big pile and reading it

## Not wasting memory
- Intro [https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html](https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html)
- Generating 



## Not wasting cycles
- Dispatch count metadata