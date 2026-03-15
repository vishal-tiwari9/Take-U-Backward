// GSAP Timeline that orchestrates the entire AR build sequence.
//
// Architecture
// ────────────
// 1. PRE-REGISTRATION  — on manifest load, every `target` / `from` / `to` ID
//    in the JSON is registered as a placeholder in nodesRef so Synapse logic
//    never hits a missing key.
//
// 2. GSAP ORCHESTRATION — each AnimEvent is scheduled with
//    `tl.call(handler, [], event.t)` so even if the browser drops
//    frames, GSAP's internal timer guarantees the handler fires at the
//    correct virtual time.  No useEffect intervals, no React state timers.
//
// 3. SCRUB / SEEK — because we use a GSAP timeline (not tweens), seeking
//    jumps the playhead and instantly re-fires all call() hooks that should
//    have already executed, then continues forward.
//
// 4. SPEED — tl.timeScale(n) changes rate globally; the React UI just
//    needs to call controller.setSpeed(n).

import gsap from "gsap";
import * as THREE from "three";
import type { AnimEvent, ARTopic, NodeRecord, SynapseRecord, PlaybackControls } from "./ar-types";
import {
  createDynamicNode,
  revealNode,
  pulseNode,
} from "./DynamicNode";
import {
  createSynapse,
  growSynapse,
  createMultiHopPulse,
  type PulseHandle,
} from "./Synapse";

// ─── Public hook ─────────────────────────────────────────────────────
export interface TimelineControllerOptions {
  scene:        THREE.Scene;
  group:        THREE.Group;
  topic:        ARTopic;
  events:       AnimEvent[];
  totalDuration:number;
  nodesRef:     React.MutableRefObject<Map<string, NodeRecord>>;
  synapsesRef:  React.MutableRefObject<Map<string, SynapseRecord>>;
  pulsesRef:    React.MutableRefObject<PulseHandle[]>;
  onTagChange:  (tag: string | null) => void;
  onProgress:   (pct: number) => void;   // 0-1
}

