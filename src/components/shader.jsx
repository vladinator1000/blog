// Generated on 2025-09-29T22:51:59.345Z
import { useRef, useEffect, useId } from 'react'

export function SlimeShader(props) {
  const canvasRef = useRef(null)
  const runnerRef = useRef(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1.0)
  const elementId = useId()
  const shaderId = "Slime"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const runnerExists = checkRunnerExists(shaderId, elementId)

    if (!runnerExists) {
      runnerRef.current = new SlimeRunner({
        canvas,
        id: getRunnerId(shaderId, elementId),
        getUniformValues: () => {
          const selectedPresetName = (props && props.preset) ?? "Fast growth"
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
      "id": "u_agentColor",
      "label": "Agent color"
    },
    {
      "id": "u_trailColor", 
      "label": "Trail color"
    },
    {
      "id": "u_backgroundColor",
      "label": "Background color"
    },
    {
      "id": "u_agentSize",
      "label": "Agent size",
      "range": {min: 0.5, max: 2, step: 0.1}
    },
    {
      "id": "u_agentSpeed",
      "label": "Agent speed"
    },
    {
      "id": "u_sensorAngle",
      "label": "Sensor angle",
      "range": {min: 0.1, max: 3, step: 0.1}
    },
    {
      "id": "u_sensorDistance",
      "label": "Sensor distance",
      "range": {min: 0.1, max: 12, step: 0.1}
    },
    {
      "id": "u_turnSpeed",
      "label": "Turn speed",
      "range": {min: 0.1, max: 3, step: 0.1}
    },
    {
      "id": "u_trailDecay",
      "label": "Trail decay",
      "range": {min: 0.1, max: 1, step: 0.01}
    },
    {
      "id": "u_diffusionRate",
      "label": "Diffusion rate"
    }
  ],
  "presets": [
    {
      "name": "Default",
      "values": {
        "u_agentColor": [1.0, 1.0, 1.0, 1.0],
        "u_trailColor": [0.8, 0.8, 0.8, 1.0],
        "u_backgroundColor": [0.1, 0.1, 0.1, 1.0],
        "u_agentSize": 1.0,
        "u_agentSpeed": 0.9,
        "u_sensorAngle": 0.7,
        "u_sensorDistance": 9.0,
        "u_turnSpeed": 1.6,
        "u_trailDecay": 0.985,
        "u_diffusionRate": 0.2
      }
    },
    {
      "name": "Organic",
      "values": {
        "u_agentColor": [0.7, 1.0, 0.8, 1.0],
        "u_trailColor": [0.5, 0.8, 0.6, 1.0],
        "u_backgroundColor": [0.02, 0.05, 0.03, 1.0],
        "u_agentSize": 1,
        "u_agentSpeed": 0.9,
        "u_sensorAngle": 2.1,
        "u_sensorDistance": 7,
        "u_turnSpeed": 2.9,
        "u_trailDecay": 0.99,
        "u_diffusionRate": 0.8
      }
    },
    {
      "name": "Electric",
      "values": {
        "u_agentColor": [1.0, 0.9, 0.0, 1.0],
        "u_trailColor": [0.2, 0.5, 0.9, 1.0],
        "u_backgroundColor": [0.0, 0.02, 0.08, 1.0],
        "u_agentSize": 1.3,
        "u_agentSpeed": 2.0,
        "u_sensorAngle": 0.8,
        "u_sensorDistance": 11.0,
        "u_turnSpeed": 1.8,
        "u_trailDecay": 0.93,
        "u_diffusionRate": 0.08
      }
    },
    {
      "name": "Fast growth",
      "values": {
        "u_agentColor": [1.0, 0.9, 0.7, 1.0],
        "u_trailColor": [0.9, 0.7, 0.5, 1.0],
        "u_backgroundColor": [0.05, 0.02, 0.1, 1.0],
        "u_agentSize": 1.9,
        "u_agentSpeed": 2.0,
        "u_sensorAngle": 0.3,
        "u_sensorDistance": 12.0,
        "u_turnSpeed": 1,
        "u_trailDecay": 0.99,
        "u_diffusionRate": 0.2
      }
    },
  ]
}
*/

const GRID_WIDTH: u32 = 480;
const GRID_HEIGHT: u32 = 270;
const NUM_AGENTS: u32 = 600;
const SEED_COUNT: u32 = 16; // number of starting colonies
const PI: f32 = 3.14159265359;

struct Agent {
  position: vec2f,
  angle: f32,
  _padding: f32,
}

@group(0) @binding(9) var<storage, read_write> agents: array<Agent, NUM_AGENTS>;
@group(0) @binding(10) var<storage, read_write> trailMapA: array<f32, GRID_WIDTH * GRID_HEIGHT>;
@group(0) @binding(11) var<storage, read_write> trailMapB: array<f32, GRID_WIDTH * GRID_HEIGHT>;

@group(0) @binding(12) var<uniform> u_agentColor: vec4f;
@group(0) @binding(13) var<uniform> u_trailColor: vec4f;
@group(0) @binding(14) var<uniform> u_backgroundColor: vec4f;
@group(0) @binding(21) var<uniform> u_agentSize: f32;
@group(0) @binding(15) var<uniform> u_agentSpeed: f32;
@group(0) @binding(16) var<uniform> u_sensorAngle: f32;
@group(0) @binding(17) var<uniform> u_sensorDistance: f32;
@group(0) @binding(18) var<uniform> u_turnSpeed: f32;
@group(0) @binding(19) var<uniform> u_trailDecay: f32;
@group(0) @binding(20) var<uniform> u_diffusionRate: f32;

fn hash(seed: u32) -> f32 {
  var x = seed;
  x = ((x >> 16u) ^ x) * 0x45d9f3bu;
  x = ((x >> 16u) ^ x) * 0x45d9f3bu;
  x = (x >> 16u) ^ x;
  return f32(x) / 4294967295.0;
}

fn hash2(seed: vec2u) -> f32 {
  return hash(seed.x + seed.y * 374761393u);
}

@compute @workgroup_size(64)
fn init_agents(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= NUM_AGENTS) { return; }
  
  if (time.elapsed > 0.01) { return; }
  
  let agent_id = id.x;
  let seed = agent_id + u32(time.elapsed * 1000.0);
  
  // Initialize agents clustered around multiple random seed centers
  let sid = agent_id % SEED_COUNT;
  let sseed = sid * 1664525u + 1013904223u; // different stream per seed
  let center = vec2f(
    (hash(sseed + 11u) * 0.7 + 0.15) * f32(GRID_WIDTH),
    (hash(sseed + 29u) * 0.7 + 0.15) * f32(GRID_HEIGHT)
  );
  let r = (hash(seed) * 1.0) * min(f32(GRID_WIDTH), f32(GRID_HEIGHT)) * 0.01; // compact blob
  let ang = hash(seed + 2u) * 2.0 * PI;
  let pos = center + vec2f(cos(ang), sin(ang)) * r;
  agents[agent_id].position = pos;
  agents[agent_id].angle = ang + (hash(seed + 5u) - 0.5) * 0.5;
}

@compute @workgroup_size(16, 16)
fn init_trail(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= GRID_WIDTH || id.y >= GRID_HEIGHT) { return; }
  
  if (time.elapsed > 0.01) { return; }
  
  let idx = id.x + id.y * GRID_WIDTH;
  trailMapA[idx] = 0.0;
  trailMapB[idx] = 0.0;
}

