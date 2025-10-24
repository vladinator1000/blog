// Generated on 2025-10-12T00:38:12.125Z
import { useRef, useEffect, useId } from 'react'

export function StructShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)
  const elementId = useId()
  const shaderId = "Struct_test"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const runnerExists = checkRunnerExists(shaderId, elementId)

    if (!runnerExists) {
      runnerRef.current = new Struct_testRunner({
        canvas,
        id: getRunnerId(shaderId, elementId),
        getUniformValues: () => {
          const selectedPresetName = (props && props.preset) ?? "Default"
                  // Build overrides from direct props whose keys match META.uniforms
          const overrides = (() => {
            const out = {}
            if (typeof props === 'object' && props) {
              const uniformNames = new Set(META.uniforms.map(u => u.name))
              for (const prop in props) {
                if (uniformNames.has(prop)) out[prop] = props[prop]
              }
            }
            // Fallback to any provided paramOverrides at generation time
            return { ...{"speed":0.86,"shape.thickness":0.02,"shape.radius":0.26,"shape.color":[1,1,1,1]}, ...out }
          })()

          let baseParams = {}
          if (selectedPresetName) {
            const preset = META.presets.find(p => p.name === selectedPresetName)
            if (preset) {
              baseParams = preset.values
            }
          }

          return { ...baseParams, ...overrides }
        },
      })

      registerRunner(shaderId, runnerRef.current, elementId)
    }

    const handleMouseMove = (e) => {
      if (!runnerRef.current) return
      const rect = canvas.getBoundingClientRect()
      // CSS pixel coordinates (top-left origin)
      const cssX = e.clientX - rect.left
      const cssY = e.clientY - rect.top

      // Convert to device pixels and bottom-left origin to match shader's fragCoord
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const devX = cssX * scaleX
      const devY = (rect.height - cssY) * scaleY

      runnerRef.current.setMousePosition(devX, devY)

      const dx = devX - lastMousePos.current.x
      const dy = devY - lastMousePos.current.y
      runnerRef.current.setMouseDelta(dx, dy)

      lastMousePos.current = { x: devX, y: devY }
    }

    const handleMouseDown = (e) => {
      if (!runnerRef.current) return
      const rect = canvas.getBoundingClientRect()
      const cssX = e.clientX - rect.left
      const cssY = e.clientY - rect.top
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const devX = cssX * scaleX
      const devY = (rect.height - cssY) * scaleY

      runnerRef.current.setMouseDownPosition(devX, devY)
      let clickState = 0
      if (e.button === 0) {
        clickState = 1
      } else if (e.button === 2) {
        clickState = 2
      }
      runnerRef.current.setMouseClickState(clickState)
    }

    const handleMouseUp = () => {
      if (!runnerRef.current) return
      runnerRef.current.setMouseClickState(0)
    }

    const handleWheel = (e) => {
      if (!runnerRef.current) return
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1
      currentZoom.current = Math.max(0.1, currentZoom.current + zoomDelta)
      runnerRef.current.setMouseZoom(currentZoom.current)
    }

    function disableContextMenu(e) {
      e.preventDefault()
    }

    canvas.addEventListener("contextmenu", disableContextMenu)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("wheel", handleWheel)

    runnerRef.current.start()

    function cleanup() {
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mouseup", handleMouseUp)
        canvas.removeEventListener("wheel", handleWheel)
        canvas.removeEventListener("contextmenu", disableContextMenu)
      }

      runnerRef.current?.stop()
      runnerRef.current?.destroy()

      unregisterRunner(shaderId, elementId)
      runnerRef.current = null
    }

    return cleanup
  }, [])

  return (
    <div className={props.className}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}

