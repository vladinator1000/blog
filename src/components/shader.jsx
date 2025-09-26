// Generated on 2025-09-26T23:49:43.751Z
import { useRef, useEffect } from 'react'

export function DefaultShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    runnerRef.current = new DefaultRunner({
      canvas,
      getUniformValues: () => {},
    })

    const handleMouseMove = (e) => {
      if (!runnerRef.current) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      runnerRef.current.setMousePosition(x, y)

      // Calculate delta movement
      const dx = x - lastMousePos.current.x
      const dy = y - lastMousePos.current.y
      runnerRef.current.setMouseDelta(dx, dy)

      lastMousePos.current = { x, y }
    }

    const handleMouseDown = (e) => {
      if (!runnerRef.current) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      runnerRef.current.setMouseDownPosition(x, y)
      // Map button values to match shader specification:
      // no click - 0, left button - 1, right button - 2
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
      // Simple zoom implementation - could be enhanced
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
struct Mouse { pos: vec2i, zoom: f32, click: i32, start: vec2i, delta: vec2i };
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

// struct Mouse { pos: vec2i, zoom: f32, click: i32, start: vec2i, delta: vec2i };,
// @group(0) @binding(2) var<uniform> mouse: Mouse;

// Using the mouse:
// mouse.pos - current mouse position (vec2i)
// mouse.zoom - zoom level (f32, default = 1.0)
// mouse.click - click state (i32, none = 0, left = 1, right = 3)
// mouse.start - mouse down position (vec2i)
// mouse.delta - movement since last mouse event (vec2i)

// @group(0) @binding(3) var nearest: sampler;
// @group(0) @binding(4) var bilinear: sampler;
// @group(0) @binding(5) var trilinear: sampler;
// @group(0) @binding(6) var nearest_repeat: sampler;
// @group(0) @binding(7) var bilinear_repeat: sampler;
// @group(0) @binding(8) var trilinear_repeat: sampler;

// Your uniforms here
// @group(0) @binding(9) var<uniform> u_one: f32;
// @group(0) @binding(10) var<uniform> u_two: f32;

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

    // Time varying pixel colour
    var col = .5 + .5 * cos(time.elapsed + uv.xyx + vec3f(0.,2.,4.));

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
  "presets": {
    "presets": [
      {
        "name": "Default",
        "values": {
          "u_one": 0.5,
          "u_two": 0.5
        }
      }
    ],
    "parameterInfo": {
      "u_one": {
        "id": "u_one",
        "label": "One",
        "range": {
          "min": 0,
          "max": 1,
          "step": 0.01
        }
      },
      "u_two": {
        "id": "u_two",
        "label": "Two",
        "range": {
          "min": 0,
          "max": 1,
          "step": 0.01
        }
      }
    }
  },
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
                "id": 25661,
                "line": 66,
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
                "id": 25661,
                "line": 66,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 25661,
              "line": 66,
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
                "id": 25625,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 25626,
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
              "id": 25625,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 25626,
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
              "id": 25629,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 25630,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 66,
      "endLine": 87,
      "inUse": true,
      "calls": {},
      "name": "main_image",
      "attributes": [
        {
          "id": 25659,
          "line": 65,
          "name": "compute",
          "value": null
        },
        {
          "id": 25660,
          "line": 65,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
        }
      ]
    }
  ],
  "uniforms": [],
  "storages": []
}

export class DefaultRunner {
  canvas
  alphaMode
  getUniformValues
  device
  context
  format
  storageTex
  sampleTex
  timeBuffer
  mouseBuffer
  computePipelines = []
  renderPipeline
  uniformBuffers = new Map()
  storageBuffers = new Map()

  // Samplers
  nearest
  bilinear
  trilinear
  nearestRepeat
  bilinearRepeat
  trilinearRepeat

  frameHandle
  startTime = 0
  prevTime = 0
  frameCount = 0
  size = { width: 0, height: 0 }

  mouse = {
    pos: { x: 0, y: 0 },
    zoom: 1.0,
    click: 0,
    start: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
  }

  constructor(opts) {
    this.canvas = opts.canvas
    this.alphaMode = opts.alphaMode ?? 'premultiplied'
    this.getUniformValues = opts.getUniformValues

    if (!navigator.gpu) {
      throw new Error('WebGPU not supported')
    }
    this.resize()
    this.init()
  }

  async init() {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) throw new Error('No GPU adapter')
    
    this.device = await adapter.requestDevice()