fn sampleTrail(pos: vec2f) -> f32 {
  // Wrap sample coordinates to avoid clamp-to-edge bias
  let gx = i32(GRID_WIDTH);
  let gy = i32(GRID_HEIGHT);
  let xi = ((i32(floor(pos.x)) % gx) + gx) % gx;
  let yi = ((i32(floor(pos.y)) % gy) + gy) % gy;
  let idx = u32(xi) + u32(yi) * GRID_WIDTH;
  // Read from the CURRENT trail buffer (B)
  return trailMapB[idx];
}

@compute @workgroup_size(64)
fn update_agents(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= NUM_AGENTS) { return; }
  // Warm-up: wait a moment so init passes clear buffers
  if (time.elapsed < 0.02) { return; }
  
  let agent_id = id.x;
  var agent = agents[agent_id];
  
  // Sensor positions
  let sensorDist = u_sensorDistance * u_agentSize;
  let sensorAngle = u_sensorAngle;
  
  let frontDir = vec2f(cos(agent.angle), sin(agent.angle));
  let leftDir = vec2f(cos(agent.angle - sensorAngle), sin(agent.angle - sensorAngle));
  let rightDir = vec2f(cos(agent.angle + sensorAngle), sin(agent.angle + sensorAngle));
  
  let frontPos = agent.position + frontDir * sensorDist;
  let leftPos = agent.position + leftDir * sensorDist;
  let rightPos = agent.position + rightDir * sensorDist;
  
  // Sample trail concentrations
  let frontTrail = sampleTrail(frontPos);
  let leftTrail = sampleTrail(leftPos);
  let rightTrail = sampleTrail(rightPos);
  
  // Steering behavior
  let seed = agent_id + u32(time.elapsed * 1000.0);
  let randomSteer = (hash(seed) - 0.5) * 0.05;
  
  if (frontTrail > leftTrail && frontTrail > rightTrail) {
    // Continue forward
    agent.angle += randomSteer;
  } else if (leftTrail > rightTrail) {
    // Turn left
    agent.angle -= u_turnSpeed * time.delta * 60.0 * 0.02 + randomSteer;
  } else if (rightTrail > leftTrail) {
    // Turn right
    agent.angle += u_turnSpeed * time.delta * 60.0 * 0.02 + randomSteer;
  } else {
    // Random turn
    agent.angle += (hash(seed + 1u) - 0.5) * u_turnSpeed * time.delta * 60.0 * 0.02;
  }
  
  // Move forward
  let direction = vec2f(cos(agent.angle), sin(agent.angle));
  agent.position += direction * u_agentSpeed * time.delta * 60.0;
  
  // Wrap around boundaries
  agent.position.x = (agent.position.x + f32(GRID_WIDTH)) % f32(GRID_WIDTH);
  agent.position.y = (agent.position.y + f32(GRID_HEIGHT)) % f32(GRID_HEIGHT);
  
  agents[agent_id] = agent;
  
  // Deposit trail
  let x = clamp(i32(agent.position.x), 0, i32(GRID_WIDTH) - 1);
  let y = clamp(i32(agent.position.y), 0, i32(GRID_HEIGHT) - 1);
  let idx = u32(x) + u32(y) * GRID_WIDTH;
  
  // Deposit into CURRENT buffer (B)
  trailMapB[idx] = min(trailMapB[idx] + 1.0 * u_agentSize, 10.0);
}

