// Generated on 2025-10-01T19:53:59.999Z
import { useRef, useEffect, useId } from 'react'

export function CheckerboardShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)
  const elementId = useId()
  const shaderId = "Checkerboard"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const runnerExists = checkRunnerExists(shaderId, elementId)

    if (!runnerExists) {
      runnerRef.current = new CheckerboardRunner({
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
            return { ...{}, ...out }
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
      }

      runnerRef.current?.stop()
      runnerRef.current?.destroy()

      unregisterRunner(shaderId, elementId)
      runnerRef.current = null
    }

    return cleanup
  }, [])

  return (
    <div className="w-full h-full">
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
      "id": "u_one",
      "label": "One",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
    {
      "id": "u_two",
      "label": "Two",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    }
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_one": 0.5,
        "u_two": 0.5
      }
    }
  ]
}
*/


// Provided by host:
// @group(0) @binding(0) var screen: texture_storage_2d<rgba8unorm, write>;
// struct Time { elapsed: f32, delta: f32, frame: u32 };,
// @group(0) @binding(1) var<uniform> time: Time;

// struct Mouse { pos: vec2f, start: vec2f, delta: vec2f, zoom: f32, click: i32 }
// @group(0) @binding(2) var<uniform> mouse: Mouse;

// Using the mouse:
// mouse.pos - current mouse position (vec2f)
// mouse.start - mouse down position (vec2f)
// mouse.delta - movement since last mouse event (vec2f)
// mouse.zoom - zoom level (f32, default = 1.0)
// mouse.click - click state (i32, none = 0, left = 1, right = 2)

// @group(0) @binding(3) var nearest: sampler;
// @group(0) @binding(4) var bilinear: sampler;
// @group(0) @binding(5) var trilinear: sampler;
// @group(0) @binding(6) var nearest_repeat: sampler;
// @group(0) @binding(7) var bilinear_repeat: sampler;
// @group(0) @binding(8) var trilinear_repeat: sampler;

// Grid config
const GRID_X: u32 = 32u;
const GRID_Y: u32 = 18u;
const GRID_SIZE = u32(GRID_X * GRID_Y);

@group(0) @binding(9) var<storage, read_write> clicks: array<f32, GRID_SIZE>;

