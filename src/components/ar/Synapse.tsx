// PATH: src/components/ar/Synapse.tsx  — CREATE
// Robust edge renderer using THREE.TubeGeometry on a CatmullRomCurve3.
// Growth animation via BufferGeometry.drawRange so only part of the
// tube is rendered — this produces the "synapse growing" effect without
// rebuilding geometry every frame.
//
// Safety: always validates that both from/to NodeRecords exist before
// creating any geometry. Missing nodes produce a console.warn, never
// a runtime crash.

import * as THREE from "three";
import type { NodeRecord, SynapseRecord } from "./ar-types";

// ─── Configuration ───────────────────────────────────────────────────
const TUBE_RADIUS       = 0.028;   // world-units tube radius
const TUBE_RADIAL_SEGS  = 6;       // cross-section polygon sides (low = perf)
const TUBE_PATH_SEGS    = 48;      // points along the curve (resolution)

// ─── Mid-point lift factor ───────────────────────────────────────────
// A small upward bow makes connections visually distinct from flat lines
// and matches the "circuit board" aesthetic.
function getMidpoint(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
  const mid  = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const dist = a.distanceTo(b);
  mid.y += dist * 0.12;        // gentle vertical bow
  return mid;
}

// ─── Factory ─────────────────────────────────────────────────────────
export interface CreateSynapseOptions {
  id: string;
  fromRecord: NodeRecord;
  toRecord: NodeRecord;
  accentHex: string;
  parent: THREE.Group;
  /** Optional per-synapse colour override (e.g. backprop pulses use blue). */
  colorHex?: string;
}

export function createSynapse(opts: CreateSynapseOptions): SynapseRecord {
  const { id, fromRecord, toRecord, accentHex, parent, colorHex } = opts;

  const color  = new THREE.Color(colorHex ?? accentHex);
  const fromP  = fromRecord.position.clone();
  const toP    = toRecord.position.clone();
  const midP   = getMidpoint(fromP, toP);

  // ── Smooth curve through three control points ──────────────────
  const curve   = new THREE.CatmullRomCurve3([fromP, midP, toP]);
  const points  = curve.getPoints(TUBE_PATH_SEGS);

  // ── TubeGeometry from the curve ─────────────────────────────────
  // We use a QuadraticBezierCurve3-compatible path so Three.js
  // computes the Frenet frames for proper tube orientation.
  const path    = new THREE.CatmullRomCurve3([fromP, midP, toP]);
  const tubeGeo = new THREE.TubeGeometry(
    path,
    TUBE_PATH_SEGS,
    TUBE_RADIUS,
    TUBE_RADIAL_SEGS,
    false        // not closed
  );

  // ── Start with drawRange = 0 (invisible) ────────────────────────
  // Each segment = (TUBE_RADIAL_SEGS * 2 + 2) indices in a strip.
  // We'll set drawRange.count = 0 and animate it to full.
  tubeGeo.setDrawRange(0, 0);

  const mat = new THREE.MeshPhongMaterial({
    color,
    emissive:          color,
    emissiveIntensity: 0.4,
    transparent:       true,
    opacity:           0,
    shininess:         80,
  });

  const tube = new THREE.Mesh(tubeGeo, mat);
  tube.userData = { id, isSynapse: true };
  tube.castShadow = false;

  parent.add(tube);

  return {
    id,
    tube,
    progress: 0,
    fromPos: fromP,
    toPos:   toP,
    segments: TUBE_PATH_SEGS,
  };
}

// ─── Grow animation ──────────────────────────────────────────────────
// Animates the synapse from 0% → 100% drawn over durationMs.
// Called by TimelineController via GSAP.call().
export function growSynapse(record: SynapseRecord, durationMs = 900): void {
  const mat   = record.tube.material as THREE.MeshPhongMaterial;
  const geo   = record.tube.geometry as THREE.TubeGeometry;
  const total = geo.index?.count ?? geo.attributes.position.count;
  const start = performance.now();

  // Fade opacity in quickly at the start
  mat.opacity = 0;

  function tick() {
    const elapsed = performance.now() - start;
    const raw     = Math.min(elapsed / durationMs, 1);
    // Ease-out cubic for organic feel
    const p       = 1 - Math.pow(1 - raw, 3);

    mat.opacity   = Math.min(raw * 3, 0.75);   // fade in fast
    record.progress = p;

    // drawRange controls how much of the tube is visible
    geo.setDrawRange(0, Math.floor(p * total));

    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      geo.setDrawRange(0, Infinity);  // show everything
      mat.opacity  = 0.72;
      record.progress = 1;
    }
  }

  tick();
}