@compute @workgroup_size(16, 16)
fn diffuse_trail(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= GRID_WIDTH || id.y >= GRID_HEIGHT) { return; }
  // Warm-up: avoid diffusing uninitialized buffers
  if (time.elapsed < 0.02) { return; }
  
  let idx = id.x + id.y * GRID_WIDTH;
  var sum = 0.0;
  var count = 0.0;
  
  // 3x3 diffusion kernel
  for (var dy = -1i; dy <= 1i; dy++) {
    for (var dx = -1i; dx <= 1i; dx++) {
      let nx = (i32(id.x) + dx + i32(GRID_WIDTH)) % i32(GRID_WIDTH);
      let ny = (i32(id.y) + dy + i32(GRID_HEIGHT)) % i32(GRID_HEIGHT);
      let nidx = u32(nx) + u32(ny) * GRID_WIDTH;
      
      // Diffuse from CURRENT buffer (B) into A
      sum += trailMapB[nidx];
      count += 1.0;
    }
  }
  
  let diffused = sum / count;
  let current = trailMapB[idx];
  
  // Apply diffusion and decay
  trailMapA[idx] = mix(current, diffused, u_diffusionRate) * u_trailDecay;
}

@compute @workgroup_size(16, 16)
fn commit_trail(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= GRID_WIDTH || id.y >= GRID_HEIGHT) { return; }
  
  let idx = id.x + id.y * GRID_WIDTH;
  
  if (time.elapsed > 0.01) {
    // Make B the committed buffer for the next frame
    trailMapB[idx] = trailMapA[idx];
  }
}

