// Generated on 2025-09-27T01:31:35.241Z
import { useRef, useEffect } from 'react'

export function SpiralShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    runnerRef.current = new SpiralRunner({
      canvas,
      getUniformValues: () => {
        const selectedPresetName = (props && props.preset) ?? "Default"
        const overrides = (props && props.overrides) ?? {"u_density":0}

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

    const handleMouseMove = (e) => {
      if (!runnerRef.current) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      runnerRef.current.setMousePosition(x, y)

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
      "id": "u_colorBack",
      "label": "Background",
      "group": "Colors",
    },
    {
      "id": "u_colorFront", 
      "label": "Foreground",
      "group": "Colors",
    },
    {
      "id": "u_density",
      "label": "Density",
      "group": "Shape",
      "hint": "How spiral the shape is",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
    {
      "id": "u_distortion",
      "label": "Distortion",
      "group": "Shape", 
      "hint": "Warps the pattern",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
    {
      "id": "u_softness",
      "label": "Softness",
      "group": "Shape",
      "range": { "min": 0, "max": 0.01, "step": 0.0001 }
    },
    {
      "id": "u_strokeWidth",
      "label": "Width",
      "group": "Stroke",
      "range": { "min": 0.005, "max": 1, "step": 0.005 }
    },
    {
      "id": "u_strokeCap",
      "label": "Cap",
      "group": "Stroke",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
    {
      "id": "u_strokeTaper",
      "label": "Taper", 
      "group": "Stroke",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
    {
      "id": "u_noise",
      "label": "Amount",
      "group": "Noise",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
    {
      "id": "u_noiseFrequency",
      "label": "Frequency",
      "group": "Noise",
      "range": { "min": 0, "max": 1, "step": 0.01 }
    },
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_colorBack": [0.04, 0.05, 0.08, 1.0],
        "u_colorFront": [0.95, 0.80, 0.25, 1.0],
        "u_density": 0.5,
        "u_distortion": 0.1,
        "u_strokeWidth": 0.8,
        "u_strokeCap": 0.1,
        "u_strokeTaper": 0.1,
        "u_noise": 0.35,
        "u_noiseFrequency": 0.4,
        "u_softness": 0.0025
      }
    },
    {
      "name": "Hypnotic",
      "values": {
        "u_colorBack": [0.1, 0.0, 0.2, 1.0],
        "u_colorFront": [0.0, 0.8, 0.9, 1.0],
        "u_density": 0.7,
        "u_distortion": 0.3,
        "u_strokeWidth": 0.5,
        "u_strokeCap": 0.0,
        "u_strokeTaper": 0.3,
        "u_noise": 0.5,
        "u_noiseFrequency": 0.6,
        "u_softness": 0.005
      }
    },
    {
      "name": "Sunset",
      "values": {
        "u_colorBack": [0.9, 0.4, 0.2, 1.0],
        "u_colorFront": [1.0, 0.9, 0.6, 1.0],
        "u_density": 0.3,
        "u_distortion": 0.05,
        "u_strokeWidth": 0.9,
        "u_strokeCap": 0.2,
        "u_strokeTaper": 0.0,
        "u_noise": 0.1,
        "u_noiseFrequency": 0.2,
        "u_softness": 0.001
      }
    },
    {
      "name": "Organic",
      "values": {
        "u_colorBack": [0.05, 0.1, 0.05, 1.0],
        "u_colorFront": [0.4, 0.9, 0.3, 1.0],
        "u_density": 0.6,
        "u_distortion": 0.4,
        "u_strokeWidth": 0.6,
        "u_strokeCap": 0.5,
        "u_strokeTaper": 0.4,
        "u_noise": 0.8,
        "u_noiseFrequency": 0.7,
        "u_softness": 0.008
      }
    }
  ]
}
*/


@group(0) @binding(9) var<uniform> u_colorBack: vec4f;
@group(0) @binding(10) var<uniform> u_colorFront: vec4f;
@group(0) @binding(11) var<uniform> u_density: f32;
@group(0) @binding(12) var<uniform> u_distortion: f32;
@group(0) @binding(13) var<uniform> u_strokeWidth: f32;
@group(0) @binding(14) var<uniform> u_strokeCap: f32;
@group(0) @binding(15) var<uniform> u_strokeTaper: f32;
@group(0) @binding(16) var<uniform> u_noise: f32;
@group(0) @binding(17) var<uniform> u_noiseFrequency: f32;
@group(0) @binding(18) var<uniform> u_softness: f32;

const PI: f32 = 3.141592653589793;
const TWO_PI: f32 = PI * 2.0;

fn fract(x: f32) -> f32 { return x - floor(x); }
fn fract2(v: vec2f) -> vec2f { return v - floor(v); }

fn hash21(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract2(p);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn mix(a: f32, b: f32, t: f32) -> f32 { return a * (1.0 - t) + b * t; }


@compute @workgroup_size(16, 16)
fn main_image(@builtin(global_invocation_id) id: vec3u) {
  let screen_size = textureDimensions(screen);
  if (id.x >= screen_size.x || id.y >= screen_size.y) { return; }

  // Pixel coords, origin bottom-left; normalize to 0..1
  let fragCoord = vec2f(f32(id.x) + 0.5, f32(screen_size.y - id.y) - 0.5);
  let res = vec2f(screen_size);
  let uv01 = fragCoord / res;

  // Map to -1..1 space
  var uv = (uv01 * 2.0 - 1.0);

  // Time
  let t = time.elapsed * 0.1;

  // Density shaping
  var l = length(uv);
  let density = clamp(u_density, 0.0, 1.0);
  l = pow(l, density);

  // Angle and normalization
  let angle = atan2(uv.y, uv.x) - t;
  var angleNormalised = angle / TWO_PI;

  // Noise perturbation
  angleNormalised = angleNormalised + 0.125 * u_noise * (
    valueNoise(16.0 * pow(u_noiseFrequency, 3.0) * uv)
  );

  // Stripe logic
  var off = l + angleNormalised;
  off = off - u_distortion * (sin(4.0 * l - 0.5 * t) * cos(PI + l + 0.5 * t));
  let stripe = fract(off);
  let shape = 2.0 * abs(stripe - 0.5);
  var width = 1.0 - clamp(u_strokeWidth, 0.005 * u_strokeTaper, 1.0);

  // Caps and tapering
  let wCap = mix(width, (1.0 - stripe) * (1.0 - step(0.5, stripe)), (1.0 - clamp(l, 0.0, 1.0)));
  width = mix(width, wCap, u_strokeCap);
  width = width * (1.0 - clamp(u_strokeTaper, 0.0, 1.0) * l);

  // Approximate pixel size
  let fw = 1.0 / max(res.x, res.y);
  let fwMult = 4.0 - 3.0 * (smoothstep(0.05, 0.4, 2.0 * u_strokeWidth) * smoothstep(0.05, 0.4, 2.0 * (1.0 - u_strokeWidth)));
  var pixelSize = mix(fwMult * fw, fw, clamp(fw, 0.0, 1.0));
  pixelSize = mix(pixelSize, 0.002, u_strokeCap * (1.0 - clamp(l, 0.0, 1.0)));

  let mask = smoothstep(width - pixelSize - u_softness, width + pixelSize + u_softness, shape);

  // Foreground/background blending
  let fgColor = u_colorFront.rgb * u_colorFront.a;
  let fgOpacity = u_colorFront.a;
  let bgColor = u_colorBack.rgb * u_colorBack.a;
  let bgOpacity = u_colorBack.a;

  var color = fgColor * mask;
  var opacity = fgOpacity * mask;
  color = color + bgColor * (1.0 - opacity);
  opacity = opacity + bgOpacity * (1.0 - opacity);

  // Output
  let outCol = vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), clamp(opacity, 0.0, 1.0));
  textureStore(screen, id.xy, outCol);
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
      "name": "u_colorBack",
      "binding": 9,
      "size": 16
    },
    {
      "name": "u_colorFront",
      "binding": 10,
      "size": 16
    },
    {
      "name": "u_density",
      "binding": 11,
      "size": 16
    },
    {
      "name": "u_distortion",
      "binding": 12,
      "size": 16
    },
    {
      "name": "u_strokeWidth",
      "binding": 13,
      "size": 16
    },
    {
      "name": "u_strokeCap",
      "binding": 14,
      "size": 16
    },
    {
      "name": "u_strokeTaper",
      "binding": 15,
      "size": 16
    },
    {
      "name": "u_noise",
      "binding": 16,
      "size": 16
    },
    {
      "name": "u_noiseFrequency",
      "binding": 17,
      "size": 16
    },
    {
      "name": "u_softness",
      "binding": 18,
      "size": 16
    }
  ],
  "storage": [],
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
                "id": 5814,
                "line": 179,
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
                "id": 5814,
                "line": 179,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 5814,
              "line": 179,
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
                "id": 5618,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5619,
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
              "id": 5618,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5619,
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
              "id": 5622,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5623,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_density",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5660,
                "line": 144,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5661,
                "line": 144,
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
              "id": 5660,
              "line": 144,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5661,
              "line": 144,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_noise",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5680,
                "line": 149,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5681,
                "line": 149,
                "name": "binding",
                "value": "16"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 16,
          "attributes": [
            {
              "id": 5680,
              "line": 149,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5681,
              "line": 149,
              "name": "binding",
              "value": "16"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_noiseFrequency",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5684,
                "line": 150,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5685,
                "line": 150,
                "name": "binding",
                "value": "17"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 17,
          "attributes": [
            {
              "id": 5684,
              "line": 150,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5685,
              "line": 150,
              "name": "binding",
              "value": "17"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_distortion",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5664,
                "line": 145,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5665,
                "line": 145,
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
              "id": 5664,
              "line": 145,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5665,
              "line": 145,
              "name": "binding",
              "value": "12"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_strokeWidth",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5668,
                "line": 146,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5669,
                "line": 146,
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
              "id": 5668,
              "line": 146,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5669,
              "line": 146,
              "name": "binding",
              "value": "13"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_strokeTaper",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5676,
                "line": 148,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5677,
                "line": 148,
                "name": "binding",
                "value": "15"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 15,
          "attributes": [
            {
              "id": 5676,
              "line": 148,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5677,
              "line": 148,
              "name": "binding",
              "value": "15"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_strokeCap",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5672,
                "line": 147,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5673,
                "line": 147,
                "name": "binding",
                "value": "14"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 14,
          "attributes": [
            {
              "id": 5672,
              "line": 147,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5673,
              "line": 147,
              "name": "binding",
              "value": "14"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_softness",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 5688,
                "line": 151,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5689,
                "line": 151,
                "name": "binding",
                "value": "18"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 18,
          "attributes": [
            {
              "id": 5688,
              "line": 151,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5689,
              "line": 151,
              "name": "binding",
              "value": "18"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_colorFront",
          "type": {
            "name": "vec4f",
            "attributes": [
              {
                "id": 5656,
                "line": 143,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5657,
                "line": 143,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 16
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 5656,
              "line": 143,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5657,
              "line": 143,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_colorBack",
          "type": {
            "name": "vec4f",
            "attributes": [
              {
                "id": 5652,
                "line": 142,
                "name": "group",
                "value": "0"
              },
              {
                "id": 5653,
                "line": 142,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 16
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 5652,
              "line": 142,
              "name": "group",
              "value": "0"
            },
            {
              "id": 5653,
              "line": 142,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 179,
      "endLine": 242,
      "inUse": true,
      "calls": {},
      "name": "main_image",
      "attributes": [
        {
          "id": 5812,
          "line": 178,
          "name": "compute",
          "value": null
        },
        {
          "id": 5813,
          "line": 178,
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
        "u_colorBack": [
          0.04,
          0.05,
          0.08,
          1
        ],
        "u_colorFront": [
          0.95,
          0.8,
          0.25,
          1
        ],
        "u_density": 0.5,
        "u_distortion": 0.1,
        "u_strokeWidth": 0.8,
        "u_strokeCap": 0.1,
        "u_strokeTaper": 0.1,
        "u_noise": 0.35,
        "u_noiseFrequency": 0.4,
        "u_softness": 0.0025
      }
    },
    {
      "name": "Hypnotic",
      "values": {
        "u_colorBack": [
          0.1,
          0,
          0.2,
          1
        ],
        "u_colorFront": [
          0,
          0.8,
          0.9,
          1
        ],
        "u_density": 0.7,
        "u_distortion": 0.3,
        "u_strokeWidth": 0.5,
        "u_strokeCap": 0,
        "u_strokeTaper": 0.3,
        "u_noise": 0.5,
        "u_noiseFrequency": 0.6,
        "u_softness": 0.005
      }
    },
    {
      "name": "Sunset",
      "values": {
        "u_colorBack": [
          0.9,
          0.4,
          0.2,
          1
        ],
        "u_colorFront": [
          1,
          0.9,
          0.6,
          1
        ],
        "u_density": 0.3,
        "u_distortion": 0.05,
        "u_strokeWidth": 0.9,
        "u_strokeCap": 0.2,
        "u_strokeTaper": 0,
        "u_noise": 0.1,
        "u_noiseFrequency": 0.2,
        "u_softness": 0.001
      }
    },
    {
      "name": "Organic",
      "values": {
        "u_colorBack": [
          0.05,
          0.1,
          0.05,
          1
        ],
        "u_colorFront": [
          0.4,
          0.9,
          0.3,
          1
        ],
        "u_density": 0.6,
        "u_distortion": 0.4,
        "u_strokeWidth": 0.6,
        "u_strokeCap": 0.5,
        "u_strokeTaper": 0.4,
        "u_noise": 0.8,
        "u_noiseFrequency": 0.7,
        "u_softness": 0.008
      }
    }
  ]
}

export class SpiralRunner {
  constructor(opts) {
    this.canvas = opts.canvas
    this.alphaMode = opts.alphaMode ?? 'premultiplied'
    this.getUniformValues = opts.getUniformValues

    this.computePipelines = []
    this.uniformBuffers = new Map()
    this.storageBuffers = new Map()
    this.startTime = 0
    this.prevTime = 0
    this.frameCount = 0
    this.size = { width: 0, height: 0 }
    this.mouse = {
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

    for (const storage of META.storage) {
      const buf = this.device.createBuffer({ size: storage.size, usage: storage.usage, mappedAtCreation: true })
      new Uint8Array(buf.getMappedRange()).fill(0)
      buf.unmap()
      this.storageBuffers.set(storage.name, buf)
    }

    const numSystemBindings = 9

    const computeModule = this.device.createShaderModule({ code: USER_SHADER })
    const bindGroupLayout = this.device.createBindGroupLayout({
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
        bindGroupLayouts: [bindGroupLayout],
      }),
      compute: { module: computeModule, entryPoint: entryPoint.name }
    }))
    
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
            ...META.storage.map(storage => ({ binding: storage.binding, resource: { buffer: this.storageBuffers.get(storage.name) } })),
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
