// PATH: src/components/ar/DynamicNode.tsx  — CREATE
// Self-contained node factory.
// • Picks geometry (Sphere / Box / Cylinder) from modelType.
// • Starts fully invisible (opacity 0, scale 0.001).
// • Owns a canvas-texture Billboard sprite for its label.
// • All GSAP-driven reveal is triggered externally via the returned NodeRecord.

import * as THREE from "three";
import type { ARTopic, NodeRecord } from "./ar-types";

// ─── Context-aware label scale ───────────────────────────────────────
// neural-net → dense layout → tiny labels
// blockchain  → sparse layout → large bold labels
// default     → medium
function labelScaleForTopic(topicId: string): number {
  const scaleMap: Record<string, number> = {
    "neural-net": 0.28,
    "blockchain": 0.55,
    "kubernetes": 0.48,
    "bst":        0.40,
    "db-indexing":0.40,
    "sorting":    0.36,
    "tcp-ip":     0.44,
    "react-tree": 0.38,
  };
  return scaleMap[topicId] ?? 0.42;
}

// ─── Billboard canvas label ──────────────────────────────────────────
// Returns a THREE.Sprite whose SpriteMaterial renders a pill-shaped
// semi-transparent badge with the node's label text.
// THREE.Sprite always faces the camera automatically — equivalent to
// @react-three/drei's <Billboard /> behavior, zero extra code.
export function makeBillboardLabel(
  text: string,
  accentHex: string,
  topicId: string
): THREE.Sprite {
  const scale = labelScaleForTopic(topicId);

  // ── Measure text → size canvas exactly ──────────────────────────
  const FONT_SIZE = 18;
  const FONT      = `600 ${FONT_SIZE}px 'Orbitron', 'Courier New', monospace`;
  const PAD_X     = 12;
  const PAD_Y     = 8;

  const tmp = document.createElement("canvas");
  const tctx = tmp.getContext("2d")!;
  tctx.font = FONT;
  const textW = Math.ceil(tctx.measureText(text).width);

  const CW = textW + PAD_X * 2;
  const CH = FONT_SIZE + PAD_Y * 2;

  const canvas = document.createElement("canvas");
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  // Pill background
  const R = CH / 2;
  ctx.fillStyle = "rgba(2,0,12,0.72)";
  ctx.beginPath();
  ctx.moveTo(R, 0);
  ctx.arcTo(CW, 0,  CW, CH, R);
  ctx.arcTo(CW, CH, 0,  CH, R);
  ctx.arcTo(0,  CH, 0,  0,  R);
  ctx.arcTo(0,  0,  CW, 0,  R);
  ctx.closePath();
  ctx.fill();

  // Thin accent border
  ctx.strokeStyle = accentHex + "66";
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Text with glow
  ctx.shadowColor  = accentHex;
  ctx.shadowBlur   = 8;
  ctx.fillStyle    = accentHex;
  ctx.font         = FONT;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, CW / 2, CH / 2);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0,           // revealed during spawn animation
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  // Scale world-units proportional to canvas pixels × topic scale
  const worldW = (CW / 100) * 1.4 * scale;
  const worldH = (CH / 100) * 1.4 * scale;
  sprite.scale.set(worldW, worldH, 1);
  sprite.userData.isLabel = true;

  return sprite;
}

// ─── Geometry picker ─────────────────────────────────────────────────
type GeoType = "sphere" | "box" | "cylinder";

function geometryForModel(modelType: ARTopic["modelType"]): GeoType {
  switch (modelType) {
    case "chain":
    case "cluster":
    case "layers":
      return "box";
    case "bars":
      return "cylinder";
    default:
      return "sphere"; // tree, network, generic
  }
}

function buildGeometry(geoType: GeoType): THREE.BufferGeometry {
  switch (geoType) {
    case "box":
      return new THREE.BoxGeometry(0.42, 0.42, 0.42);
    case "cylinder":
      return new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
    default:
      return new THREE.SphereGeometry(0.22, 28, 28);
  }
}

// ─── Main factory ────────────────────────────────────────────────────
export interface CreateNodeOptions {
  id: string;
  label: string;
  position: THREE.Vector3;
  accentHex: string;
  topicId: string;
  modelType: ARTopic["modelType"];
  /** Parent group to attach to. */
  parent: THREE.Group;
  /** Optional override colour for this specific node. */
  colorHex?: string;
}