export function createTimelineController(
  opts: TimelineControllerOptions
): PlaybackControls {
  const {
    scene, group, topic, events, totalDuration,
    nodesRef, synapsesRef, pulsesRef,
    onTagChange, onProgress,
  } = opts;

  const accentHex = topic.accentHex;

  // ── Step 1: Pre-registration ────────────────────────────────────
  // Walk every event and ensure target / from / to IDs exist in
  // nodesRef as placeholder positions before GSAP fires any call().
  // Positions are assigned by the layout engine below; unknown IDs
  // get a generic auto-position so synapses never crash.
  preRegisterNodes(events, nodesRef, group, topic, accentHex);

  // ── Step 2: Build GSAP timeline ─────────────────────────────────
  const tl = gsap.timeline({
    paused: true,
    onUpdate() {
      onProgress(tl.progress());
    },
    onComplete() {
      onProgress(1);
    },
  });

  // Schedule each event at its absolute `t` second
  events.forEach((ev) => {
    tl.call(() => dispatch(ev), [], ev.t);
  });

  // Progress sentinel — fires every 100ms for smooth scrub bar
  for (let t = 0.1; t <= totalDuration; t += 0.1) {
    const tCap = t;
    tl.call(() => onProgress(tCap / totalDuration), [], tCap);
  }

  // ── Step 3: Event dispatcher ─────────────────────────────────────
  function dispatch(ev: AnimEvent): void {
    switch (ev.type) {
      case "label":
        handleLabel(ev);
        break;
      case "spawn":
        handleSpawn(ev);
        break;
      case "synapse":
        handleSynapse(ev);
        break;
      case "pulse":
        handlePulse(ev);
        break;
      case "highlight":
        handleHighlight(ev);
        break;
      case "dim":
        handleDim(ev);
        break;
      case "reset":
        resetScene();
        break;
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────

  function handleLabel(ev: AnimEvent): void {
    // Guard clause — fixes TS18048 "ev.tag is possibly undefined"
    if (!ev.tag) return;
    const tag = ev.tag;
    onTagChange(tag);
    const clearAfter = ((ev.duration ?? 1.5) + 0.5) * 1000;
    setTimeout(() => onTagChange(null), clearAfter);
  }

  function handleSpawn(ev: AnimEvent): void {
    if (!ev.target) return;

    const record = nodesRef.current.get(ev.target);
    if (!record) {
      console.warn(`[TimelineController] spawn: node "${ev.target}" not found.`);
      return;
    }

    // Show the tag associated with this spawn
    if (ev.tag) {
      onTagChange(ev.tag);
      setTimeout(() => onTagChange(null), 2200);
    }

    revealNode(record, ev.effect ?? "fade-glow", (ev.duration ?? 0.7) * 1000);
  }

  function handleSynapse(ev: AnimEvent): void {
    if (!ev.from || !ev.to) return;

    const fromRecord = nodesRef.current.get(ev.from);
    const toRecord   = nodesRef.current.get(ev.to);

    if (!fromRecord) {
      console.warn(`[TimelineController] synapse: "from" node "${ev.from}" not registered.`);
      return;
    }
    if (!toRecord) {
      console.warn(`[TimelineController] synapse: "to" node "${ev.to}" not registered.`);
      return;
    }

    const synapseId = `syn__${ev.from}__${ev.to}`;

    // Avoid duplicate synapses if manifest repeats the same edge
    if (synapsesRef.current.has(synapseId)) return;

    const record = createSynapse({
      id:         synapseId,
      fromRecord,
      toRecord,
      accentHex,
      parent:     group,
      colorHex:   ev.color,
    });
    synapsesRef.current.set(synapseId, record);
    growSynapse(record, (ev.duration ?? 0.9) * 1000);

    if (ev.tag) {
      onTagChange(ev.tag);
      setTimeout(() => onTagChange(null), 2000);
    }
  }

  function handlePulse(ev: AnimEvent): void {
    if (!ev.pulse || ev.pulse.length < 2) return;

    const positions: THREE.Vector3[] = [];
    for (const id of ev.pulse) {
      const rec = nodesRef.current.get(id);
      if (rec) {
        positions.push(rec.position.clone());
      } else {
        console.warn(`[TimelineController] pulse: node "${id}" not found, skipping hop.`);
      }
    }

    if (positions.length < 2) return;

    const pulse = createMultiHopPulse(
      positions,
      scene,
      ev.color ?? accentHex,
      (ev.duration ?? 2) * 1000
    );
    pulsesRef.current.push(pulse);

    if (ev.tag) {
      onTagChange(ev.tag);
      setTimeout(() => onTagChange(null), (ev.duration ?? 2) * 1000 + 400);
    }
  }

  function handleHighlight(ev: AnimEvent): void {
    if (!ev.target) return;
    const record = nodesRef.current.get(ev.target);
    if (!record) return;

    pulseNode(record, (ev.duration ?? 0.8) * 1000, ev.color);

    if (ev.tag) {
      onTagChange(ev.tag);
      setTimeout(() => onTagChange(null), (ev.duration ?? 0.8) * 1000 + 500);
    }
  }

  function handleDim(ev: AnimEvent): void {
    if (!ev.target) return;
    const record = nodesRef.current.get(ev.target);
    if (!record) return;

    const mat = record.mesh.material as THREE.MeshPhongMaterial;
    gsap.to(mat, { opacity: 0.2, emissiveIntensity: 0.05, duration: ev.duration ?? 0.5 });
  }

  function resetScene(): void {
    nodesRef.current.forEach((rec) => {
      const mat = rec.mesh.material as THREE.MeshPhongMaterial;
      mat.opacity = 0; mat.emissiveIntensity = 0;
      rec.mesh.scale.setScalar(0.001);
      (rec.label.material as THREE.SpriteMaterial).opacity = 0;
    });
    synapsesRef.current.forEach((rec) => {
      const mat = rec.tube.material as THREE.MeshPhongMaterial;
      mat.opacity = 0;
      (rec.tube.geometry as THREE.TubeGeometry).setDrawRange(0, 0);
      rec.progress = 0;
    });
    onProgress(0);
  }

  // ── Playback API ─────────────────────────────────────────────────
  return {
    totalDuration,

    play() {
      tl.play();
    },

    pause() {
      tl.pause();
    },

    seek(t: number) {
      const wasPlaying = tl.isActive();
      tl.pause();
      // Reset then replay all events up to t instantly
      resetScene();
      // GSAP seek: internally re-fires all call() hooks up to the new time
      tl.seek(Math.max(0, Math.min(t, totalDuration)));
      if (wasPlaying) tl.play();
      onProgress(t / totalDuration);
    },

    setSpeed(rate: number) {
      tl.timeScale(rate);
    },

    reset() {
      tl.pause();
      tl.seek(0);
      resetScene();
      onProgress(0);
    },
  };
}

// ─── Pre-registration ─────────────────────────────────────────────────
// Assigns 3D positions to all node IDs referenced in the manifest.
// Known topology IDs (input-0, h1-0, etc.) get exact positions.
// Unknown IDs get an auto-generated position on a golden-ratio spiral
// so they never overlap and always form a readable layout.

const TOPOLOGY_POSITIONS: Record<string, Record<string, THREE.Vector3>> = {
  "neural-net": {
    "input-0": new THREE.Vector3(-2.8,  0.9, 0),
    "input-1": new THREE.Vector3(-2.8,  0.0, 0),
    "input-2": new THREE.Vector3(-2.8, -0.9, 0),
    "h1-0":    new THREE.Vector3(-0.9,  0.55, 0),
    "h1-1":    new THREE.Vector3(-0.9, -0.55, 0),
    "h2-0":    new THREE.Vector3( 0.9,  0.55, 0),
    "h2-1":    new THREE.Vector3( 0.9, -0.55, 0),
    "out-0":   new THREE.Vector3( 2.8,  0.0, 0),
  },
  "bst": {
    "root":  new THREE.Vector3( 0,   1.8, 0),
    "left":  new THREE.Vector3(-1.4, 0.6, 0),
    "right": new THREE.Vector3( 1.4, 0.6, 0),
    "leafA": new THREE.Vector3(-2.0,-0.6, 0),
    "leafB": new THREE.Vector3(-0.8,-0.6, 0),
    "leafC": new THREE.Vector3( 0.8,-0.6, 0),
    "leafD": new THREE.Vector3( 2.0,-0.6, 0),
  },
  "blockchain": {
    "block-0": new THREE.Vector3(-3.5, 0, 0),
    "block-1": new THREE.Vector3(-1.4, 0, 0),
    "block-2": new THREE.Vector3( 0.7, 0, 0),
    "block-3": new THREE.Vector3( 2.8, 0, 0),
  },
  "sorting": {
    "bar-0": new THREE.Vector3(-2.3, 0.3, 0),
    "bar-1": new THREE.Vector3(-1.6,-0.6, 0),
    "bar-2": new THREE.Vector3(-0.9, 0.1, 0),
    "bar-3": new THREE.Vector3(-0.2,-0.2, 0),
    "bar-4": new THREE.Vector3( 0.5, 0.3, 0),
    "bar-5": new THREE.Vector3( 1.2,-0.5, 0),
    "bar-6": new THREE.Vector3( 1.9, 0.2, 0),
    "bar-7": new THREE.Vector3( 2.6,-0.1, 0),
  },
  "tcp-ip": {
    "layer-0": new THREE.Vector3(0,  1.6, 0),
    "layer-1": new THREE.Vector3(0,  0.88, 0),
    "layer-2": new THREE.Vector3(0,  0.16, 0),
    "layer-3": new THREE.Vector3(0, -0.56, 0),
    "layer-4": new THREE.Vector3(0, -1.28, 0),
  },
  "kubernetes": {
    "control": new THREE.Vector3( 0,    0,   0),
    "etcd":    new THREE.Vector3( 0,    1.6, 0),
    "node-0":  new THREE.Vector3(-2.2, -1.0, 0),
    "node-1":  new THREE.Vector3( 2.2, -1.0, 0),
    "pod-0":   new THREE.Vector3(-2.9, -1.8, 0),
    "pod-1":   new THREE.Vector3(-1.5, -1.8, 0),
    "pod-2":   new THREE.Vector3( 1.5, -1.8, 0),
    "pod-3":   new THREE.Vector3( 2.9, -1.8, 0),
  },
  "react-tree": {
    "root":   new THREE.Vector3( 0,   1.8, 0),
    "ctx":    new THREE.Vector3( 0,   0.8, 0),
    "childA": new THREE.Vector3(-1.4,-0.1, 0),
    "childB": new THREE.Vector3( 1.4,-0.1, 0),
    "leaf":   new THREE.Vector3( 1.4,-1.2, 0),
  },
  "db-indexing": {
    "root":       new THREE.Vector3( 0,   1.8, 0),
    "left":       new THREE.Vector3(-1.4, 0.6, 0),
    "right":      new THREE.Vector3( 1.4, 0.6, 0),
    "leafA":      new THREE.Vector3(-2.0,-0.6, 0),
    "leafB":      new THREE.Vector3(-0.8,-0.6, 0),
    "heapFile":   new THREE.Vector3( 0.8,-0.6, 0),
  },
};

// Golden-ratio spiral fallback for unknown IDs
function autoPosition(idx: number): THREE.Vector3 {
  const PHI   = (1 + Math.sqrt(5)) / 2;
  const angle = idx * PHI * Math.PI * 2;
  const r     = 1.2 + idx * 0.45;
  return new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * 0.7, 0);
}

function preRegisterNodes(
  events: AnimEvent[],
  nodesRef: React.MutableRefObject<Map<string, NodeRecord>>,
  group: THREE.Group,
  topic: ARTopic,
  accentHex: string
): void {
  const posMap   = TOPOLOGY_POSITIONS[topic.id] ?? {};
  const seen     = new Set<string>();
  let   autoIdx  = 0;

  // Collect all IDs referenced in the manifest
  const allIds: string[] = [];
  events.forEach((ev) => {
    if (ev.target) allIds.push(ev.target);
    if (ev.from)   allIds.push(ev.from);
    if (ev.to)     allIds.push(ev.to);
    ev.pulse?.forEach((id) => allIds.push(id));
  });

  allIds.forEach((id) => {
    if (seen.has(id) || nodesRef.current.has(id)) return;
    seen.add(id);

    const position = posMap[id] ?? autoPosition(autoIdx++);

    // Infer a human-readable label from the ID
    const label = inferLabel(id, topic);

    const record = createDynamicNode({
      id,
      label,
      position,
      accentHex,
      topicId:   topic.id,
      modelType: topic.modelType,
      parent:    group,
    });

    nodesRef.current.set(id, record);
  });
}

// ─── Label inference ─────────────────────────────────────────────────
// Converts manifest IDs like "h1-0", "block-2", "input-1" into readable
// labels. Falls back to the topic.nodes array, then prettifies the raw ID.
function inferLabel(id: string, topic: ARTopic): string {
  // Check topic.nodes for an exact position match by index
  const idMap: Record<string, Record<string, string>> = {
    "neural-net": {
      "input-0":"x₁ Input","input-1":"x₂ Input","input-2":"x₃ Bias",
      "h1-0":"Hidden₁A","h1-1":"Hidden₁B","h2-0":"Hidden₂A","h2-1":"Hidden₂B",
      "out-0":"Output",
    },
    "bst": {
      "root":"Root (50)","left":"Left (25)","right":"Right (75)",
      "leafA":"Leaf (10)","leafB":"Leaf (30)","leafC":"Leaf (60)","leafD":"Leaf (90)",
    },
    "blockchain": {
      "block-0":"Genesis","block-1":"Block #1","block-2":"Block #2","block-3":"Block #3",
    },
    "sorting": Object.fromEntries(
      ["Pivot","L-Part","R-Part","Comp","Sorted","S2","S3","S4"]
        .map((v, i) => [`bar-${i}`, v])
    ),
    "tcp-ip": {
      "layer-0":"Application","layer-1":"Transport","layer-2":"Network",
      "layer-3":"Data Link","layer-4":"Physical",
    },
    "kubernetes": {
      "control":"Control Plane","etcd":"etcd","node-0":"Worker 1",
      "node-1":"Worker 2","pod-0":"Pod A","pod-1":"Pod B","pod-2":"Pod C","pod-3":"Pod D",
    },
    "react-tree": {
      "root":"<App />","ctx":"Context","childA":"<Memo />","childB":"<Child />","leaf":"<Leaf />",
    },
    "db-indexing": {
      "root":"B-Tree Root","left":"Index Left","right":"Index Right",
      "leafA":"Leaf Page","leafB":"Leaf Page","heapFile":"Heap File",
    },
  };

  return idMap[topic.id]?.[id] ?? prettyId(id);
}

function prettyId(id: string): string {
  return id
    .replace(/-(\d+)$/, " $1")      // "input-0" → "input 0"
    .replace(/-/g, " ")             // kebab → space
    .replace(/\b\w/g, (c) => c.toUpperCase()); // title case
}

// Re-export PulseHandle so ARLearningApp doesn't need to import Synapse directly
export type { PulseHandle };

// React import needed for MutableRefObject type
import React from "react";