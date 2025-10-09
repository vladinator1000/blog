// Generated on 2025-10-08T20:13:20.815Z
import { useRef, useEffect, useId } from 'react'

export function RainShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)
  const elementId = useId()
  const shaderId = "Rain"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const runnerExists = checkRunnerExists(shaderId, elementId)

    if (!runnerExists) {
      runnerRef.current = new RainRunner({
        canvas,
        id: getRunnerId(shaderId, elementId),
        getUniformValues: () => {
          const selectedPresetName = (props && props.preset) ?? "Stoplight"
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
// Shader by baxin1919 https://www.shadertoy.com/view/WfsBRS
/*
{
  "params": [
    {
      "id": "u_speed",
      "label": "Speed",
      "range": {
        "min": 0,
        "max": 3,
        "step": 0.01
      }
    },
    {
      "id": "u_cycleLen",
      "label": "Cycle length",
      "range": {
        "min": 1,
        "max": 60,
        "step": 0.1
      }
    },
    {
      "id": "u_trailLen",
      "label": "Trail length",
      "range": {
        "min": 1,
        "max": 30,
        "step": 0.1
      }
    },
    {
      "id": "u_scale",
      "label": "Scale",
      "range": {
        "min": 8,
        "max": 128,
        "step": 2
      }
    },
    {
      "id": "u_hue",
      "label": "Hue",
      "range": {
        "min": 0,
        "max": 1,
        "step": 0.001
      }
    },
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_speed": 0.7,
        "u_hue": 0.57,
        "u_cycleLen": 20.0,
        "u_trailLen": 4.0,
        "u_scale": 30.0
      }
    },
    {
      "name": "The spoon",
      "values": {
        "u_speed": 0.7,
        "u_hue": 0.333,
        "u_cycleLen": 20.0,
        "u_trailLen": 4.0,
        "u_scale": 30.0
      }
    },
    {
      "name": "Stoplight",
      "values": {
        "u_speed": 0.666,
        "u_hue": 0,
        "u_cycleLen": 37.0,
        "u_trailLen": 5.9,
        "u_scale": 24
      }
    },
    {
      "name": "Dense",
      "values": {
        "u_speed": 0.69,
        "u_hue": 0.57,
        "u_cycleLen": 12.0,
        "u_trailLen": 8.0,
        "u_scale": 40.0
      }
    }
  ]
}
*/

@group(0) @binding(9)  var<uniform> u_speed: f32;
@group(0) @binding(10) var<uniform> u_cycleLen: f32;
@group(0) @binding(11) var<uniform> u_trailLen: f32;
@group(0) @binding(12) var<uniform> u_scale: f32;
@group(0) @binding(13) var<uniform> u_hue: f32;

// Less critical controls as shader constants (reduces uniform buffers count)
const OFFSET_SCALE: f32 = 100.0;
const CYCLE_LEN_RANGE: f32 = 3.0;
const TRAIL_LEN_RANGE: f32 = 6.0;
const BRIGHTNESS_POW: f32 = 3.0;
const HEAD_GLOW_EDGE: f32 = 6.0;
const SPEED_BASE: f32 = 1.0;

fn fract1(x: f32) -> f32 { return x - floor(x); }
fn fract3(v: vec3f) -> vec3f { return v - floor(v); }

fn hash3(p_in: vec3f) -> f32 {
  var p = fract3(p_in * 0.3183099 + 0.1);
  p = p * 17.0;
  return fract1(p.x * p.y * p.z * (p.x + p.y + p.z));
}

fn hsv2rgb(c: vec3f) -> vec3f {
  let K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract3(vec3f(c.x) + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, vec3f(0.0), vec3f(1.0)), c.y);
}

fn color_rain(ipos: vec2f, t: f32) -> vec3f {
  let col_hash = hash3(vec3f(ipos.x, 0.0, 0.0));
  let speed = SPEED_BASE + col_hash * 8.0;
  let offset = col_hash * OFFSET_SCALE;
  let hue = u_hue;

  let cycle_length = u_cycleLen + hash3(vec3f(ipos.x, 1.0, 0.0)) * CYCLE_LEN_RANGE;
  let trail_length = u_trailLen + hash3(vec3f(ipos.x, 2.0, 0.0)) * TRAIL_LEN_RANGE;

  let y_flow = t * speed + offset;
  let cycle_pos = (ipos.y + y_flow) - cycle_length * floor((ipos.y + y_flow) / cycle_length);

  var rain_col = vec3f(0.0);

  if (cycle_pos < trail_length) {
    let pos_in_trail = cycle_pos / max(trail_length, 1e-5);

    let cycle_id = floor((ipos.y + y_flow) / max(cycle_length, 1e-5));
    let char_hash = hash3(vec3f(ipos.x, cycle_id + ipos.y, 0.0));
    let char_val = fract1(char_hash * 314.15);

    let brightness = pow(pos_in_trail, BRIGHTNESS_POW);
    let head_glow = smoothstep(1.0, HEAD_GLOW_EDGE, pos_in_trail);

    let base_color = hsv2rgb(vec3f(hue, 1.0, 1.0));
    rain_col = base_color * (char_val * brightness);
    rain_col = rain_col + vec3f(1.0) * head_glow * char_val;
  }

  return rain_col;
}

@compute @workgroup_size(16, 16)
fn main_image(@builtin(global_invocation_id) id: vec3u) {
  let screen_size = textureDimensions(screen);
  if (id.x >= screen_size.x || id.y >= screen_size.y) { return; }

  let fragCoord = vec2f(f32(id.x) + 0.5, f32(screen_size.y - id.y) - 0.5);
  let res = vec2f(screen_size);
  let uv = (2.0 * fragCoord - res) / res.y;

  let t = time.elapsed * u_speed;

  let ipos = floor(uv * u_scale);
  let col = color_rain(ipos, t);

  textureStore(screen, id.xy, vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0));
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
  "uniforms": [
    {
      "name": "u_speed",
      "binding": 9,
      "size": 16
    },
    {
      "name": "u_cycleLen",
      "binding": 10,
      "size": 16
    },
    {
      "name": "u_trailLen",
      "binding": 11,
      "size": 16
    },
    {
      "name": "u_scale",
      "binding": 12,
      "size": 16
    },
    {
      "name": "u_hue",
      "binding": 13,
      "size": 16
    }
  ],
  "storage": [],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_speed": 0.7,
        "u_hue": 0.57,
        "u_cycleLen": 20,
        "u_trailLen": 4,
        "u_scale": 30
      }
    },
    {
      "name": "The spoon",
      "values": {
        "u_speed": 0.7,
        "u_hue": 0.333,
        "u_cycleLen": 20,
        "u_trailLen": 4,
        "u_scale": 30
      }
    },
    {
      "name": "Stoplight",
      "values": {
        "u_speed": 0.666,
        "u_hue": 0,
        "u_cycleLen": 37,
        "u_trailLen": 5.9,
        "u_scale": 24
      }
    },
    {
      "name": "Dense",
      "values": {
        "u_speed": 0.69,
        "u_hue": 0.57,
        "u_cycleLen": 12,
        "u_trailLen": 8,
        "u_scale": 40
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
                "id": 156883,
                "line": 169,
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
                "id": 156883,
                "line": 169,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 156883,
              "line": 169,
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
                "id": 156558,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 156559,
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
              "id": 156558,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156559,
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
              "id": 156562,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156563,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_speed",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 156592,
                "line": 107,
                "name": "group",
                "value": "0"
              },
              {
                "id": 156593,
                "line": 107,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 156592,
              "line": 107,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156593,
              "line": 107,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_scale",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 156604,
                "line": 110,
                "name": "group",
                "value": "0"
              },
              {
                "id": 156605,
                "line": 110,
                "name": "binding",
                "value": "12"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 12,
          "attributes": [
            {
              "id": 156604,
              "line": 110,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156605,
              "line": 110,
              "name": "binding",
              "value": "12"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_hue",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 156608,
                "line": 111,
                "name": "group",
                "value": "0"
              },
              {
                "id": 156609,
                "line": 111,
                "name": "binding",
                "value": "13"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 13,
          "attributes": [
            {
              "id": 156608,
              "line": 111,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156609,
              "line": 111,
              "name": "binding",
              "value": "13"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_cycleLen",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 156596,
                "line": 108,
                "name": "group",
                "value": "0"
              },
              {
                "id": 156597,
                "line": 108,
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
              "id": 156596,
              "line": 108,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156597,
              "line": 108,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_trailLen",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 156600,
                "line": 109,
                "name": "group",
                "value": "0"
              },
              {
                "id": 156601,
                "line": 109,
                "name": "binding",
                "value": "11"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 11,
          "attributes": [
            {
              "id": 156600,
              "line": 109,
              "name": "group",
              "value": "0"
            },
            {
              "id": 156601,
              "line": 109,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 169,
      "endLine": 183,
      "inUse": true,
      "calls": {},
      "name": "main_image",
      "attributes": [
        {
          "id": 156881,
          "line": 168,
          "name": "compute",
          "value": null
        },
        {
          "id": 156882,
          "line": 168,
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
export class RainRunner {
  constructor(options) {
    this.canvas = options.canvas
    this.alphaMode = options.alphaMode ?? 'premultiplied'
    this.getUniformValues = options.getUniformValues
    this.id = options.id ?? "runner:" + Math.random().toString(36).slice(2, 8)

    this.computePipelines = new Map()
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

      const { width, height } = this.size
      const encoder = this.device.createCommandEncoder()

      for (const [entryName, pipeline] of this.computePipelines) {
        const entryComputeMeta = META.computeMeta[entryName]
        const workgroupSize = META.workgroupSizes[entryName]
        const workgroupCount = entryComputeMeta?.workgroupCount
        const repeatTimes = entryComputeMeta?.dispatchCount ?? 1

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
      }

      if (this.storageTexture && this.sampleTexture) {
        encoder.copyTextureToTexture(
          { texture: this.storageTexture },
          { texture: this.sampleTexture },
          { width: this.size.width, height: this.size.height, depthOrArrayLayers: 1 }
        )
      }

      if (this.renderPipeline && this.sampleTexture) {
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