const USER_SHADER = `
struct Time { elapsed: f32, delta: f32, frame: u32 };
struct Mouse { pos: vec2f, start: vec2f, delta: vec2f, zoom: f32, click: i32 };
@group(0) @binding(0) var screen: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> time: Time;
@group(0) @binding(2) var<uniform> mouse: Mouse;
@group(0) @binding(3) var nearest: sampler;
@group(0) @binding(4) var bilinear: sampler;
@group(0) @binding(5) var trilinear: sampler;
@group(0) @binding(6) var nearest_repeat: sampler;
@group(0) @binding(7) var bilinear_repeat: sampler;
@group(0) @binding(8) var trilinear_repeat: sampler;
/*
{
  "params": [
    {
      "id": "shape",
      "label": "Shape",
      "members": {
        "radius": { "range": { "min": 0, "max": 1, "step": 0.01 } },
        "thickness": { "range": { "min": 0, "max": 1, "step": 0.01 } },
        "color": { "label": "Color" },
      }
    },
    {
      "id": "speed",
      "label": "Speed",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    }
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "shape": {
          "radius": 0.5,
          "thickness": 0.25,
          "color": [0.2, 0.7, 1.0, 1.0]
        }, 
        "speed": 0.5
      }
    }
  ]
}
*/

// Provided by host bindings (0..8 reserved)
// @group(0) @binding(0) var screen: texture_storage_2d<rgba8unorm, write>;
// struct Time { elapsed: f32, delta: f32, frame: u32 };
// @group(0) @binding(1) var<uniform> time: Time;
// struct Mouse { pos: vec2f, start: vec2f, delta: vec2f, zoom: f32, click: i32 };
// @group(0) @binding(2) var<uniform> mouse: Mouse;
// @group(0) @binding(3) var nearest: sampler;
// @group(0) @binding(4) var bilinear: sampler;
// @group(0) @binding(5) var trilinear: sampler;
// @group(0) @binding(6) var nearest_repeat: sampler;
// @group(0) @binding(7) var bilinear_repeat: sampler;
// @group(0) @binding(8) var trilinear_repeat: sampler;

struct Shape {
  radius: f32,
  thickness: f32,
  color: vec4f,
}

// Struct uniform to test struct handling
@group(0) @binding(9) var<uniform> shape: Shape;
@group(0) @binding(10) var<uniform> speed: f32;

@compute @workgroup_size(16, 16)
fn main_image(@builtin(global_invocation_id) id: vec3u) {
    let screen_size = textureDimensions(screen);
    if (id.x >= screen_size.x || id.y >= screen_size.y) { return; }

    // Normalized coordinates (0..1), flip Y to match default
    let uv = vec2f(f32(id.x) + 0.5, f32(screen_size.y - id.y) - 0.5) / vec2f(screen_size);

    // Circle center and distance from center
    let center = vec2f(0.5, 0.5);
    let d = distance(uv, center);

    // Anti-alias width in UV space (approx for compute shader)
    let aa = 1.5 / f32(min(screen_size.x, screen_size.y));

    let radiusAnimation = sin(time.elapsed * speed) / 8.0 + 1.0;
    let r = clamp(shape.radius * radiusAnimation, 0.0, 1.0);
    let th = max(shape.thickness, 0.0);

    // Filled circle mask
    var mask = 1.0 - smoothstep(r, r + aa, d);

    // If thickness > 0, make it a ring by subtracting inner filled circle
    if (th > 0.0) {
        let ri = max(0.0, r - th);
        let inner = 1.0 - smoothstep(ri, ri + aa, d);
        mask = clamp(mask - inner, 0.0, 1.0);
    }

    var col = shape.color.rgb * mask;

    // Gamma to linear
    col = pow(col, vec3f(2.2));

    textureStore(screen, id.xy, vec4f(col, 1.0));
}
`
const RENDER_SHADER = `
struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f
};

@vertex fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
  var pos = array<vec2f, 3>(vec2f(-1.0,-3.0), vec2f(-1.0,1.0), vec2f(3.0,1.0));
  var uv  = array<vec2f, 3>(vec2f(0.0, 2.0), vec2f(0.0,0.0), vec2f(2.0,0.0));

  var out: VSOut;
  out.pos = vec4f(pos[vertexIndex],0.0,1.0);
  out.uv = uv[vertexIndex]; 

  return out;
}

@group(0) @binding(0) var screen: texture_2d<f32>;
@group(0) @binding(1) var defaultSampler: sampler;

@fragment fn fragment_main(in: VSOut) -> @location(0) vec4f {
  return textureSample(screen, defaultSampler, in.uv);
}`

