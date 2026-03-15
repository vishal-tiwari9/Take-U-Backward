// PATH: src/app/api/ar/manifest/route.ts  — CREATE
// Serves per-topic Animation Manifests. Each manifest is a time-ordered
// array of AnimEvents that the client's Timeline Engine executes.
// New concepts (Blockchain, OS Scheduling, etc.) are added here without
// touching frontend code — the client reads and executes the JSON blindly.
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// ─── AnimEvent shape ────────────────────────────────────────────────
// t        : absolute start time in seconds
// type     : what the engine should do
// target   : id of a node/edge/group in the scene
// effect   : visual effect to apply
// duration : how long the tween runs (seconds)
// tag      : floating info text to show when this step fires (optional)
// pulse    : if type==="pulse", list of node ids the light travels through
// easing   : "linear" | "ease-in" | "ease-out" | "ease-in-out"

export interface AnimEvent {
  t: number;
  type: "spawn" | "synapse" | "pulse" | "highlight" | "label" | "dim" | "reset";
  target?: string;
  from?: string;
  to?: string;
  effect?: "fade-glow" | "scale-in" | "flicker" | "grow" | "data-flow" | "ripple";
  duration?: number;
  tag?: string;
  pulse?: string[];
  easing?: string;
  color?: string;
}

// ─── Manifests keyed by topic ID ────────────────────────────────────
const MANIFESTS: Record<string, AnimEvent[]> = {

  "neural-net": [
    // Phase 1: Input nodes fade-in one by one with glow
    { t:0.0,  type:"label",    tag:"🧠 Building Neural Network…",                        duration:1.5 },
    { t:0.3,  type:"spawn",    target:"input-0",  effect:"fade-glow",   duration:0.7,   tag:"Input: x₁ — raw feature vector" },
    { t:0.8,  type:"spawn",    target:"input-1",  effect:"fade-glow",   duration:0.7,   tag:"Input: x₂ — normalised [0,1]" },
    { t:1.3,  type:"spawn",    target:"input-2",  effect:"fade-glow",   duration:0.7,   tag:"Input: x₃ — bias neuron (always 1)" },
    // Phase 2: Synapses grow toward hidden layer
    { t:2.2,  type:"label",    tag:"⚡ Growing synaptic connections…",                   duration:1.2 },
    { t:2.4,  type:"synapse",  from:"input-0",    to:"h1-0",  effect:"grow", duration:0.9, tag:"Weight w₁ₐ — learnable parameter" },
    { t:2.7,  type:"synapse",  from:"input-0",    to:"h1-1",  effect:"grow", duration:0.9 },
    { t:2.9,  type:"synapse",  from:"input-1",    to:"h1-0",  effect:"grow", duration:0.9 },
    { t:3.1,  type:"synapse",  from:"input-1",    to:"h1-1",  effect:"grow", duration:0.9 },
    { t:3.3,  type:"synapse",  from:"input-2",    to:"h1-0",  effect:"grow", duration:0.9 },
    { t:3.5,  type:"synapse",  from:"input-2",    to:"h1-1",  effect:"grow", duration:0.9 },
    // Phase 3: Hidden layer nodes materialise
    { t:4.0,  type:"label",    tag:"✨ Hidden layer materialising…",                     duration:1.2 },
    { t:4.2,  type:"spawn",    target:"h1-0",     effect:"scale-in",    duration:0.8,   tag:"Hidden: ReLU(Σwᵢxᵢ + b)" },
    { t:4.7,  type:"spawn",    target:"h1-1",     effect:"scale-in",    duration:0.8,   tag:"Hidden: ReLU activation applied" },
    // Phase 4: H1→H2 connections
    { t:5.4,  type:"synapse",  from:"h1-0",       to:"h2-0",  effect:"grow", duration:0.8 },
    { t:5.6,  type:"synapse",  from:"h1-0",       to:"h2-1",  effect:"grow", duration:0.8 },
    { t:5.8,  type:"synapse",  from:"h1-1",       to:"h2-0",  effect:"grow", duration:0.8 },
    { t:6.0,  type:"synapse",  from:"h1-1",       to:"h2-1",  effect:"grow", duration:0.8 },
    { t:6.5,  type:"spawn",    target:"h2-0",     effect:"scale-in",    duration:0.7,   tag:"Layer 2: deeper feature abstraction" },
    { t:6.9,  type:"spawn",    target:"h2-1",     effect:"scale-in",    duration:0.7 },
    // Phase 5: Output
    { t:7.4,  type:"synapse",  from:"h2-0",       to:"out-0", effect:"grow", duration:0.8 },
    { t:7.6,  type:"synapse",  from:"h2-1",       to:"out-0", effect:"grow", duration:0.8 },
    { t:8.1,  type:"spawn",    target:"out-0",    effect:"flicker",     duration:1.0,   tag:"Output: Softmax → class probability" },
    // Phase 6: Forward pass light pulse
    { t:9.2,  type:"label",    tag:"🔴 Forward pass — data flowing through network",     duration:2.0 },
    { t:9.5,  type:"pulse",    pulse:["input-0","h1-0","h2-0","out-0"], effect:"data-flow", duration:2.5 },
    { t:10.0, type:"pulse",    pulse:["input-1","h1-1","h2-1","out-0"], effect:"data-flow", duration:2.5, color:"#c084fc" },
    // Phase 7: Backprop ripple
    { t:12.5, type:"label",    tag:"🔵 Backpropagation — gradient flowing backward",     duration:2.0 },
    { t:12.8, type:"pulse",    pulse:["out-0","h2-0","h1-0","input-0"], effect:"ripple",    duration:2.5, color:"#38bdf8" },
    { t:14.0, type:"highlight", target:"out-0",   effect:"ripple",      duration:1.5,   tag:"Loss computed — adjusting weights" },
    { t:15.5, type:"label",    tag:"✅ Training step complete — network updated",         duration:2.0 },
  ],

  "bst": [
    { t:0.0,  type:"label",    tag:"🌳 Constructing Binary Search Tree…",               duration:1.5 },
    { t:0.5,  type:"spawn",    target:"root",     effect:"scale-in",    duration:0.8,   tag:"Root node — value 50" },
    { t:1.5,  type:"synapse",  from:"root",       to:"left",  effect:"grow",  duration:0.7, tag:"Left child: value < 50" },
    { t:2.0,  type:"spawn",    target:"left",     effect:"fade-glow",   duration:0.7,   tag:"Node 25 — left subtree" },
    { t:2.8,  type:"synapse",  from:"root",       to:"right", effect:"grow",  duration:0.7, tag:"Right child: value > 50" },
    { t:3.3,  type:"spawn",    target:"right",    effect:"fade-glow",   duration:0.7,   tag:"Node 75 — right subtree" },
    { t:4.2,  type:"label",    tag:"🔍 Searching for value 30…",                        duration:1.5 },
    { t:4.5,  type:"highlight", target:"root",    effect:"ripple",      duration:0.8,   tag:"30 < 50 → go left" },
    { t:5.4,  type:"pulse",    pulse:["root","left"],    effect:"data-flow", duration:1.2 },
    { t:6.2,  type:"highlight", target:"left",   effect:"ripple",       duration:0.8,   tag:"30 > 25 → go right child" },
    { t:7.0,  type:"spawn",    target:"leafA",    effect:"flicker",     duration:0.8,   tag:"Node 30 — FOUND ✓ O(log n)" },
    { t:8.2,  type:"label",    tag:"✅ Search complete — O(log n) complexity",          duration:2.0 },
  ],

  "blockchain": [
    { t:0.0,  type:"label",    tag:"⛓️ Forging blockchain from genesis…",               duration:1.5 },
    { t:0.5,  type:"spawn",    target:"block-0",  effect:"scale-in",    duration:0.9,   tag:"Genesis Block — hash: 0x000000…" },
    { t:1.6,  type:"label",    tag:"⛏️ Mining Block #1 — proof of work…",              duration:1.8 },
    { t:1.8,  type:"spawn",    target:"block-1",  effect:"flicker",     duration:1.2,   tag:"Nonce found after 1.2M attempts" },
    { t:3.2,  type:"synapse",  from:"block-0",    to:"block-1", effect:"grow", duration:0.7, tag:"Hash pointer links blocks" },
    { t:4.0,  type:"spawn",    target:"block-2",  effect:"flicker",     duration:1.2,   tag:"Block #2 — Merkle root verified" },
    { t:5.3,  type:"synapse",  from:"block-1",    to:"block-2", effect:"grow", duration:0.7 },
    { t:6.2,  type:"pulse",    pulse:["block-0","block-1","block-2"], effect:"data-flow", duration:2.0, tag:"Chain validated — immutable ✓" },
    { t:8.5,  type:"label",    tag:"✅ Blockchain forged — tamper-evident ledger",      duration:2.0 },
  ],

  "sorting": [
    { t:0.0,  type:"label",    tag:"📊 QuickSort — selecting pivot…",                   duration:1.5 },
    { t:0.5,  type:"spawn",    target:"bar-4",    effect:"scale-in",    duration:0.6,   tag:"Pivot: index 4 — value 1.8" },
    { t:1.2,  type:"highlight", target:"bar-0",   effect:"ripple",      duration:0.5,   tag:"0.6 < 1.8 → left partition" },
    { t:1.7,  type:"highlight", target:"bar-1",   effect:"ripple",      duration:0.5,   tag:"1.4 < 1.8 → left partition" },
    { t:2.2,  type:"highlight", target:"bar-5",   effect:"ripple",      duration:0.5,   tag:"2.0 > 1.8 → right partition" },
    { t:2.8,  type:"label",    tag:"↔️ Swapping elements into partitions…",             duration:1.5 },
    { t:3.2,  type:"pulse",    pulse:["bar-0","bar-1","bar-4","bar-5","bar-6"], effect:"data-flow", duration:2.0 },
    { t:5.5,  type:"label",    tag:"✅ Array sorted — O(n log n) average",              duration:2.0 },
  ],

  "tcp-ip": [
    { t:0.0,  type:"label",    tag:"🌐 HTTP request entering TCP/IP stack…",            duration:1.5 },
    { t:0.6,  type:"spawn",    target:"layer-0",  effect:"fade-glow",   duration:0.8,   tag:"App Layer: HTTP GET /api/data" },
    { t:1.6,  type:"synapse",  from:"layer-0",    to:"layer-1", effect:"grow", duration:0.6, tag:"Encapsulation: TCP header added" },
    { t:2.3,  type:"spawn",    target:"layer-1",  effect:"fade-glow",   duration:0.7,   tag:"Transport: port 443, SYN handshake" },
    { t:3.1,  type:"synapse",  from:"layer-1",    to:"layer-2", effect:"grow", duration:0.6 },
    { t:3.7,  type:"spawn",    target:"layer-2",  effect:"fade-glow",   duration:0.7,   tag:"Network: IP packet, TTL=64" },
    { t:4.5,  type:"pulse",    pulse:["layer-0","layer-1","layer-2","layer-3","layer-4"], effect:"data-flow", duration:2.5, tag:"Packet traversing layers…" },
    { t:7.2,  type:"label",    tag:"✅ Response received — connection closed",           duration:2.0 },
  ],

  "kubernetes": [
    { t:0.0,  type:"label",    tag:"🚀 Bootstrapping Kubernetes cluster…",              duration:1.5 },
    { t:0.6,  type:"spawn",    target:"control",  effect:"scale-in",    duration:0.9,   tag:"Control Plane — API server started" },
    { t:1.7,  type:"spawn",    target:"etcd",     effect:"fade-glow",   duration:0.8,   tag:"etcd — distributed state store" },
    { t:2.6,  type:"spawn",    target:"node-0",   effect:"scale-in",    duration:0.7,   tag:"Worker Node 1 joined cluster" },
    { t:3.3,  type:"spawn",    target:"node-1",   effect:"scale-in",    duration:0.7,   tag:"Worker Node 2 joined cluster" },
    { t:4.0,  type:"label",    tag:"📦 Scheduling pods…",                               duration:1.5 },
    { t:4.3,  type:"spawn",    target:"pod-0",    effect:"flicker",     duration:0.7,   tag:"Pod: nginx:latest — Running ✓" },
    { t:5.0,  type:"spawn",    target:"pod-1",    effect:"flicker",     duration:0.7,   tag:"Pod: api:v2 — Running ✓" },
    { t:5.7,  type:"pulse",    pulse:["control","node-0","pod-0"], effect:"data-flow", duration:2.0, tag:"Health checks passing" },
    { t:8.0,  type:"label",    tag:"✅ Cluster healthy — 2 nodes, 2 pods",              duration:2.0 },
  ],

  "react-tree": [
    { t:0.0,  type:"label",    tag:"⚛️ Mounting React component tree…",                 duration:1.5 },
    { t:0.6,  type:"spawn",    target:"root",     effect:"scale-in",    duration:0.8,   tag:"<App /> — root component mounted" },
    { t:1.5,  type:"synapse",  from:"root",       to:"ctx", effect:"grow", duration:0.7, tag:"Context.Provider wraps tree" },
    { t:2.2,  type:"spawn",    target:"ctx",      effect:"fade-glow",   duration:0.7,   tag:"ThemeContext: value changed!" },
    { t:3.0,  type:"label",    tag:"🔄 Re-render triggered — diffing vDOM…",           duration:1.5 },
    { t:3.3,  type:"highlight", target:"childA",  effect:"ripple",      duration:0.8,   tag:"React.memo — props unchanged, skip" },
    { t:4.2,  type:"highlight", target:"childB",  effect:"flicker",     duration:0.8,   tag:"Subscribed to context — re-renders" },
    { t:5.0,  type:"pulse",    pulse:["ctx","childB","leaf"], effect:"data-flow", duration:2.0, tag:"DOM patch committed" },
    { t:7.3,  type:"label",    tag:"✅ Render complete — 1 component updated",          duration:2.0 },
  ],

  "db-indexing": [
    { t:0.0,  type:"label",    tag:"🗄️ Building B-Tree index on column 'id'…",          duration:1.5 },
    { t:0.6,  type:"spawn",    target:"root",     effect:"scale-in",    duration:0.8,   tag:"B-Tree root — sorted keys" },
    { t:1.5,  type:"synapse",  from:"root",       to:"left", effect:"grow", duration:0.7, tag:"Left page: keys < 50" },
    { t:2.2,  type:"spawn",    target:"left",     effect:"fade-glow",   duration:0.7,   tag:"Index page — pointers to heap" },
    { t:3.0,  type:"label",    tag:"🔍 Executing: SELECT * WHERE id = 42",              duration:1.5 },
    { t:3.4,  type:"pulse",    pulse:["root","left","leafA"], effect:"data-flow", duration:2.0, tag:"Index scan — O(log n)" },
    { t:5.5,  type:"spawn",    target:"leafA",    effect:"flicker",     duration:0.8,   tag:"Row pointer found — fetching heap" },
    { t:6.4,  type:"label",    tag:"✅ 1 row in 0.3ms — index scan vs 840ms full scan", duration:2.5 },
  ],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  const manifest = MANIFESTS[id];
  if (!manifest) return NextResponse.json({ error: "No manifest for topic" }, { status: 404 });
  const totalDuration = manifest.reduce((mx, e) => Math.max(mx, e.t + (e.duration ?? 0)), 0);
  return NextResponse.json({ id, events: manifest, totalDuration });
}