// PATH: src/components/ar/ar-types.ts  — CREATE
// Shared types consumed by TimelineController, DynamicNode, Synapse and ARLearningApp.

// ─── Animation manifest event ────────────────────────────────────────
export interface AnimEvent {
  /** Absolute start time in seconds from playhead zero. */
  t: number;
  type: "spawn" | "synapse" | "pulse" | "highlight" | "label" | "dim" | "reset";

  /** ID of the target node (for spawn / highlight / dim). */
  target?: string;
  /** Source node ID (for synapse / pulse). */
  from?: string;
  /** Destination node ID (for synapse / pulse). */
  to?: string;

  effect?: "fade-glow" | "scale-in" | "flicker" | "grow" | "data-flow" | "ripple";
  duration?: number;

  /**
   * Optional floating info tag shown at this step.
   * Guard clause: `if (!ev.tag) return;`  →  fixes TS18048.
   */
  tag?: string;

  /** For pulse events: ordered list of node IDs the light ball travels through. */
  pulse?: string[];

  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";

  /** Optional override colour (hex string, e.g. "#c084fc"). */
  color?: string;
}

// ─── Topic descriptor (returned by /api/ar/topics) ──────────────────
export interface ARTopic {
  id: string;
  title: string;
  category: string;
  emoji: string;
  accentHex: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  modelType: "tree" | "chain" | "network" | "bars" | "layers" | "cluster";
  nodes: string[];
  /** Legacy step labels (kept for backward compat, not used by new engine). */
  logicJson: { action: string; node?: string; label: string; duration: number }[];
}

// ─── Per-node record stored in nodesRef ─────────────────────────────
export interface NodeRecord {
  id: string;
  mesh: THREE.Mesh;
  /** Billboard sprite carrying the canvas-texture label. */
  label: THREE.Sprite;
  /** The node's world-space position (shortcut from mesh.position). */
  position: THREE.Vector3;
  accentColor: THREE.Color;
}

// ─── Per-synapse record stored in synapsesRef ────────────────────────
export interface SynapseRecord {
  id: string;
  /** The THREE.Mesh wrapping the TubeGeometry. */
  tube: THREE.Mesh;
  /** Progress 0→1 used by the grow animation. */
  progress: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  /** Number of curve segments (controls the tube's draw resolution). */
  segments: number;
}

// ─── Playback control surface exposed by TimelineController ─────────
export interface PlaybackControls {
  play(): void;
  pause(): void;
  /** Seek to an absolute second (0 ≤ t ≤ totalDuration). */
  seek(t: number): void;
  /** Set playback rate multiplier (0.5 / 1 / 1.5 / 2). */
  setSpeed(rate: number): void;
  /** Resets to t=0 and kills all tweens. */
  reset(): void;
  totalDuration: number;
}

// Need THREE in scope for NodeRecord / SynapseRecord
import * as THREE from "three";