@compute @workgroup_size(16, 16)
fn main_image(@builtin(global_invocation_id) id: vec3u) {
  let screen_size = textureDimensions(screen);
  
  if (id.x >= screen_size.x || id.y >= screen_size.y) { return; }
  
  // Map screen coordinates to simulation grid
  let grid_x = id.x * GRID_WIDTH / screen_size.x;
  let grid_y = id.y * GRID_HEIGHT / screen_size.y;
  let idx = grid_x + grid_y * GRID_WIDTH;
  
  // Render from the committed/current buffer (B)
  let trail = trailMapB[idx];
  // Nonlinear tone mapping to emphasize thin filaments
  let t = clamp(trail * (0.12 / max(u_agentSize, 0.0001)), 0.0, 1.0);
  let normalizedTrail = pow(t, 0.6);
  // Hide very faint deposits in the very first frames
  let vis = smoothstep(0.06, 0.6, normalizedTrail);

  // Color blend
  // Use u_agentColor to tint higher-concentration areas, and u_trailColor for lower ones
  let agentMix = smoothstep(0.3, 1.0, normalizedTrail);
  let trailTint = mix(u_trailColor, u_agentColor, agentMix);
  var color = mix(u_backgroundColor, trailTint, vis);
  
  textureStore(screen, id.xy, color);
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
      "name": "u_agentColor",
      "binding": 12,
      "size": 16
    },
    {
      "name": "u_trailColor",
      "binding": 13,
      "size": 16
    },
    {
      "name": "u_backgroundColor",
      "binding": 14,
      "size": 16
    },
    {
      "name": "u_agentSize",
      "binding": 21,
      "size": 16
    },
    {
      "name": "u_agentSpeed",
      "binding": 15,
      "size": 16
    },
    {
      "name": "u_sensorAngle",
      "binding": 16,
      "size": 16
    },
    {
      "name": "u_sensorDistance",
      "binding": 17,
      "size": 16
    },
    {
      "name": "u_turnSpeed",
      "binding": 18,
      "size": 16
    },
    {
      "name": "u_trailDecay",
      "binding": 19,
      "size": 16
    },
    {
      "name": "u_diffusionRate",
      "binding": 20,
      "size": 16
    }
  ],
  "storage": [
    {
      "name": "agents",
      "binding": 9,
      "size": 9600,
      "usage": 140
    },
    {
      "name": "trailMapA",
      "binding": 10,
      "size": 518400,
      "usage": 140
    },
    {
      "name": "trailMapB",
      "binding": 11,
      "size": 518400,
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
                "id": 52496,
                "line": 166,
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
                "id": 52496,
                "line": 166,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 52496,
              "line": 166,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
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
              "id": 52322,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52323,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "agents",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52379,
                "line": 138,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52380,
                "line": 138,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 9600,
            "count": 600,
            "stride": 16,
            "format": {
              "name": "Agent",
              "attributes": null,
              "size": 16,
              "members": [
                {
                  "name": "position",
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
                  "name": "angle",
                  "type": {
                    "name": "f32",
                    "attributes": null,
                    "size": 4
                  },
                  "attributes": null,
                  "offset": 8,
                  "size": 4
                },
                {
                  "name": "_padding",
                  "type": {
                    "name": "f32",
                    "attributes": null,
                    "size": 4
                  },
                  "attributes": null,
                  "offset": 12,
                  "size": 4
                }
              ],
              "align": 8,
              "startLine": 132,
              "endLine": 136,
              "inUse": true
            }
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 52379,
              "line": 138,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52380,
              "line": 138,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        }
      ],
      "overrides": [],
      "startLine": 166,
      "endLine": 186,
      "inUse": true,
      "calls": {},
      "name": "init_agents",
      "attributes": [
        {
          "id": 52494,
          "line": 165,
          "name": "compute",
          "value": null
        },
        {
          "id": 52495,
          "line": 165,
          "name": "workgroup_size",
          "value": "64"
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
                "id": 52627,
                "line": 189,
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
                "id": 52627,
                "line": 189,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 52627,
              "line": 189,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
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
              "id": 52322,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52323,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "trailMapA",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52384,
                "line": 139,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52385,
                "line": 139,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 52384,
              "line": 139,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52385,
              "line": 139,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "trailMapB",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52392,
                "line": 140,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52393,
                "line": 140,
                "name": "binding",
                "value": "11"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 11,
          "attributes": [
            {
              "id": 52392,
              "line": 140,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52393,
              "line": 140,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        }
      ],
      "overrides": [],
      "startLine": 189,
      "endLine": 197,
      "inUse": true,
      "calls": {},
      "name": "init_trail",
      "attributes": [
        {
          "id": 52625,
          "line": 188,
          "name": "compute",
          "value": null
        },
        {
          "id": 52626,
          "line": 188,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
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
                "id": 52726,
                "line": 211,
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
                "id": 52726,
                "line": 211,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 52726,
              "line": 211,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
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
              "id": 52322,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52323,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "agents",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52379,
                "line": 138,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52380,
                "line": 138,
                "name": "binding",
                "value": "9"
              }
            ],
            "size": 9600,
            "count": 600,
            "stride": 16,
            "format": {
              "name": "Agent",
              "attributes": null,
              "size": 16,
              "members": [
                {
                  "name": "position",
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
                  "name": "angle",
                  "type": {
                    "name": "f32",
                    "attributes": null,
                    "size": 4
                  },
                  "attributes": null,
                  "offset": 8,
                  "size": 4
                },
                {
                  "name": "_padding",
                  "type": {
                    "name": "f32",
                    "attributes": null,
                    "size": 4
                  },
                  "attributes": null,
                  "offset": 12,
                  "size": 4
                }
              ],
              "align": 8,
              "startLine": 132,
              "endLine": 136,
              "inUse": true
            }
          },
          "group": 0,
          "binding": 9,
          "attributes": [
            {
              "id": 52379,
              "line": 138,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52380,
              "line": 138,
              "name": "binding",
              "value": "9"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "u_sensorDistance",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52424,
                "line": 148,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52425,
                "line": 148,
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
              "id": 52424,
              "line": 148,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52425,
              "line": 148,
              "name": "binding",
              "value": "17"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_agentSize",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52412,
                "line": 145,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52413,
                "line": 145,
                "name": "binding",
                "value": "21"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 21,
          "attributes": [
            {
              "id": 52412,
              "line": 145,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52413,
              "line": 145,
              "name": "binding",
              "value": "21"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_sensorAngle",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52420,
                "line": 147,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52421,
                "line": 147,
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
              "id": 52420,
              "line": 147,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52421,
              "line": 147,
              "name": "binding",
              "value": "16"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "trailMapB",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52392,
                "line": 140,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52393,
                "line": 140,
                "name": "binding",
                "value": "11"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 11,
          "attributes": [
            {
              "id": 52392,
              "line": 140,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52393,
              "line": 140,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "u_turnSpeed",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52428,
                "line": 149,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52429,
                "line": 149,
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
              "id": 52428,
              "line": 149,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52429,
              "line": 149,
              "name": "binding",
              "value": "18"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_agentSpeed",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52416,
                "line": 146,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52417,
                "line": 146,
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
              "id": 52416,
              "line": 146,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52417,
              "line": 146,
              "name": "binding",
              "value": "15"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 211,
      "endLine": 271,
      "inUse": true,
      "calls": {},
      "name": "update_agents",
      "attributes": [
        {
          "id": 52724,
          "line": 210,
          "name": "compute",
          "value": null
        },
        {
          "id": 52725,
          "line": 210,
          "name": "workgroup_size",
          "value": "64"
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
                "id": 53027,
                "line": 274,
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
                "id": 53027,
                "line": 274,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 53027,
              "line": 274,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
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
              "id": 52322,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52323,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "trailMapB",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52392,
                "line": 140,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52393,
                "line": 140,
                "name": "binding",
                "value": "11"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 11,
          "attributes": [
            {
              "id": 52392,
              "line": 140,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52393,
              "line": 140,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "trailMapA",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52384,
                "line": 139,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52385,
                "line": 139,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 52384,
              "line": 139,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52385,
              "line": 139,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "u_diffusionRate",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52436,
                "line": 151,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52437,
                "line": 151,
                "name": "binding",
                "value": "20"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 20,
          "attributes": [
            {
              "id": 52436,
              "line": 151,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52437,
              "line": 151,
              "name": "binding",
              "value": "20"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_trailDecay",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52432,
                "line": 150,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52433,
                "line": 150,
                "name": "binding",
                "value": "19"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 19,
          "attributes": [
            {
              "id": 52432,
              "line": 150,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52433,
              "line": 150,
              "name": "binding",
              "value": "19"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 274,
      "endLine": 301,
      "inUse": true,
      "calls": {},
      "name": "diffuse_trail",
      "attributes": [
        {
          "id": 53025,
          "line": 273,
          "name": "compute",
          "value": null
        },
        {
          "id": 53026,
          "line": 273,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
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
                "id": 53155,
                "line": 304,
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
                "id": 53155,
                "line": 304,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 53155,
              "line": 304,
              "name": "builtin",
              "value": "global_invocation_id"
            }
          ]
        }
      ],
      "returnType": null,
      "resources": [
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
              "id": 52322,
              "line": 4,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52323,
              "line": 4,
              "name": "binding",
              "value": "1"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "trailMapB",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52392,
                "line": 140,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52393,
                "line": 140,
                "name": "binding",
                "value": "11"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 11,
          "attributes": [
            {
              "id": 52392,
              "line": 140,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52393,
              "line": 140,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "trailMapA",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52384,
                "line": 139,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52385,
                "line": 139,
                "name": "binding",
                "value": "10"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 10,
          "attributes": [
            {
              "id": 52384,
              "line": 139,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52385,
              "line": 139,
              "name": "binding",
              "value": "10"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        }
      ],
      "overrides": [],
      "startLine": 304,
      "endLine": 313,
      "inUse": true,
      "calls": {},
      "name": "commit_trail",
      "attributes": [
        {
          "id": 53153,
          "line": 303,
          "name": "compute",
          "value": null
        },
        {
          "id": 53154,
          "line": 303,
          "name": "workgroup_size",
          "value": [
            "16",
            "16"
          ]
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
                "id": 53196,
                "line": 316,
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
                "id": 53196,
                "line": 316,
                "name": "builtin",
                "value": "global_invocation_id"
              }
            ],
            "size": 12
          },
          "attributes": [
            {
              "id": 53196,
              "line": 316,
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
                "id": 52318,
                "line": 3,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52319,
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
              "id": 52318,
              "line": 3,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52319,
              "line": 3,
              "name": "binding",
              "value": "0"
            }
          ],
          "resourceType": 4,
          "access": "read"
        },
        {
          "name": "trailMapB",
          "type": {
            "name": "array",
            "attributes": [
              {
                "id": 52392,
                "line": 140,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52393,
                "line": 140,
                "name": "binding",
                "value": "11"
              }
            ],
            "size": 518400,
            "count": 129600,
            "stride": 4,
            "format": {
              "name": "f32",
              "attributes": null,
              "size": 4
            }
          },
          "group": 0,
          "binding": 11,
          "attributes": [
            {
              "id": 52392,
              "line": 140,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52393,
              "line": 140,
              "name": "binding",
              "value": "11"
            }
          ],
          "resourceType": 1,
          "access": "read_write"
        },
        {
          "name": "u_agentSize",
          "type": {
            "name": "f32",
            "attributes": [
              {
                "id": 52412,
                "line": 145,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52413,
                "line": 145,
                "name": "binding",
                "value": "21"
              }
            ],
            "size": 4
          },
          "group": 0,
          "binding": 21,
          "attributes": [
            {
              "id": 52412,
              "line": 145,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52413,
              "line": 145,
              "name": "binding",
              "value": "21"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_trailColor",
          "type": {
            "name": "vec4f",
            "attributes": [
              {
                "id": 52404,
                "line": 143,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52405,
                "line": 143,
                "name": "binding",
                "value": "13"
              }
            ],
            "size": 16
          },
          "group": 0,
          "binding": 13,
          "attributes": [
            {
              "id": 52404,
              "line": 143,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52405,
              "line": 143,
              "name": "binding",
              "value": "13"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_agentColor",
          "type": {
            "name": "vec4f",
            "attributes": [
              {
                "id": 52400,
                "line": 142,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52401,
                "line": 142,
                "name": "binding",
                "value": "12"
              }
            ],
            "size": 16
          },
          "group": 0,
          "binding": 12,
          "attributes": [
            {
              "id": 52400,
              "line": 142,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52401,
              "line": 142,
              "name": "binding",
              "value": "12"
            }
          ],
          "resourceType": 0,
          "access": "read"
        },
        {
          "name": "u_backgroundColor",
          "type": {
            "name": "vec4f",
            "attributes": [
              {
                "id": 52408,
                "line": 144,
                "name": "group",
                "value": "0"
              },
              {
                "id": 52409,
                "line": 144,
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
              "id": 52408,
              "line": 144,
              "name": "group",
              "value": "0"
            },
            {
              "id": 52409,
              "line": 144,
              "name": "binding",
              "value": "14"
            }
          ],
          "resourceType": 0,
          "access": "read"
        }
      ],
      "overrides": [],
      "startLine": 316,
      "endLine": 341,
      "inUse": true,
      "calls": {},
      "name": "main_image",
      "attributes": [
        {
          "id": 53194,
          "line": 315,
          "name": "compute",
          "value": null
        },
        {
          "id": 53195,
          "line": 315,
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
        "u_agentColor": [
          1,
          1,
          1,
          1
        ],
        "u_trailColor": [
          0.8,
          0.8,
          0.8,
          1
        ],
        "u_backgroundColor": [
          0.1,
          0.1,
          0.1,
          1
        ],
        "u_agentSize": 1,
        "u_agentSpeed": 0.9,
        "u_sensorAngle": 0.7,
        "u_sensorDistance": 9,
        "u_turnSpeed": 1.6,
        "u_trailDecay": 0.985,
        "u_diffusionRate": 0.2
      }
    },
    {
      "name": "Organic",
      "values": {
        "u_agentColor": [
          0.7,
          1,
          0.8,
          1
        ],
        "u_trailColor": [
          0.5,
          0.8,
          0.6,
          1
        ],
        "u_backgroundColor": [
          0.02,
          0.05,
          0.03,
          1
        ],
        "u_agentSize": 1,
        "u_agentSpeed": 0.9,
        "u_sensorAngle": 2.1,
        "u_sensorDistance": 7,
        "u_turnSpeed": 2.9,
        "u_trailDecay": 0.99,
        "u_diffusionRate": 0.8
      }
    },
    {
      "name": "Electric",
      "values": {
        "u_agentColor": [
          1,
          0.9,
          0,
          1
        ],
        "u_trailColor": [
          0.2,
          0.5,
          0.9,
          1
        ],
        "u_backgroundColor": [
          0,
          0.02,
          0.08,
          1
        ],
        "u_agentSize": 1.3,
        "u_agentSpeed": 2,
        "u_sensorAngle": 0.8,
        "u_sensorDistance": 11,
        "u_turnSpeed": 1.8,
        "u_trailDecay": 0.93,
        "u_diffusionRate": 0.08
      }
    },
    {
      "name": "Fast growth",
      "values": {
        "u_agentColor": [
          1,
          0.9,
          0.7,
          1
        ],
        "u_trailColor": [
          0.9,
          0.7,
          0.5,
          1
        ],
        "u_backgroundColor": [
          0.05,
          0.02,
          0.1,
          1
        ],
        "u_agentSize": 1.9,
        "u_agentSpeed": 2,
        "u_sensorAngle": 0.3,
        "u_sensorDistance": 12,
        "u_turnSpeed": 1,
        "u_trailDecay": 0.99,
        "u_diffusionRate": 0.2
      }
    }
  ]
}

// https://developer.chrome.com/docs/web-platform/webgpu/from-webgl-to-webgpu
export class SlimeRunner {
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
    if (this.disposed) return

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
        { binding: 1, resource: this.bilinear },
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
    for (const buf of this.uniformBuffers.values()) {
      buf.destroy()
    }
    for (const buf of this.storageBuffers.values()) {
      buf.destroy()
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