export function createDynamicNode(opts: CreateNodeOptions): NodeRecord {
  const {
    id, label, position, accentHex, topicId,
    modelType, parent, colorHex,
  } = opts;

  const accentColor = new THREE.Color(colorHex ?? accentHex);

  // ── Mesh ──────────────────────────────────────────────────────────
  const geoType = geometryForModel(modelType);
  const geo     = buildGeometry(geoType);
  const mat     = new THREE.MeshPhongMaterial({
    color:            accentColor,
    emissive:         accentColor,
    emissiveIntensity: 0,
    transparent:      true,
    opacity:          0,
    shininess:        120,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.scale.setScalar(0.001);          // hidden until spawned
  mesh.userData = { id, label, isNode: true, accentColor: accentColor.getHex() };
  mesh.castShadow = true;

  // ── Billboard label — lives 0.55 units above the mesh ────────────
  const billboard = makeBillboardLabel(label, accentHex, topicId);
  billboard.position.set(
    position.x,
    position.y + 0.35 + (labelScaleForTopic(topicId) * 0.1),
    position.z,
  );

  parent.add(mesh);
  parent.add(billboard);

  return {
    id,
    mesh,
    label: billboard,
    position: mesh.position,
    accentColor,
  };
}

// ─── Reveal animation (called by TimelineController via GSAP.call) ───
// Tweens opacity + scale + emissiveIntensity → full presence.
// Uses a lightweight RAF loop so it doesn't depend on GSAP for the
// per-frame interpolation (avoids another GSAP subscription).
export function revealNode(
  record: NodeRecord,
  effect: string = "fade-glow",
  durationMs: number = 700
): void {
  const mat    = record.mesh.material as THREE.MeshPhongMaterial;
  const start  = performance.now();

  // Easing: scale-in uses back-ease; flicker uses random noise; default is ease-out
  function easingFn(p: number): number {
    if (effect === "scale-in") {
      // Back ease for a "pop" feel
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    }
    // ease-out quad
    return 1 - (1 - p) * (1 - p);
  }

  function tick() {
    const elapsed = performance.now() - start;
    const raw     = Math.min(elapsed / durationMs, 1);
    const p       = easingFn(raw);

    // Flicker: add noise to emissive during reveal
    const flickerBoost = effect === "flicker"
      ? Math.random() * 0.6
      : 0;

    mat.opacity            = p;
    mat.emissiveIntensity  = p * 0.75 + flickerBoost;
    record.mesh.scale.setScalar(Math.max(0.001, p));

    // Reveal label slightly delayed
    const labelMat = record.label.material as THREE.SpriteMaterial;
    labelMat.opacity = Math.max(0, (raw - 0.4) / 0.6);

    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      mat.opacity           = 1;
      mat.emissiveIntensity = 0.65;
      record.mesh.scale.setScalar(1);
      labelMat.opacity      = 1;
    }
  }

  tick();
}

// ─── Highlight pulse (called for highlight events) ───────────────────
export function pulseNode(record: NodeRecord, durationMs = 800, overrideHex?: string): void {
  const mat    = record.mesh.material as THREE.MeshPhongMaterial;
  const origEI = mat.emissiveIntensity;
  const start  = performance.now();
  const col    = overrideHex ? new THREE.Color(overrideHex) : record.accentColor;

  function tick() {
    const p    = (performance.now() - start) / durationMs;
    const wave = Math.sin(p * Math.PI);
    mat.emissiveIntensity = origEI + wave * 2.2;
    mat.emissive.copy(col);
    if (p < 1) requestAnimationFrame(tick);
    else { mat.emissiveIntensity = origEI; mat.emissive.copy(record.accentColor); }
  }
  tick();
}

// ─── Breathing glow (called each rAF frame for alive nodes) ─────────
export function breatheNode(record: NodeRecord, time: number): void {
  const mat = record.mesh.material as THREE.MeshPhongMaterial;
  if (mat.opacity < 0.5) return;
  mat.emissiveIntensity = 0.55 + Math.sin(time * 1.4 + record.position.x * 1.3) * 0.18;
}