    this.context = this.canvas.getContext('webgpu')
    if (!this.context) throw new Error('No WebGPU context')

    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device: this.device, format: this.format, alphaMode: this.alphaMode })

    this.timeBuffer = this.device.createBuffer({ size: 16, usage: 72 })
    this.mouseBuffer = this.device.createBuffer({ size: 32, usage: 72 })

    // Samplers
    this.nearest = this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
    this.bilinear = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
    this.trilinear = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
    this.nearestRepeat = this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'repeat', addressModeV: 'repeat' })
    this.bilinearRepeat = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' })
    this.trilinearRepeat = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' })

    this.recreateTextures()

    for (const u of META.uniforms) {
      const buf = this.device.createBuffer({ size: u.size, usage: 72 })
      this.uniformBuffers.set(u.name, buf)
    }

    for (const storage of META.storages) {
      const buf = this.device.createBuffer({ size: storage.size, usage: storage.usage, mappedAtCreation: true })
      new Uint8Array(buf.getMappedRange()).fill(0)
      buf.unmap()
      this.storageBuffers.set(storage.name, buf)
    }

    const computeModule = this.device.createShaderModule({ code: USER_SHADER })
    this.computePipelines = META.compute.map((entryPoint) => this.device.createComputePipeline({ layout: 'auto', compute: { module: computeModule, entryPoint } }))
    
    const renderingModule = this.device.createShaderModule({ code: RENDER_SHADER })
    this.renderPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: renderingModule, entryPoint: 'vertex_main' },
      fragment: { module: renderingModule, entryPoint: 'fragment_main',
      targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' }
    })
  }

  recreateTextures() {
    if (!this.device) return
    this.storageTex?.destroy()
    this.sampleTex?.destroy()

    const { width, height } = this.size
    if (width <= 0 || height <= 0) return

    this.storageTex = this.device.createTexture({
      size: { width, height },
      format: 'rgba8unorm',
      usage: 11
    })
    this.sampleTex = this.device.createTexture({ size: { width, height }, format: 'rgba8unorm', usage: 6 })
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
      this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([elapsed, delta, this.frameCount, 0]))
      this.device.queue.writeBuffer(this.mouseBuffer, 0, new Float32Array([
        this.mouse.pos.x,
        this.mouse.pos.y,
        this.mouse.zoom,
        this.mouse.click,
        this.mouse.start.x,
        this.mouse.start.y,
        this.mouse.delta.x,
        this.mouse.delta.y
      ]))
      this.frameCount++


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
        const bind = this.device.createBindGroup({
          layout: pipe.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: this.storageTex.createView() },
            { binding: 1, resource: { buffer: this.timeBuffer } },
            { binding: 2, resource: { buffer: this.mouseBuffer } },
            { binding: 3, resource: this.nearest },
            { binding: 4, resource: this.bilinear },
            { binding: 5, resource: this.trilinear },
            { binding: 6, resource: this.nearestRepeat },
            { binding: 7, resource: this.bilinearRepeat },
            { binding: 8, resource: this.trilinearRepeat },
            ...META.uniforms.map(uniform => ({ binding: uniform.binding, resource: { buffer: this.uniformBuffers.get(uniform.name) } })),
            ...META.storages.map(storage => ({ binding: storage.binding, resource: { buffer: this.storageBuffers.get(storage.name) } })),
          ]
        })

        const pass = enc.beginComputePass()
        pass.setPipeline(pipe)
        pass.setBindGroup(0, bind)
        pass.dispatchWorkgroups(Math.ceil(this.size.width/16), Math.ceil(this.size.height/16))
        pass.end()
      }

      if (this.storageTex && this.sampleTex) {
        enc.copyTextureToTexture(
          { texture: this.storageTex },
          { texture: this.sampleTex },
          { width: this.size.width, height: this.size.height, depthOrArrayLayers: 1 }
        )
      }

      if (this.renderPipeline && this.sampleTex) {
        const view = this.context.getCurrentTexture().createView()
        const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store' }] })
        const bindGroup = this.device.createBindGroup({ layout: this.renderPipeline.getBindGroupLayout(0), entries: [
          { binding: 0, resource: this.sampleTex.createView() },
          { binding: 1, resource: this.nearest },
        ]})
        pass.setPipeline(this.renderPipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(3, 1, 0, 0)
        pass.end()
      }
      this.device.queue.submit([enc.finish()])
      this.frameHandle = requestAnimationFrame(frame)
    }

    this.frameHandle = requestAnimationFrame(frame)
  }

  setMousePosition(x, y) {
    this.mouse.pos.x = x
    this.mouse.pos.y = y
  }
  setMouseZoom(zoom) {
    this.mouse.zoom = zoom
  }
  setMouseClickState(click) {
    this.mouse.click = click
  }
  setMouseDownPosition(x, y) {
    this.mouse.start.x = x
    this.mouse.start.y = y
  }
  setMouseDelta(dx, dy) {
    this.mouse.delta.x = dx
    this.mouse.delta.y = dy
  }
}