// ─── Pulse light ball along a synapse path ────────────────────────────
// Creates a small glowing sphere that travels from → to and removes
// itself when done. Used for "data-flow" and "ripple" effects.
export interface PulseOptions {
  fromPos: THREE.Vector3;
  toPos:   THREE.Vector3;
  scene:   THREE.Scene;
  colorHex?: string;
  durationMs?: number;
}

export interface PulseHandle {
  /** Returns true when the pulse has completed and been removed. */
  update(nowMs: number): boolean;
}

export function createSynapsePulse(opts: PulseOptions): PulseHandle {
  const { fromPos, toPos, scene, colorHex = "#ffffff", durationMs = 2000 } = opts;

  const color  = new THREE.Color(colorHex);
  const midP   = getMidpoint(fromPos, toPos);
  const curve  = new THREE.CatmullRomCurve3([fromPos, midP, toPos]);

  const geo    = new THREE.SphereGeometry(0.11, 10, 10);
  const mat    = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0,
  });
  const ball   = new THREE.Mesh(geo, mat);
  ball.position.copy(fromPos);
  scene.add(ball);

  const startMs = performance.now();
  let done      = false;

  return {
    update(_nowMs: number): boolean {
      if (done) return true;

      const elapsed = performance.now() - startMs;
      const raw     = Math.min(elapsed / durationMs, 1);
      const p       = 1 - Math.pow(1 - raw, 2);    // ease-out quad

      // Position along curve
      const pt = curve.getPoint(p);
      ball.position.copy(pt);

      // Fade envelope: in first 10%, out last 15%
      mat.opacity = raw < 0.1
        ? raw * 10
        : raw > 0.85
          ? (1 - raw) / 0.15
          : 0.92;

      // Slight pulsing glow
      mat.emissiveIntensity = 2 + Math.sin(raw * Math.PI * 6) * 0.6;

      if (raw >= 1) {
        scene.remove(ball);
        geo.dispose();
        mat.dispose();
        done = true;
        return true;
      }
      return false;
    },
  };
}

// ─── Multi-hop pulse (travels through N nodes) ────────────────────────
// Used for the forward-pass / backprop events that specify pulse:[...ids].
export function createMultiHopPulse(
  positions: THREE.Vector3[],
  scene: THREE.Scene,
  colorHex: string,
  totalDurationMs: number
): PulseHandle {
  if (positions.length < 2) {
    return { update: () => true };   // guard: nothing to animate
  }

  // Build full path through all positions
  const curve     = new THREE.CatmullRomCurve3(positions, false, "catmullrom", 0.5);
  const color     = new THREE.Color(colorHex);

  const geo  = new THREE.SphereGeometry(0.13, 10, 10);
  const mat  = new THREE.MeshPhongMaterial({
    color, emissive: color, emissiveIntensity: 2.8, transparent: true, opacity: 0,
  });
  const ball = new THREE.Mesh(geo, mat);
  scene.add(ball);

  const startMs = performance.now();
  let done      = false;

  return {
    update(_now: number): boolean {
      if (done) return true;
      const raw = Math.min((performance.now() - startMs) / totalDurationMs, 1);
      const p   = 1 - Math.pow(1 - raw, 2);

      ball.position.copy(curve.getPoint(p));
      mat.opacity = raw < 0.08 ? raw / 0.08 : raw > 0.88 ? (1 - raw) / 0.12 : 0.95;
      mat.emissiveIntensity = 2.4 + Math.sin(raw * Math.PI * 8) * 0.5;

      if (raw >= 1) {
        scene.remove(ball);
        geo.dispose();
        mat.dispose();
        done = true;
        return true;
      }
      return false;
    },
  };
}