const META = {
  "uniforms": [
    {
      "name": "shape",
      "binding": 9,
      "size": 32,
      "rawSize": 32,
      "type": {
        "name": "Shape",
        "size": 32,
        "isStruct": true,
        "isArray": false,
        "members": [
          {
            "name": "radius",
            "offset": 0,
            "type": {
              "name": "f32",
              "size": 4,
              "isStruct": false,
              "isArray": false
            }
          },
          {
            "name": "thickness",
            "offset": 4,
            "type": {
              "name": "f32",
              "size": 4,
              "isStruct": false,
              "isArray": false
            }
          },
          {
            "name": "color",
            "offset": 16,
            "type": {
              "name": "vec4f",
              "size": 16,
              "isStruct": false,
              "isArray": false
            }
          }
        ]
      }
    },
    {
      "name": "speed",
      "binding": 10,
      "size": 16,
      "rawSize": 4,
      "type": {
        "name": "f32",
        "size": 4,
        "isStruct": false,
        "isArray": false
      }
    }
  ],
  "storage": [],
  "presets": [
    {
      "name": "Default",
      "values": {
        "shape.radius": 0.5,
        "shape.thickness": 0.25,
        "shape.color": [
          0.2,
          0.7,
          1,
          1
        ],
        "speed": 0.5
      }
    }
  ],
  "computeEntries": [
    {
      "stage": "compute",
      "inputs": [
        {
          "name": "id",
          "type": {
            "name": "vec3u",
            "attributes": [
              {
                "id": 4672,
                "line": 70,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "locationType": "builtin",
          "location": "global_invocation_id",
          "interpolation": null
        }
      ],
      "outputs": [],
      "arguments": [
        {
          "name": "id",
          "type": {
            "name": "vec3u",
            "attributes": [
              {
                "id": 4672,
                "line": 70,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 4672,
              "line": 70,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
        {
          "name": "screen",
          "type": {
            "name": "texture_storage_2d",
            "attributes": [
              {
                "id": 4622,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 4623,
                "line": 3,
                "name": "binding",
                "value": "0"
              }
            ],
            "size": 0,
            "format": {
              "name": "rgba8unorm",
              "attributes": null,
              "size": 0
            },
            "access": "write"
          },
          "group": 0,
          "binding": 0,
          "attributes": [
            {
              "id": 4622,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 4623,
              "line": 3,
              "name": "binding",
              "value": "0"
            }
          ],
          "resourceType": 4,
          "access": "read"
        },
        {
          "name": "time",
          "type": {
            "name": "Time",
            "attributes": null,
            "size": 12,
            "members": [
              {
                "name": "elapsed",
                "type": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 0,
                "size": 4
              },
              {
                "name": "delta",
                "type": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 4,
                "size": 4
              },
              {
                "name": "frame",
                "type": {
                  "name": "u32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 8,
                "size": 4
              }
            ],
            "align": 4,
            "startLine": 1,
            "endLine": 1,
            "inUse": true
          },
          "group": 0,
          "binding": 1,
          "attributes": [
            {
              "id": 4626,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 4627,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "speed",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 4666,
                "line": 67,
                "name": "group",
                "value": "0"
              },
              {
                "id": 4667,
                "line": 67,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 4666,
              "line": 67,
              "name": "group",
              "value": "0"
            },
            {
              "id": 4667,
              "line": 67,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "shape",
          "type": {
            "name": "Shape",
            "attributes": null,
            "size": 32,
            "members": [
              {
                "name": "radius",
                "type": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 0,
                "size": 4
              },
              {
                "name": "thickness",
                "type": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 4,
                "size": 4
              },
              {
                "name": "color",
                "type": {
                  "name": "vec4f",
                  "attributes": null,
                  "size": 16
                },
                "attributes": null,
                "offset": 16,
                "size": 16
              }
            ],
            "align": 16,
            "startLine": 59,
            "endLine": 63,
            "inUse": true
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 4663,
              "line": 66,
              "name": "group",
              "value": "0"
            },
            {
              "id": 4664,
              "line": 66,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 70,
      "endLine": 104,
      "inUse": true,
      "calls": {},
      "name": "main_image",
      "attributes": [
        {
          "id": 4670,
          "line": 69,
          "name": "compute",
          "value": null
        },
        {
          "id": 4671,
          "line": 69,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
        }
      ]
    }
  ],
  "computeMeta": {},
  "workgroupSizes": {
    "main_image": [
      16,
      16
    ]
  }
}

// https://developer.chrome.com/docs/web-platform/webgpu/from-webgl-to-webgpu
export class Struct_testRunner {
  constructor(options) {
    this.canvas = options.canvas
    this.alphaMode = options.alphaMode ?? 'premultiplied'
    this.getUniformValues = options.getUniformValues
    this.id = options.id ?? "runner:" + Math.random().toString(36).slice(2, 8)

    this.computePipelines = new Map()
    this.dispatchedNames = new Set()
    this.uniformBuffers = new Map()
    this.storageBuffers = new Map()
    this.startTime = 0
    this.prevTime = 0
    this.frameCount = 0
    this.size = { width: 0, height: 0 }
    this.mouseState = {
      pos: { x: 0, y: 0 },
      zoom: 1.0,
      click: 0,
      start: { x: 0, y: 0 },
      delta: { x: 0, y: 0 },
    }

    if (!navigator.gpu) {
      throw new Error('WebGPU not supported')
    }

    this.resize()
    this.init()
  }

  async init() {
    if (this.disposed) return

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) throw new Error('No GPU adapter')
    
    this.device = await adapter.requestDevice()

    this.context = this.canvas.getContext('webgpu')
    if (!this.context) throw new Error('No WebGPU context')

    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device: this.device, format: this.format, alphaMode: this.alphaMode })

    this.timeBuffer = this.device.createBuffer({ size: 12, usage: 72 })
    this.mouseBuffer = this.device.createBuffer({ size: 32, usage: 72 })

    // Samplers
    this.nearest = this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
    this.bilinear = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
    this.trilinear = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
    this.nearestRepeat = this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'repeat', addressModeV: 'repeat' })
    this.bilinearRepeat = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' })
    this.trilinearRepeat = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' })

    this.recreateTextures()

    for (const uniform of META.uniforms) {
      const buffer = this.device.createBuffer({ size: uniform.size, usage: 72 })
      this.uniformBuffers.set(uniform.name, buffer)
    }

    for (const storage of META.storage) {
      const buffer = this.device.createBuffer({ size: storage.size, usage: storage.usage, mappedAtCreation: true })
      new Uint8Array(buffer.getMappedRange()).fill(0)
      buffer.unmap()
      this.storageBuffers.set(storage.name, buffer)
    }

    const numSystemBindings = 9

    const computeModule = this.device.createShaderModule({ code: USER_SHADER })
    const computeBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: 4,
          storageTexture: {
            format: "rgba8unorm",
            viewDimension: "2d",
            access: "write-only",
          },
        },
        {
          binding: 1,
          visibility: 4,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 2,
          visibility: 4,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 3,
          visibility: 4,
          sampler: {
            type: "non-filtering",
          },
        },
        {
          binding: 4,
          visibility: 4,
          sampler: { type: "filtering" },
        },
        {
          binding: 5,
          visibility: 4,
          sampler: { type: "filtering" },
        },
        {
          binding: 6,
          visibility: 4,
          sampler: { type: "non-filtering" },
        },
        {
          binding: 7,
          visibility: 4,
          sampler: { type: "filtering" },
        },
        {
          binding: 8,
          visibility: 4,
          sampler: { type: "filtering" },
        },
        // Generate entries for user resources
        // TODO: find a better way to deal with system uniforms, this doesn't feel elegant.
        ...META.uniforms
          .filter((u) => u.binding >= numSystemBindings)
          .map((uniform) => ({
            binding: uniform.binding,
            visibility: 4,
            buffer: {
              type: "uniform",
            },
          })),
        ...META.storage
          .filter((s) => s.binding >= numSystemBindings)
          .map((storage) => ({
            binding: storage.binding,
            visibility: 4,
            buffer: {
              type: "storage",
            },
          })),
      ],
    })

    for (const entry of META.computeEntries) {
      const pipeline = this.device.createComputePipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [computeBindGroupLayout],
        }),
        compute: { module: computeModule, entryPoint: entry.name }
      })

      this.computePipelines.set(entry.name, pipeline)
    }

    this.computeBindGroup = this.device.createBindGroup({
      layout: computeBindGroupLayout,
      entries: [
        { binding: 0, resource: this.storageTexture.createView() },
        { binding: 1, resource: { buffer: this.timeBuffer } },
        { binding: 2, resource: { buffer: this.mouseBuffer } },
        { binding: 3, resource: this.nearest },
        { binding: 4, resource: this.bilinear },
        { binding: 5, resource: this.trilinear },
        { binding: 6, resource: this.nearestRepeat },
        { binding: 7, resource: this.bilinearRepeat },
        { binding: 8, resource: this.trilinearRepeat },
        ...META.uniforms.map(uniform => ({ binding: uniform.binding, resource: { buffer: this.uniformBuffers.get(uniform.name) } })),
        ...META.storage.map(storage => ({ binding: storage.binding, resource: { buffer: this.storageBuffers.get(storage.name) } })),
      ]
    })
    
    const renderingModule = this.device.createShaderModule({ code: RENDER_SHADER })
    this.renderPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: renderingModule, entryPoint: 'vertex_main' },
      fragment: { module: renderingModule, entryPoint: 'fragment_main',
      targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' }
    })

    this.renderingBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.storageTexture.createView() },
        { binding: 1, resource: this.nearest },
      ],
    })
  }

  recreateTextures() {
    if (!this.device) return
    this.storageTexture?.destroy()

    const { width, height } = this.size

    if (width <= 0 || height <= 0) {
      console.warn("Invalid canvas dimensions for texture creation:", this.size)
      return
    }

    this.storageTexture = this.device.createTexture({
      size: { width, height },
      format: 'rgba8unorm',
      usage: 12
    })
  }

  resize() {
    const dpr = Math.max(1, (window.devicePixelRatio || 1))
    const w = Math.max(1, Math.floor((this.canvas.clientWidth || 1) * dpr))
    const h = Math.max(1, Math.floor((this.canvas.clientHeight || 1) * dpr))
    this.canvas.width = w;
    this.canvas.height = h;
    this.size = { width: w, height: h }
    
    if (this.device) {
      this.recreateTextures()
    }
  }

  createMouseData() {
    const buffer = new ArrayBuffer(32)
    const view = new DataView(buffer)

    const width = Math.max(1, this.size.width)
    const height = Math.max(1, this.size.height)

    // pos: vec2f
    view.setFloat32(0, this.mouseState.pos.x / width, true)
    view.setFloat32(4, this.mouseState.pos.y / height, true)

    // start: vec2f
    view.setFloat32(
      8,
      this.mouseState.start.x / width,
      true,
    )
    view.setFloat32(
      12,
      this.mouseState.start.y / height,
      true,
    )

    // delta: vec2f
    view.setFloat32(16, this.mouseState.delta.x, true)
    view.setFloat32(20, this.mouseState.delta.y, true)

    // zoom: f32
    view.setFloat32(24, this.mouseState.zoom, true)

    // click: i32
    view.setInt32(28, this.mouseState.click, true)

    return buffer
  }

  packUniformValue(u, v, allParams) {
    const bytes = Math.max(16, Math.ceil(((u.rawSize ?? u.size)) / 16) * 16)
    const arrayBuffer = new ArrayBuffer(bytes)
    const dataView = new DataView(arrayBuffer)
    let source = Array.isArray(v) ? v : (typeof v === 'number' ? [v] : [])
    if (u.type && u.type.isStruct) {
      source = this.collectFlatValuesForStruct(u, allParams)
    }
    this.writeTypeFromFlatList(dataView, 0, u.type || { name: 'f32', size: 4 }, source, 0)
    return arrayBuffer
  }

  getPathValue(obj, path) {
    let cur = obj
    for (let i = 0; i < path.length; i++) {
      if (cur == null) return undefined
      cur = cur[path[i]]
    }
    return cur
  }

  collectFlatValuesForStruct(uInfo, params) {
    const out = []
    const structName = uInfo.name
    const flatten = (typeInfo, name, path) => {
      const currentPath = Array.isArray(path) ? path : []
      if (typeInfo.isStruct && Array.isArray(typeInfo.members) && (typeInfo.members.length > 0)) {
        for (const member of typeInfo.members) {
          flatten(member.type, member.name, currentPath.concat([name]))
        }
        return
      }
      if (typeInfo.isArray) {
        const count = typeInfo.count || 0
        const itemComponents = this.estimateScalarCount(typeInfo.format || {})
        const pathSegments = [structName].concat(currentPath).concat([name]).filter(Boolean)
        const namespaceKey = pathSegments.join('.')
        const nested = this.getPathValue(params, pathSegments)
        const value = (nested !== undefined ? nested : (params[namespaceKey] ?? params[name]))
        const values = Array.isArray(value) ? value : []
        let index = 0
        for (let i = 0; i < count; i++) {
          for (let c = 0; c < itemComponents; c++) {
            out.push(values[index++] ?? 0)
          }
        }
        return
      }
      const components = this.estimateScalarCount(typeInfo)
      const pathSegments = [structName].concat(currentPath).concat([name]).filter(Boolean)
      const namespaceKey = pathSegments.join('.')
      const nested = this.getPathValue(params, pathSegments)
      const value = (nested !== undefined ? nested : (params[namespaceKey] ?? params[name]))
      const arr = Array.isArray(value) ? value : (typeof value === 'number' ? [value] : [])
      for (let i = 0; i < components; i++) {
        out.push(arr[i] ?? 0)
      }
    }
    if (uInfo.type && Array.isArray(uInfo.type.members)) {
      for (const member of uInfo.type.members) {
        flatten(member.type, member.name, [])
      }
    }
    return out
  }

  estimateScalarCount(t) {
    const name = String((t && t.name) || 'f32')
    if (name.startsWith('vec')) {
      const match = /^vec(d+)/.exec(name)
      return match ? parseInt(match[1]) : 4
    }
    if (name.startsWith('mat')) {
      const match = /^mat(d+)x(d+)/.exec(name)
      if (!match) {
        return 16
      }
      return parseInt(match[1]) * parseInt(match[2])
    }
    return 1
  }

  writeTypeFromFlatList(view, baseOffset, info, srcArr, index) {
    if (info && info.isStruct && Array.isArray(info.members)) {
      for (const member of info.members) {
        index = this.writeTypeFromFlatList(view, (baseOffset + member.offset), member.type, srcArr, index)
      }
      return index
    }
    if (info && info.isArray) {
      const count = info.count || 0
      const stride = (info.stride || (info.format && info.format.size)) || 0
      for (let i = 0; i < count; i++) {
        index = this.writeTypeFromFlatList(view, (baseOffset + i * stride), info.format, srcArr, index)
      }
      return index
    }
    const name = String((info && info.name) || '')
    let formatName = 'f32'
    if (info && info.format && info.format.name) {
      formatName = String(info.format.name)
    } else if (name.endsWith('i')) {
      formatName = 'i32'
    } else if (name.endsWith('u')) {
      formatName = 'u32'
    }
    if (name.startsWith('vec')) {
      let len = this.getVecLenFromName(name)
      if (!len) {
        const componentSize = (info && info.format && info.format.size) || 4
        const total = (info && info.size) || (componentSize * 4)
        const approx = Math.round(total / componentSize)
        len = Math.min(4, Math.max(1, approx))
      }
      for (let c = 0; c < len; c++) {
        this.setByFormat(view, (baseOffset + c * 4), formatName, (srcArr[index++] ?? 0))
      }
      return index
    }
    if (name.startsWith('mat')) {
      const dims = this.getMatDimsFromName(name)
      const cols = (dims && dims.cols) || 1
      const rows = (dims && dims.rows) || Math.max(1, Math.floor(((info && info.size) || 4) / 4))
      const totalSize = (info && info.size) || (rows * cols * 4)
      const colStride = Math.floor(totalSize / cols)
      for (let c = 0; c < cols; c++) {
        const colOffset = baseOffset + c * colStride
        for (let r = 0; r < rows; r++) {
          this.setByFormat(view, (colOffset + r * 4), formatName, (srcArr[index++] ?? 0))
        }
      }
      return index
    }
    const scalarName = String((info && info.name) || 'f32')
    this.setByFormat(view, baseOffset, scalarName, (srcArr[index++] ?? 0))
    return index
  }

  setByFormat(view, byteOffset, formatName, value) {
    if (formatName === 'i32') {
      view.setInt32(byteOffset, (value | 0), true); return
    }
    if (formatName === 'u32') {
      view.setUint32(byteOffset, (value >>> 0), true); return
    }
    if (formatName === 'bool') {
      view.setUint32(byteOffset, (value ? 1 : 0), true); return
    }
    view.setFloat32(byteOffset, value, true)
  }

  getVecLenFromName(name) {
    const m = /^vec(d+)/.exec(name)
    return m ? parseInt(m[1]) : null
  }

  getMatDimsFromName(name) {
    const m = /^mat(d+)x(d+)/.exec(name)
    if (!m) {
      return null
    }
    return { cols: parseInt(m[1]), rows: parseInt(m[2]) }
  }

  start() {
    if (this.frameHandle !== null) {
      this.startTime = 0
    }

    const frame = (ts) => {
      if (!this.device || !this.context || !this.timeBuffer || this.computePipelines.size === 0 || !this.renderPipeline) {
        this.frameHandle = requestAnimationFrame(frame); return
      }
      
      if (!this.startTime) {
        this.startTime = ts
      }

      const elapsed = (ts - this.startTime) / 1000
      const delta = this.prevTime ? (ts - this.prevTime) / 1000 : 1 / 60
      this.prevTime = ts
      this.frameCount++
      this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([elapsed, delta, this.frameCount]))
      this.device.queue.writeBuffer(this.mouseBuffer, 0, this.createMouseData())

      const params = this.getUniformValues ? (this.getUniformValues() || {}) : {}
      for (const uniform of META.uniforms) {
        const buffer = this.uniformBuffers.get(uniform.name)
        if (!buffer) continue
        const value = params[uniform.name]
        const packed = this.packUniformValue(uniform, value, params)
        this.device.queue.writeBuffer(buffer, 0, new Uint8Array(packed))
      }

      const { width, height } = this.size
      const encoder = this.device.createCommandEncoder()
      
      for (const [entryName, pipeline] of this.computePipelines) {
        const entryComputeMeta = META.computeMeta[entryName]
        const workgroupSize = META.workgroupSizes[entryName]
        const workgroupCount = entryComputeMeta?.workgroupCount
        const repeatTimes = entryComputeMeta?.dispatchCount ?? 1
        const mode = entryComputeMeta?.dispatchMode
        const isOnce = mode === 'once' || mode === 'Once' || mode === 0

        if (isOnce && this.dispatchedNames.has(entryName)) {
          continue
        }

        for (let i = 0; i < repeatTimes; i++) {
          const pass = encoder.beginComputePass({
            label: `${this.id}::pass::compute::${entryName}#${i}`,
          })

          pass.setPipeline(pipeline)
          pass.setBindGroup(0, this.computeBindGroup)

          pass.dispatchWorkgroups(
            workgroupCount?.[0] ?? Math.ceil(width / workgroupSize[0]),
            workgroupCount?.[1] ?? Math.ceil(height / workgroupSize[1]),
            workgroupCount?.[2] ?? workgroupSize[2] ?? undefined,
          )

          pass.end()
        }

        if (isOnce && !this.dispatchedNames.has(entryName)) {
          this.dispatchedNames.add(entryName)
        }
      }

      if (this.renderPipeline) {
        const view = this.context.getCurrentTexture().createView()
        const pass = encoder.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store' }] })

        pass.setPipeline(this.renderPipeline)
        pass.setBindGroup(0, this.renderingBindGroup)
        pass.draw(3, 1, 0, 0)
        pass.end()
      }
      this.device.queue.submit([encoder.finish()])

      if (!this.disposed) {
        this.frameHandle = requestAnimationFrame(frame)
      }
    }

    if (!this.disposed) {
      this.frameHandle = requestAnimationFrame(frame)
    }
  }

  destroy() {
    this.stop()
    this.disposed = true
    this.destroyTextures()
    this.timeBuffer?.destroy()
    this.mouseBuffer?.destroy()
    for (const buffer of this.uniformBuffers.values()) {
      buffer.destroy()
    }
    for (const buffer of this.storageBuffers.values()) {
      buffer.destroy()
    }
    // Note: GPUComputePipeline objects don't have a destroy method in WebGPU
    this.computePipelines.clear()
    this.uniformBuffers.clear()
    this.storageBuffers.clear()
    this.device?.destroy()
    this.device = null
    this.context = null
  }

  setMousePosition(x, y) {
    this.mouseState.pos.x = x
    this.mouseState.pos.y = y
  }

  setMouseZoom(zoom) {
    this.mouseState.zoom = zoom
  }

  setMouseClickState(click) {
    this.mouseState.click = click
  }

  setMouseDownPosition(x, y) {
    this.mouseState.start.x = x
    this.mouseState.start.y = y
  }

  setMouseDelta(dx, dy) {
    this.mouseState.delta.x = dx
    this.mouseState.delta.y = dy
  }
}

const gpuRunnerRegistry = new Map()

export function checkRunnerExists(shaderId, elementId) {
  return gpuRunnerRegistry.has(getRunnerId(shaderId, elementId))
}

export function registerRunner(
  shaderId,
  runner,
  elementId,
) {
  let id = getRunnerId(shaderId, elementId)
  gpuRunnerRegistry.set(id, runner)
}

export function unregisterRunner(shaderId, elementId) {
  let id = getRunnerId(shaderId, elementId)
  let runner = gpuRunnerRegistry.get(id)
  if (runner) {
    runner.destroy()
  }
  gpuRunnerRegistry.delete(id)
}

function getRunnerId(shaderId, elementId) {
  return `${shaderId}:${elementId}`
}


