// Generated on 2025-10-11T22:51:17.175Z
import { useRef, useEffect, useId } from 'react'

export function PongShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)
  const elementId = useId()
  const shaderId = "Pong"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const runnerExists = checkRunnerExists(shaderId, elementId)

    if (!runnerExists) {
      runnerRef.current = new PongRunner({
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
// Shader by Draradech https://compute.toys/view/1586

/*
{
  "params": [
    {
      "id": "u_speed",
      "label": "Speed",
      "range": { "min": 0.0, "max": 500.0, "step": 1.0 }
    },
    {
      "id": "u_hueOffset",
      "label": "Hue Offset",
      "range": { "min": 0.0, "max": 1.0, "step": 0.01 }
    },
    {
      "id": "u_seed",
      "label": "Seed",
      "range": { "min": 0.0, "max": 1000, "step": 1.0 }
    },
    {
      "id": "u_background",
      "label": "Background color",
    }
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_speed": 10,
        "u_hueOffset": 1.0,
        "u_seed": 320,
        "u_background": [0.4, 0.4, 0.4, 1.0]
      }
    }
  ],
  "compute": {
    "init": { "workgroupCount": [1, 27, 1], "dispatchMode": "once" },
    "simulate": { "workgroupCount": [1, 1, 1] }
  }
}
*/

const CELLS_X: u32 = 48;
const CELLS_Y: u32 = 27;
const CELLS = vec2i(i32(CELLS_X), i32(CELLS_Y));
const NUM_PLAYERS = 6u;
const START_EMPTY = true;

struct Player {
    pos: vec2f,
    vel: vec2f,
    color: vec3f
}

@group(0) @binding(9) var<storage, read_write> board: array<array<u32, CELLS_X>, CELLS_Y>;
@group(0) @binding(10) var<storage, read_write> player: array<Player, NUM_PLAYERS>;
@group(0) @binding(11) var<uniform> u_speed: f32;
@group(0) @binding(12) var<uniform> u_hueOffset: f32;
@group(0) @binding(13) var<uniform> u_seed: f32;
@group(0) @binding(14) var<uniform> u_background: vec4f;

fn fmod(a: vec3f, b: vec3f) -> vec3f
{
    return modf(a / b).fract * b;
}

fn fmodf(a: vec3f, b: f32) -> vec3f
{
    return fmod(a, vec3f(b));
}

fn hsv2rgbSmooth(c: vec3f) -> vec3f
{
    var rgb = abs(fmodf(c.x * 6. + vec3f(0., 4., 2.), 6.) - 3.) - 1.;
	rgb = smoothstep(vec3f(0.), vec3f(1.), rgb);
	return c.z * mix(vec3f(1.), rgb, c.y);
}

fn pcg3d(vin: vec3u) -> vec3u
{
    var v = vin * 1664525u + 1013904223u;
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    v ^= v >> vec3u(16u);
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    return v;
}

fn pcg3df(vin: vec3u) -> vec3f
{
    return vec3f(pcg3d(vin)) / f32(0xffffffffu);
}

@compute @workgroup_size(CELLS_X)
fn init(@builtin(global_invocation_id) id: vec3u)
{
    var owner = id.x * NUM_PLAYERS / u32(CELLS.x);
    if (START_EMPTY) {owner = 0xffffffffu;}
    board[id.y][id.x] = owner;
    if (id.y == 0 && id.x < NUM_PLAYERS)
    {
        player[id.x].pos = pcg3df(vec3u(id.xy, u32(u_seed))).xy;
        let xcpp = f32(CELLS.x) / f32(NUM_PLAYERS);
        player[id.x].pos.x = (f32(id.x) + .5) * xcpp;
        player[id.x].pos.y = player[id.x].pos.y * f32(CELLS.y - 1) + .5;
        player[id.x].vel = normalize(pcg3df(vec3u(id.xy, u32(u_seed + 1))).xy * 2. - 1.) * .01;
        //player[id.x].vel = (pcg3df(vec3u(id.xy, u32(u_seed + 1))).xy * 2. - 1.) * .01;
    }
}

fn edgeBounce(p: u32)
{
    let r = .5;
    let fcells = vec2f(CELLS);
    if (player[p].pos.x + r > fcells.x)
    {
        player[p].vel.x *= -1.;
        player[p].pos.x -= 2. * (player[p].pos.x + r - fcells.x);
    }
    if (player[p].pos.x - r < 0.)
    {
        player[p].vel.x *= -1.;
        player[p].pos.x -= 2. * (player[p].pos.x - r);
    }
    if (player[p].pos.y + r > fcells.y)
    {
        player[p].vel.y *= -1.;
        player[p].pos.y -= 2. * (player[p].pos.y + r - fcells.y);
    }
    if (player[p].pos.y - r < 0.)
    {
        player[p].vel.y *= -1.;
        player[p].pos.y -= 2. * (player[p].pos.y - r);
    }
}

fn collide(p: u32)
{
    let r = .5;
    let r1 = 1. -r;
    var delta = vec2i(1, 1);
    var ipos = vec2i(player[p].pos);
    board[ipos.y][ipos.x] = p;
    let flipx = (player[p].vel.x < 0);
    if (flipx) {
        delta.x *= -1;
        player[p].pos.x *= -1.;
        player[p].vel.x *= -1.;
    }
    let flipy = (player[p].vel.y < 0);
    if (flipy) {
        delta.y *= -1;
        player[p].pos.y *= -1.;
        player[p].vel.y *= -1.;
    }
    if (fract(player[p].pos.y) > r1 && board[ipos.y + delta.y][ipos.x] != p)
    {
        board[ipos.y + delta.y][ipos.x] = p;
        player[p].pos.y -= 2. * fract(player[p].pos.y + r);
        player[p].vel.y *= -1.;
    }
    if (fract (player[p].pos.x) > r1 && board[ipos.y][ipos.x + delta.x] != p)
    {
        board[ipos.y][ipos.x + delta.x] = p;
        player[p].pos.x -= 2. * fract(player[p].pos.x + r);
        player[p].vel.x *= -1.;
    }
    if (fract (player[p].pos.x) > r1 && fract(player[p].pos.y) > r1 && board[ipos.y + delta.y][ipos.x + delta.x] != p)
    {
        let d = length(vec2f(1.) - fract(player[p].pos));
        if (d < r)
        {
            board[ipos.y + delta.y][ipos.x + delta.x] = p;
            let normal = normalize(fract(player[p].pos) - vec2f(1.));
            player[p].vel = player[p].vel - 2. * dot(player[p].vel, normal) * normal;
        }
    }
    if (fract (player[p].pos.x) < r && fract(player[p].pos.y) > r1 && board[ipos.y + delta.y][ipos.x - delta.x] != p)
    {
        let d = length(vec2f(0., 1.) - fract(player[p].pos));
        if (d < r)
        {
            board[ipos.y + delta.y][ipos.x - delta.x] = p;
            let normal = normalize(fract(player[p].pos) - vec2f(0., 1.));
            player[p].vel = player[p].vel - 2. * dot(player[p].vel, normal) * normal;
        }
    }
    if (fract (player[p].pos.x) > r1 && fract(player[p].pos.y) < r && board[ipos.y - delta.y][ipos.x + delta.x] != p)
    {
        let d = length(vec2f(1., 0.) - fract(player[p].pos));
        if (d < r)
        {
            board[ipos.y - delta.y][ipos.x + delta.x] = p;
            let normal = normalize(fract(player[p].pos) - vec2f(1., 0.));
            player[p].vel = player[p].vel - 2. * dot(player[p].vel, normal) * normal;
        }
    }
    if (flipx) {
        player[p].pos.x *= -1.;
        player[p].vel.x *= -1.;
    }
    if (flipy) {
        player[p].pos.y *= -1.;
        player[p].vel.y *= -1.;
    }
}

@compute @workgroup_size(NUM_PLAYERS)
fn simulate(@builtin(global_invocation_id) id: vec3u)
{
    let fcells = vec2f(CELLS);
    let p = id.x;
    for(var i = 0u; i < u32(u_speed); i++)
    {
        player[p].pos += player[p].vel;
        edgeBounce(p);
        collide(p);
    }
}

fn playerColor(player: u32) -> vec3f{
    if (player >= NUM_PLAYERS) {
        return u_background.xyz;
    }

    var waves = NUM_PLAYERS / 8u + 1;
    var hue = f32(player % waves) * (1. / f32(waves)) + f32(player / waves) / f32(NUM_PLAYERS);
    return hsv2rgbSmooth(vec3f(u_hueOffset + hue, .3, .85));
}

@compute @workgroup_size(16, 16)
fn draw(@builtin(global_invocation_id) id: vec3u)
{
    let screenSize = vec2i(textureDimensions(screen));
    let screenSizeAR = vec2i((screenSize.y * CELLS.x / CELLS.y), (screenSize.x * CELLS.y / CELLS.x));
    let screenSizeM = min(screenSize, screenSizeAR);
    let off = (screenSize - screenSizeM) / 2;
    let mid = vec2i(id.xy) - off;
    if (all(mid < screenSizeM) && all(mid >= vec2i(0)))
    {
        let c = mid * vec2i(CELLS) / screenSizeM;
        let cb = (mid - vec2i(1)) * vec2i(CELLS) / screenSizeM;
        let cn = (mid + vec2i(1)) * vec2i(CELLS) / screenSizeM;
        var col = playerColor(board[c.y][c.x]);

        if (any(cb != c) || any(cn != c)) {
            // Edges between cells
            col *= .74;
        }       
        
        for (var i = 0u; i < NUM_PLAYERS; i++)
        {
            let pcol = playerColor(i);
            let d = length(vec2f(mid) + vec2f(.5) - player[i].pos * vec2f(screenSizeM) / vec2f(CELLS));
            let r = f32(screenSizeM.x) / f32(CELLS.x) / 2 - .5;
            let m = smoothstep(-.1, .1, d - r);
            col = mix(pcol * .8, col, m);
            let m2 = smoothstep(-.5, .5, abs(d - r)-1.0);
            
            let outlineStrength = 1.8;

            col = mix(pcol * outlineStrength, col, m2);
        }

        col = pow(col, vec3f(2.2));
        textureStore(screen, id.xy, vec4f(col, 1.));
    }
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
      "name": "u_speed",
      "binding": 11,
      "size": 16
    },
    {
      "name": "u_hueOffset",
      "binding": 12,
      "size": 16
    },
    {
      "name": "u_seed",
      "binding": 13,
      "size": 16
    },
    {
      "name": "u_background",
      "binding": 14,
      "size": 16
    }
  ],
  "storage": [
    {
      "name": "board",
      "binding": 9,
      "size": 5184,
      "usage": 140
    },
    {
      "name": "player",
      "binding": 10,
      "size": 256,
      "usage": 140
    }
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_speed": 10,
        "u_hueOffset": 1,
        "u_seed": 320,
        "u_background": [
          0.4,
          0.4,
          0.4,
          1
        ]
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
                "id": 7027,
                "line": 106,
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
                "id": 7027,
                "line": 106,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 7027,
              "line": 106,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
        {
          "name": "board",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6838,
                "line": 67,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6839,
                "line": 67,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 5184,
            "count": 27,
            "stride": 192,
            "format": {
              "name": "array",
              "attributes": null,
              "size": 192,
              "count": 48,
              "stride": 4,
              "format": {
                "name": "u32",
                "attributes": null,
                "size": 4
              }
            }
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 6838,
              "line": 67,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6839,
              "line": 67,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "player",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6846,
                "line": 68,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6847,
                "line": 68,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 192,
            "count": 6,
            "stride": 32,
            "format": {
              "name": "Player",
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
                  "name": "vel",
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
                  "name": "color",
                  "type": {
                    "name": "vec3f",
                    "attributes": null,
                    "size": 12
                  },
                  "attributes": null,
                  "offset": 16,
                  "size": 12
                }
              ],
              "align": 16,
              "startLine": 61,
              "endLine": 65,
              "inUse": true
            }
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 6846,
              "line": 68,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6847,
              "line": 68,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "u_seed",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 6859,
                "line": 71,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6860,
                "line": 71,
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
              "id": 6859,
              "line": 71,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6860,
              "line": 71,
              "name": "binding",
              "value": "13"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 106,
      "endLine": 120,
      "inUse": true,
      "calls": {},
      "name": "init",
      "attributes": [
        {
          "id": 7025,
          "line": 105,
          "name": "compute",
          "value": null
        },
        {
          "id": 7026,
          "line": 105,
          "name": "workgroup_size",
          "value": "CELLS_X"
        }
      ]
    },
    {
      "stage": "compute",
      "inputs": [
        {
          "name": "id",
          "type": {
            "name": "vec3u",
            "attributes": [
              {
                "id": 8022,
                "line": 220,
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
                "id": 8022,
                "line": 220,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 8022,
              "line": 220,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
        {
          "name": "u_speed",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 6851,
                "line": 69,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6852,
                "line": 69,
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
              "id": 6851,
              "line": 69,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6852,
              "line": 69,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "player",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6846,
                "line": 68,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6847,
                "line": 68,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 192,
            "count": 6,
            "stride": 32,
            "format": {
              "name": "Player",
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
                  "name": "vel",
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
                  "name": "color",
                  "type": {
                    "name": "vec3f",
                    "attributes": null,
                    "size": 12
                  },
                  "attributes": null,
                  "offset": 16,
                  "size": 12
                }
              ],
              "align": 16,
              "startLine": 61,
              "endLine": 65,
              "inUse": true
            }
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 6846,
              "line": 68,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6847,
              "line": 68,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "board",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6838,
                "line": 67,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6839,
                "line": 67,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 5184,
            "count": 27,
            "stride": 192,
            "format": {
              "name": "array",
              "attributes": null,
              "size": 192,
              "count": 48,
              "stride": 4,
              "format": {
                "name": "u32",
                "attributes": null,
                "size": 4
              }
            }
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 6838,
              "line": 67,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6839,
              "line": 67,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        }
      ],
      "overrides": [],
      "startLine": 220,
      "endLine": 230,
      "inUse": true,
      "calls": {},
      "name": "simulate",
      "attributes": [
        {
          "id": 8020,
          "line": 219,
          "name": "compute",
          "value": null
        },
        {
          "id": 8021,
          "line": 219,
          "name": "workgroup_size",
          "value": "NUM_PLAYERS"
        }
      ]
    },
    {
      "stage": "compute",
      "inputs": [
        {
          "name": "id",
          "type": {
            "name": "vec3u",
            "attributes": [
              {
                "id": 8115,
                "line": 243,
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
                "id": 8115,
                "line": 243,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 8115,
              "line": 243,
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
                "id": 6774,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6775,
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
              "id": 6774,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6775,
              "line": 3,
              "name": "binding",
              "value": "0"
            }
          ],
          "resourceType": 4,
          "access": "read"
        },
        {
          "name": "board",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6838,
                "line": 67,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6839,
                "line": 67,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 5184,
            "count": 27,
            "stride": 192,
            "format": {
              "name": "array",
              "attributes": null,
              "size": 192,
              "count": 48,
              "stride": 4,
              "format": {
                "name": "u32",
                "attributes": null,
                "size": 4
              }
            }
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 6838,
              "line": 67,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6839,
              "line": 67,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "player",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 6846,
                "line": 68,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6847,
                "line": 68,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 192,
            "count": 6,
            "stride": 32,
            "format": {
              "name": "Player",
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
                  "name": "vel",
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
                  "name": "color",
                  "type": {
                    "name": "vec3f",
                    "attributes": null,
                    "size": 12
                  },
                  "attributes": null,
                  "offset": 16,
                  "size": 12
                }
              ],
              "align": 16,
              "startLine": 61,
              "endLine": 65,
              "inUse": true
            }
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 6846,
              "line": 68,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6847,
              "line": 68,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "u_background",
          "type": {
            "name": "vec4f",
            "attributes": [
              {
                "id": 6863,
                "line": 72,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6864,
                "line": 72,
                "name": "binding",
                "value": "14"
              }
            ],
            "size": 16
          },
          "group": 0,
          "binding": 14,
          "attributes": [
            {
              "id": 6863,
              "line": 72,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6864,
              "line": 72,
              "name": "binding",
              "value": "14"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_hueOffset",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 6855,
                "line": 70,
                "name": "group",
                "value": "0"
              },
              {
                "id": 6856,
                "line": 70,
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
              "id": 6855,
              "line": 70,
              "name": "group",
              "value": "0"
            },
            {
              "id": 6856,
              "line": 70,
              "name": "binding",
              "value": "12"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 243,
      "endLine": 279,
      "inUse": true,
      "calls": {},
      "name": "draw",
      "attributes": [
        {
          "id": 8113,
          "line": 242,
          "name": "compute",
          "value": null
        },
        {
          "id": 8114,
          "line": 242,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
        }
      ]
    }
  ],
  "computeMeta": {
    "init": {
      "workgroupCount": [
        1,
        27,
        1
      ],
      "dispatchMode": "once"
    },
    "simulate": {
      "workgroupCount": [
        1,
        1,
        1
      ]
    }
  },
  "workgroupSizes": {
    "init": [
      48,
      16
    ],
    "simulate": [
      6,
      16
    ],
    "draw": [
      16,
      16
    ]
  }
}

// https://developer.chrome.com/docs/web-platform/webgpu/from-webgl-to-webgpu
export class PongRunner {
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