@compute @workgroup_size(16, 16)
fn main_image(@builtin(global_invocation_id) id: vec3u) {
  
  // Viewport resolution (in pixels)
  let screen_size = textureDimensions(screen);

  // Prevent overdraw for workgroups on the edge of the viewport
  if (id.x >= screen_size.x || id.y >= screen_size.y) { return; }

  // Pixel coordinates (centre of pixel, origin at bottom left)
  let fragCoord = vec2f(f32(id.x) + .5, f32(screen_size.y - id.y) - .5);

  // Normalised pixel coordinates (from 0 to 1)
  let uv = fragCoord / vec2f(screen_size);

  let sizeX = f32(GRID_X);
  let sizeY = f32(GRID_Y);

  let total = floor(uv.x * sizeX) + floor(uv.y * sizeY);
  let isEven = (total % 2.0) == 0.0;
  
  let color1 = vec3f(0.4);
  let color2 = vec3f(0.6);
  
  var col = mix(color1, color2, f32(isEven));

  let cell = vec2u(u32(floor(uv.x * sizeX)), u32(floor(uv.y * sizeY)));
  let mouseCell = vec2u(u32(floor(mouse.pos.x * sizeX)), u32(floor(mouse.pos.y * sizeY)));
  let mouseIndex = mouseCell.x + mouseCell.y * GRID_X;

  if (mouse.click == 1) {
    clicks[mouseIndex] = 1.0;
  } else if (mouse.click == 2) {
    clicks[mouseIndex] = 0.0;
  }

  let isHover = all(cell == mouseCell);
  
  let cellIndex = cell.x + cell.y * GRID_X;  
  let isClicked = clicks[cellIndex] == 1.0;

  if (isClicked) {
    col = vec3f(1.0);
  } else if (isHover) {
    col = vec3f(0.7);
  }

  // Convert from gamma-encoded to linear colour space
  col = pow(col, vec3f(2.2));

  // Output to screen (linear colour space)
  textureStore(screen, id.xy, vec4f(col, 1.));
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

@group(0) @binding(0) var screenTex: texture_2d<f32>;
@group(0) @binding(1) var defaultSampler: sampler;

@fragment fn fragment_main(in: VSOut) -> @location(0) vec4f {
  return textureSample(screenTex, defaultSampler, in.uv);
}`

const META = {
  "uniforms": [],
  "storage": [
    {
      "name": "clicks",
      "binding": 9,
      "size": 2304,
      "usage": 140
    }
  ],
  "compute": [
    {
      "stage": "compute",
      "inputs": [
        {
          "name": "id",
          "type": {
            "name": "vec3u",
            "attributes": [
              {
                "id": 6061,
                "line": 69,
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
                "id": 6061,
                "line": 69,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 6061,
              "line": 69,
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
                "id": 6004,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6005,
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
              "id": 6004,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6005,
              "line": 3,
              "name": "binding",
              "value": "0"
            }
          ],
          "resourceType": 4,
          "access": "read"
        },
        {
          "name": "mouse",
          "type": {
            "name": "Mouse",
            "attributes": null,
            "size": 32,
            "members": [
              {
                "name": "pos",
                "type": {
                  "name": "vec2f",
                  "attributes": null,
                  "size": 8
                },
                "attributes": null,
                "offset": 0,
                "size": 8
              },
              {
                "name": "start",
                "type": {
                  "name": "vec2f",
                  "attributes": null,
                  "size": 8
                },
                "attributes": null,
                "offset": 8,
                "size": 8
              },
              {
                "name": "delta",
                "type": {
                  "name": "vec2f",
                  "attributes": null,
                  "size": 8
                },
                "attributes": null,
                "offset": 16,
                "size": 8
              },
              {
                "name": "zoom",
                "type": {
                  "name": "f32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 24,
                "size": 4
              },
              {
                "name": "click",
                "type": {
                  "name": "i32",
                  "attributes": null,
                  "size": 4
                },
                "attributes": null,
                "offset": 28,
                "size": 4
              }
            ],
            "align": 8,
            "startLine": 2,
            "endLine": 2,
            "inUse": true
          },
          "group": 0,
          "binding": 2,
          "attributes": [
            {
              "id": 6011,
              "line": 5,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6012,
              "line": 5,
              "name": "binding",
              "value": "2"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "clicks",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6053,
                "line": 66,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6054,
                "line": 66,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 2304,
            "count": 576,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 6053,
              "line": 66,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6054,
              "line": 66,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        }
      ],
      "overrides": [],
      "startLine": 69,
      "endLine": 120,
      "inUse": true,
      "calls": {},
      "name": "main_image",
      "attributes": [
        {
          "id": 6059,
          "line": 68,
          "name": "compute",
          "value": null
        },
        {
          "id": 6060,
          "line": 68,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_one": 0.5,
        "u_two": 0.5
      }
    }
  ]
}

// https://developer.chrome.com/docs/web-platform/webgpu/from-webgl-to-webgpu
export class CheckerboardRunner {
  constructor(options) {
    this.canvas = options.canvas
    this.alphaMode = options.alphaMode ?? 'premultiplied'
    this.getUniformValues = options.getUniformValues
    this.id = options.id ?? "runner:" + Math.random().toString(36).slice(2, 8)

    this.computePipelines = []
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

    this.computePipelines = META.compute.map((entryPoint) => this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout],
      }),
      compute: { module: computeModule, entryPoint: entryPoint.name }
    }))

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
        { binding: 0, resource: this.sampleTexture.createView() },
        { binding: 1, resource: this.nearest },
      ],
    })
  }

  recreateTextures() {
    if (!this.device) return
    this.storageTexture?.destroy()
    this.sampleTexture?.destroy()

    const { width, height } = this.size

    if (width <= 0 || height <= 0) {
      console.warn("Invalid canvas dimensions for texture creation:", this.size)
      return
    }

    this.storageTexture = this.device.createTexture({
      size: { width, height },
      format: 'rgba8unorm',
      usage: 11
    })

    this.sampleTexture = this.device.createTexture({
      size: { width, height },
      format: 'rgba8unorm',
      usage: 6
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

  start() {
    if (this.frameHandle !== null) {
      this.startTime = 0
    }

    const frame = (ts) => {
      if (!this.device || !this.context || !this.timeBuffer || this.computePipelines.length === 0 || !this.renderPipeline) {
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
      for (const u of META.uniforms) {
        const v = params[u.name]
        let src = []
        if (Array.isArray(v)) {
          src = v
        } else if (typeof v === 'number') {
         src = [v]
        }

        const floats = new Float32Array(u.size / 4)
        for (let i = 0; i < Math.min(src.length, floats.length); i++) {
          floats[i] = src[i]
        }

        const buffer = this.uniformBuffers.get(u.name)
        this.device.queue.writeBuffer(buffer, 0, floats)
      }

      const enc = this.device.createCommandEncoder()
      for (const pipe of this.computePipelines) {
        const pass = enc.beginComputePass()
        pass.setPipeline(pipe)
        pass.setBindGroup(0, this.computeBindGroup)
        pass.dispatchWorkgroups(Math.ceil(this.size.width/16), Math.ceil(this.size.height/16))
        pass.end()
      }

      if (this.storageTexture && this.sampleTexture) {
        enc.copyTextureToTexture(
          { texture: this.storageTexture },
          { texture: this.sampleTexture },
          { width: this.size.width, height: this.size.height, depthOrArrayLayers: 1 }
        )
      }

      if (this.renderPipeline && this.sampleTexture) {
        const view = this.context.getCurrentTexture().createView()
        const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store' }] })

        pass.setPipeline(this.renderPipeline)
        pass.setBindGroup(0, this.renderingBindGroup)
        pass.draw(3, 1, 0, 0)
        pass.end()
      }
      this.device.queue.submit([enc.finish()])

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


