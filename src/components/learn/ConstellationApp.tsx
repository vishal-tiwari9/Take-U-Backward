// PATH: src/components/learn/ConstellationApp.tsx  — REPLACE entire file
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────
type Cluster = "core" | "frontend" | "backend" | "aiml" | "web3" | "devops" | "mobile";
type Tier    = 0 | 1 | 2 | 3;

interface StarNode {
  id: string; label: string; description: string;
  cluster: Cluster; tier: Tier; prerequisites: string[];
  position: [number, number, number];
}

interface Resource {
  title: string; type: "docs" | "video" | "repo" | "course" | "article";
  url: string; author: string; quality: string; why: string;
}

// ─── Cluster palette ────────────────────────────────────────────────
const CLUSTER: Record<Cluster, { hex: string; num: number; label: string; icon: string }> = {
  core:     { hex: "#a5b4fc", num: 0xa5b4fc, label: "Foundation", icon: "⭐" },
  frontend: { hex: "#38bdf8", num: 0x38bdf8, label: "Frontend",   icon: "🎨" },
  backend:  { hex: "#34d399", num: 0x34d399, label: "Backend",    icon: "⚙️" },
  aiml:     { hex: "#c084fc", num: 0xc084fc, label: "AI / ML",    icon: "🧠" },
  web3:     { hex: "#fb923c", num: 0xfb923c, label: "Web3",       icon: "⛓️" },
  devops:   { hex: "#fbbf24", num: 0xfbbf24, label: "DevOps",     icon: "🚀" },
  mobile:   { hex: "#f472b6", num: 0xf472b6, label: "Mobile",     icon: "📱" },
};

const TIERS = ["Beginner", "Intermediate", "Advanced", "Expert"];

// ─── Star Map — 60 nodes, all named after real technologies ─────────
const RAW_STARS: StarNode[] = [

  // ── FOUNDATION ────────────────────────────────────────────────────
  { id:"cs",            label:"CS Fundamentals",  description:"Data structures, algorithms, complexity theory, binary, memory models.",          cluster:"core",     tier:0, prerequisites:[],                            position:[ 0,    0,    0  ] },
  { id:"git",           label:"Git",              description:"Branching, rebasing, PRs, conflict resolution, GitFlow, hooks.",                  cluster:"core",     tier:0, prerequisites:[],                            position:[ 2.5,  0.5,  0  ] },
  { id:"linux",         label:"Linux",            description:"Bash scripting, process management, file system, permissions, cron, SSH.",         cluster:"core",     tier:0, prerequisites:[],                            position:[-2.5,  0.5,  0  ] },
  { id:"dsa",           label:"Data Structures",  description:"Arrays, linked lists, stacks, queues, trees, graphs, hash tables with Big-O.",    cluster:"core",     tier:1, prerequisites:["cs"],                        position:[ 0.5, -2.5,  1  ] },
  { id:"algorithms",    label:"Algorithms",       description:"Sorting, searching, DP, greedy, graph traversal (BFS/DFS), divide & conquer.",    cluster:"core",     tier:2, prerequisites:["dsa"],                       position:[ 0.5, -4.5,  2  ] },
  { id:"system-design", label:"System Design",    description:"CAP theorem, load balancing, caching, sharding, message queues, consistency.",    cluster:"core",     tier:3, prerequisites:["algorithms","postgresql"],   position:[ 0,   -7,    3  ] },
  { id:"clean-code",    label:"Clean Code",       description:"SOLID principles, design patterns (GoF), refactoring, TDD, code reviews.",        cluster:"core",     tier:2, prerequisites:["cs"],                        position:[-2,   -3.5,  1  ] },

  // ── FRONTEND ──────────────────────────────────────────────────────
  { id:"html-css",      label:"HTML & CSS",       description:"Semantic HTML5, Flexbox, Grid, animations, WCAG accessibility, responsive.",      cluster:"frontend", tier:0, prerequisites:[],                            position:[ 6,    0,    0  ] },
  { id:"javascript",    label:"JavaScript",       description:"ES2024+, closures, prototypes, async/await, Promises, event loop, DOM APIs.",     cluster:"frontend", tier:1, prerequisites:["html-css"],                  position:[ 8.5,  1.5, -1  ] },
  { id:"typescript",    label:"TypeScript",       description:"Static typing, interfaces, generics, mapped types, conditional types.",           cluster:"frontend", tier:2, prerequisites:["javascript"],                position:[11,    2.5, -2  ] },
  { id:"react",         label:"React",            description:"Hooks, RSC, context, memo, Zustand, React Query, concurrent features.",           cluster:"frontend", tier:2, prerequisites:["javascript"],                position:[10,   -1,    2  ] },
  { id:"nextjs",        label:"Next.js",          description:"App Router, server components, streaming, ISR, edge functions, middleware.",      cluster:"frontend", tier:3, prerequisites:["react","typescript"],        position:[13,    1,    1  ] },
  { id:"vuejs",         label:"Vue.js",           description:"Composition API, Pinia, Vue Router, Nuxt 3, SSR, reactive primitives.",           cluster:"frontend", tier:2, prerequisites:["javascript"],                position:[10,    3.5, -2  ] },
  { id:"svelte",        label:"Svelte",           description:"Compiled reactivity, SvelteKit, stores, transitions, no virtual DOM.",            cluster:"frontend", tier:2, prerequisites:["javascript"],                position:[ 8.5, -3,    0  ] },
  { id:"tailwindcss",   label:"Tailwind CSS",     description:"Utility-first CSS, JIT, design tokens, dark mode, custom plugins, shadcn.",      cluster:"frontend", tier:1, prerequisites:["html-css"],                  position:[ 7,    2,    1  ] },
  { id:"framer-motion", label:"Framer Motion",    description:"Spring physics, layout animations, gesture interactions, AnimatePresence.",       cluster:"frontend", tier:2, prerequisites:["react"],                     position:[ 8,   -4.5,  1  ] },
  { id:"graphql",       label:"GraphQL",          description:"Schema-first design, resolvers, Apollo Client, subscriptions, DataLoader.",       cluster:"frontend", tier:2, prerequisites:["javascript"],                position:[12,   -2,    0  ] },
  { id:"vite",          label:"Vite",             description:"ESM-native bundler, HMR, Rollup, code splitting, plugin ecosystem.",              cluster:"frontend", tier:1, prerequisites:["javascript"],                position:[ 7,   -1.5, -1  ] },
  { id:"jest",          label:"Jest & Vitest",    description:"Unit tests, React Testing Library, mocking, snapshot tests, coverage.",          cluster:"frontend", tier:2, prerequisites:["react"],                     position:[11,    4,    0  ] },

  // ── BACKEND ───────────────────────────────────────────────────────
  { id:"python",        label:"Python",           description:"Core syntax, OOP, generators, decorators, async, packaging, venvs.",             cluster:"backend",  tier:0, prerequisites:[],                            position:[-6.5,  0,    0  ] },
  { id:"fastapi",       label:"FastAPI",          description:"REST APIs, Pydantic v2, dependency injection, OAuth2, WebSockets.",              cluster:"backend",  tier:2, prerequisites:["python"],                    position:[-9.5,  1.5, -1  ] },
  { id:"django",        label:"Django",           description:"ORM, migrations, DRF, authentication, admin panel, Celery, signals.",            cluster:"backend",  tier:2, prerequisites:["python"],                    position:[-9,    3.5,  0  ] },
  { id:"nodejs",        label:"Node.js",          description:"Event loop, streams, Express, Hono, Fastify, npm/pnpm, worker threads.",         cluster:"backend",  tier:2, prerequisites:["javascript"],                position:[-8.5, -1.5,  1  ] },
  { id:"go",            label:"Go",               description:"Goroutines, channels, interfaces, standard library, Chi/Fiber, gRPC.",           cluster:"backend",  tier:2, prerequisites:["cs"],                        position:[-10,   0,   -1  ] },
  { id:"rust",          label:"Rust",             description:"Ownership, borrowing, lifetimes, traits, async (Tokio), Actix-web, Axum.",       cluster:"backend",  tier:3, prerequisites:["cs"],                        position:[-8,    3.5, -2  ] },
  { id:"java",          label:"Java",             description:"JVM, Spring Boot, Maven/Gradle, multithreading, generics, streams API.",         cluster:"backend",  tier:2, prerequisites:["cs"],                        position:[-7,   -3,    0  ] },
  { id:"postgresql",    label:"PostgreSQL",       description:"SQL, EXPLAIN ANALYZE, CTEs, window functions, indexing, Prisma ORM.",            cluster:"backend",  tier:2, prerequisites:["cs"],                        position:[-11,   2.5,  0  ] },
  { id:"mongodb",       label:"MongoDB",          description:"Document model, aggregation pipeline, Atlas, Mongoose ODM, sharding.",           cluster:"backend",  tier:2, prerequisites:["cs"],                        position:[-11.5, 4.5,  1  ] },
  { id:"redis",         label:"Redis",            description:"Caching, pub/sub, sorted sets, streams, session stores, Lua scripting.",         cluster:"backend",  tier:3, prerequisites:["postgresql"],                position:[-13,  -1.5, -1  ] },
  { id:"kafka",         label:"Apache Kafka",     description:"Event streaming, partitions, consumer groups, exactly-once semantics.",          cluster:"backend",  tier:3, prerequisites:["postgresql"],                position:[-13,   1,    1  ] },

  // ── AI / ML ───────────────────────────────────────────────────────
  { id:"numpy-pandas",  label:"NumPy & Pandas",   description:"Array ops, DataFrames, vectorisation, groupby, EDA, matplotlib.",               cluster:"aiml",     tier:1, prerequisites:["python"],                    position:[ 0.5,  6.5,  0  ] },
  { id:"scikit-learn",  label:"scikit-learn",     description:"Regression, classification, clustering, pipelines, GridSearch, evaluation.",    cluster:"aiml",     tier:2, prerequisites:["numpy-pandas","algorithms"], position:[ 2,    8.5,  2  ] },
  { id:"pytorch",       label:"PyTorch",          description:"Autograd, neural nets, dataloaders, GPU training, distributed, TorchScript.",   cluster:"aiml",     tier:3, prerequisites:["scikit-learn"],              position:[ 4,   11.5, -1  ] },
  { id:"tensorflow",    label:"TensorFlow",       description:"Keras API, tf.data, SavedModel, TFX, TFLite, TensorFlow Serving.",              cluster:"aiml",     tier:3, prerequisites:["scikit-learn"],              position:[ 5.5,  9.5,  2  ] },
  { id:"langchain",     label:"LangChain",        description:"LLM orchestration, tool use, agent loops, memory, LangGraph, LCEL.",            cluster:"aiml",     tier:3, prerequisites:["python","scikit-learn"],     position:[-2,    9.5,  2  ] },
  { id:"rag",           label:"RAG Systems",      description:"Vector DBs (Pinecone, Weaviate, pgvector), embeddings, retrieval pipelines.",   cluster:"aiml",     tier:3, prerequisites:["langchain"],                 position:[ 0,   13,    0  ] },
  { id:"huggingface",   label:"Hugging Face",     description:"Transformers, datasets, PEFT, LoRA fine-tuning, Inference API, Spaces.",        cluster:"aiml",     tier:3, prerequisites:["pytorch"],                   position:[ 2,   13.5,  2  ] },
  { id:"opencv",        label:"OpenCV",           description:"Computer vision, image processing, object detection, video analysis.",          cluster:"aiml",     tier:2, prerequisites:["numpy-pandas"],              position:[-1,    7,    1  ] },

  // ── WEB3 ──────────────────────────────────────────────────────────
  { id:"blockchain",    label:"Blockchain",       description:"Consensus, Merkle trees, UTXO vs account model, cryptographic hashing.",        cluster:"web3",     tier:1, prerequisites:["cs"],                        position:[ 0,   -6.5, -3  ] },
  { id:"solidity",      label:"Solidity",         description:"EVM, ABI encoding, contract lifecycle, gas optimisation, storage layout.",      cluster:"web3",     tier:2, prerequisites:["blockchain","javascript"],   position:[ 3,   -8.5, -2  ] },
  { id:"hardhat",       label:"Hardhat",          description:"JS/TS testing, tasks, mainnet forking, console.log in Solidity, plugins.",      cluster:"web3",     tier:2, prerequisites:["solidity"],                  position:[-2,   -9.5, -4  ] },
  { id:"foundry",       label:"Foundry",          description:"Forge tests, fuzz testing, invariant tests, cheatcodes, Cast, Anvil.",          cluster:"web3",     tier:3, prerequisites:["solidity","rust"],           position:[ 5,   -9,   -3  ] },
  { id:"ethersjs",      label:"Ethers.js",        description:"Provider, signer, contract calls, ENS, event filters, TypeChain codegen.",      cluster:"web3",     tier:2, prerequisites:["javascript","blockchain"],   position:[ 1,  -10,   -2  ] },
  { id:"wagmi",         label:"wagmi",            description:"React hooks for Ethereum, WalletConnect, viem, smart contract read/write.",     cluster:"web3",     tier:3, prerequisites:["ethersjs","react"],          position:[ 4,  -11.5, -1  ] },
  { id:"defi",          label:"DeFi",             description:"AMMs, lending protocols, yield, MEV, flash loans, liquidity pools.",            cluster:"web3",     tier:3, prerequisites:["hardhat"],                   position:[ 0,  -12.5, -3  ] },
  { id:"ipfs",          label:"IPFS",             description:"Content addressing, DHT, Filecoin, NFT metadata, pinning services.",            cluster:"web3",     tier:2, prerequisites:["blockchain"],                position:[-3,   -8,   -2  ] },

  // ── DEVOPS & CLOUD ────────────────────────────────────────────────
  { id:"docker",        label:"Docker",           description:"Containerisation, Dockerfile, multi-stage builds, Compose, networking.",        cluster:"devops",   tier:1, prerequisites:["linux"],                     position:[-4,    5,    2  ] },
  { id:"kubernetes",    label:"Kubernetes",       description:"Pods, services, deployments, Helm, HPA, RBAC, Ingress, cluster management.",    cluster:"devops",   tier:3, prerequisites:["docker","go"],               position:[-6,    8,    3  ] },
  { id:"terraform",     label:"Terraform",        description:"Infrastructure as Code, state, modules, providers, Terragrunt.",                cluster:"devops",   tier:2, prerequisites:["docker"],                    position:[-2,    7,    1  ] },
  { id:"github-actions",label:"GitHub Actions",   description:"CI/CD workflows, matrix builds, secrets, reusable workflows, environments.",    cluster:"devops",   tier:2, prerequisites:["git","docker"],              position:[-4,    3.5, -1  ] },
  { id:"aws",           label:"AWS",              description:"EC2, S3, RDS, Lambda, ECS, CloudFront, IAM, VPC, CDK, CloudFormation.",         cluster:"devops",   tier:2, prerequisites:["docker","linux"],            position:[-7,    6,    0  ] },
  { id:"nginx",         label:"Nginx",            description:"Reverse proxy, load balancing, SSL termination, rate limiting, caching.",       cluster:"devops",   tier:2, prerequisites:["linux"],                     position:[-3,    2.5,  1  ] },
  { id:"prometheus",    label:"Prometheus",       description:"Metrics, PromQL, alerting, Grafana dashboards, exporters, service discovery.",  cluster:"devops",   tier:3, prerequisites:["kubernetes"],                position:[-8,    9.5,  2  ] },
  { id:"ansible",       label:"Ansible",          description:"Configuration management, playbooks, roles, inventory, vault, idempotency.",    cluster:"devops",   tier:2, prerequisites:["linux","python"],            position:[-5,    4,   -2  ] },

  // ── MOBILE ────────────────────────────────────────────────────────
  { id:"react-native",  label:"React Native",     description:"Cross-platform mobile, Expo, Navigation, Reanimated, NativeWind, New Arch.",    cluster:"mobile",   tier:2, prerequisites:["react"],                     position:[15,    0,    0  ] },
  { id:"flutter",       label:"Flutter",          description:"Dart, widget tree, BLoC/Provider, Riverpod, animations, platform channels.",    cluster:"mobile",   tier:2, prerequisites:["cs"],                        position:[15,    3,    1  ] },
  { id:"swift",         label:"Swift",            description:"SwiftUI, UIKit, MVVM, Combine, Core Data, URLSession, TestFlight.",             cluster:"mobile",   tier:2, prerequisites:["cs"],                        position:[15,   -2,   -1  ] },
  { id:"kotlin",        label:"Kotlin",           description:"Jetpack Compose, Coroutines, Flow, Room, Retrofit, ViewModel, Hilt.",           cluster:"mobile",   tier:2, prerequisites:["java"],                      position:[15,   -4.5,  0  ] },
];

// Deduplicate by id — safety net against accidental dupes
const STAR_MAP = new Map(RAW_STARS.map(s => [s.id, s]));
const STARS    = [...STAR_MAP.values()];

// Build unique edges from prerequisites
const edgeSet  = new Set<string>();
const EDGES: [string, string][] = [];
STARS.forEach(s => {
  s.prerequisites.forEach(p => {
    const key = `${p}→${s.id}`;
    if (!edgeSet.has(key) && STAR_MAP.has(p)) {
      edgeSet.add(key);
      EDGES.push([p, s.id]);
    }
  });
});

// ─── Glow sprite texture ─────────────────────────────────────────────
function glowTex(hex: string, bright = false): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0,    hex + "ff");
  g.addColorStop(0.18, hex + (bright ? "ff" : "cc"));
  g.addColorStop(0.45, hex + (bright ? "88" : "44"));
  g.addColorStop(1,    "#00000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/**
 * LADDER PATH — converts a straight A→B edge into a 5-point
 * right-angle "circuit board trace":
 *   A  →  drop to midY at A's X/Z
 *      →  travel Z-axis to B's Z
 *      →  travel X-axis to B's X
 *      →  B
 * This gives every connection the look of a PCB trace /
 * scaffold ladder instead of a diagonal line.
 */
function ladderPoints(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const midY = (from.y + to.y) / 2;
  return [
    from.clone(),
    new THREE.Vector3(from.x, midY,  from.z),   // drop/rise to mid-Y
    new THREE.Vector3(from.x, midY,  to.z),     // travel Z
    new THREE.Vector3(to.x,   midY,  to.z),     // travel X
    to.clone(),                                  // arrive at B
  ];
}

/**
 * LABEL TEXTURE — renders the node name onto a canvas sprite.
 * Returns a CanvasTexture sized to the text so every label is crisp.
 * hex = cluster accent colour used for the text glow.
 */
function makeLabelTex(text: string, hex: string, done = false): THREE.CanvasTexture {
  const pad  = 18;
  const fs   = 26;                       // font size (px)
  const font = `700 ${fs}px 'Orbitron', 'Courier New', monospace`;

  // Measure text width
  const tmp  = document.createElement("canvas");
  const tctx = tmp.getContext("2d")!;
  tctx.font  = font;
  const tw   = Math.ceil(tctx.measureText(text).width);

  const cw = tw + pad * 2;
  const ch = fs + pad * 1.4;

  const c   = document.createElement("canvas");
  c.width   = cw;
  c.height  = ch;
  const ctx = c.getContext("2d")!;

  // Optional pill background for readability
  const r = ch / 2;
  ctx.fillStyle = "rgba(0,0,12,0.55)";
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.arcTo(cw, 0, cw, ch, r);
  ctx.arcTo(cw, ch, 0, ch, r); ctx.arcTo(0, ch, 0, 0, r);
  ctx.arcTo(0, 0, cw, 0, r); ctx.closePath();
  ctx.fill();

  // Glow shadow
  ctx.shadowColor  = done ? "#ffffff" : hex;
  ctx.shadowBlur   = done ? 12 : 7;

  // Text
  ctx.font      = font;
  ctx.fillStyle = done ? "#ffffff" : hex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cw / 2, ch / 2);

  return new THREE.CanvasTexture(c);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
}

const TYPE_COLOR: Record<string, string> = {
  docs:"#38bdf8", video:"#fb923c", repo:"#34d399", course:"#c084fc", article:"#fbbf24",
};
const TYPE_ICON: Record<string, string> = {
  docs:"📄", video:"▶", repo:"⭐", course:"🎓", article:"📖",
};

// ─── Main component ──────────────────────────────────────────────────
export default function ConstellationApp() {
  const mountRef  = useRef<HTMLDivElement>(null);
  const camRef    = useRef<THREE.PerspectiveCamera>();
  const rendRef   = useRef<THREE.WebGLRenderer>();
  const sceneRef  = useRef<THREE.Scene>();
  const rafRef    = useRef<number>();
  const sprites      = useRef<Map<string, THREE.Sprite>>(new Map());
  const labelSprites = useRef<Map<string, THREE.Sprite>>(new Map());
  const lineGroups   = useRef<THREE.Line[]>([]);   // one entry per EDGE
  const spherical = useRef({ theta: 0, phi: Math.PI / 3.5, r: 30 });
  const mouse     = useRef(new THREE.Vector2());
  const clock     = useRef(0);

  const [selected,  setSelected]  = useState<StarNode | null>(null);
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [loadingR,  setLoadingR]  = useState(false);
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<StarNode[]>([]);
  const [warping,   setWarping]   = useState(false);
  const [arModal,   setArModal]   = useState(false);
  const [legend,    setLegend]    = useState(true);

  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set<string>(JSON.parse(localStorage.getItem("lc_v3") ?? "[]")); }
    catch { return new Set(); }
  });

  const isUnlocked = useCallback((id: string) => {
    const s = STAR_MAP.get(id);
    return !s || s.prerequisites.every(p => completed.has(p));
  }, [completed]);

  const saveProgress = useCallback((next: Set<string>) => {
    localStorage.setItem("lc_v3", JSON.stringify([...next]));
    setCompleted(new Set(next));
  }, []);

  const toggleDone = useCallback((id: string) => {
    if (!isUnlocked(id)) return;
    const next = new Set(completed);
    next.has(id) ? next.delete(id) : next.add(id);
    saveProgress(next);
  }, [completed, isUnlocked, saveProgress]);

  const fetchRes = useCallback(async (star: StarNode) => {
    setLoadingR(true); setResources(null);
    try {
      const r = await fetch("/api/learn/resources", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: star.label, description: star.description, tier: TIERS[star.tier] }),
      });
      const d = await r.json();
      setResources(d.resources ?? []);
    } catch { setResources([]); }
    setLoadingR(false);
  }, []);

  const openStar = useCallback((star: StarNode) => {
    setSelected(star); fetchRes(star);
  }, [fetchRes]);

  // Warp camera animation
  const warpTo = useCallback((star: StarNode) => {
    if (!camRef.current) return;
    setWarping(true); setResults([]); setQuery("");
    const [tx, ty, tz] = star.position;
    const tgt   = new THREE.Vector3(tx, ty, tz);
    const start = camRef.current.position.clone();
    const end   = new THREE.Vector3(tx + 3, ty + 2, tz + 8);
    let t = 0;
    const tick = () => {
      t += 0.024;
      if (t >= 1) {
        camRef.current!.position.copy(end); camRef.current!.lookAt(tgt);
        const d = end.length();
        spherical.current = { r:d, theta:Math.atan2(end.x,end.z), phi:Math.acos(Math.min(1,end.y/d)) };
        setWarping(false); openStar(star); return;
      }
      camRef.current!.position.lerpVectors(start, end, easeInOutCubic(t));
      camRef.current!.lookAt(tgt);
      requestAnimationFrame(tick);
    };
    tick();
  }, [openStar]);

  // Reactively update sprites + ladder lines when progress changes
  useEffect(() => {
    const texCache = new Map<string, THREE.CanvasTexture>();
    sprites.current.forEach((sprite, id) => {
      const star  = STAR_MAP.get(id)!;
      const done  = completed.has(id);
      const avail = isUnlocked(id);
      const hex   = done || avail ? CLUSTER[star.cluster].hex : "#1e2a44";
      const key   = `${hex}_${done}`;
      if (!texCache.has(key)) texCache.set(key, glowTex(hex, done));
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.map = texCache.get(key)!; mat.needsUpdate = true;
      sprite.scale.setScalar(done ? 2.9 : avail ? 2.2 : 1.5);
    });

    // Update label opacity + texture to reflect locked / unlocked / done state
    labelSprites.current.forEach((lSprite, id) => {
      const star  = STAR_MAP.get(id)!;
      const done  = completed.has(id);
      const avail = isUnlocked(id);
      const hex   = done || avail ? CLUSTER[star.cluster].hex : "#1e2a44";
      const lMat  = lSprite.material as THREE.SpriteMaterial;
      lMat.map     = makeLabelTex(star.label, hex, done);
      lMat.opacity = done ? 1 : avail ? 0.82 : 0.28;
      lMat.needsUpdate = true;
    });

    lineGroups.current.forEach((line, i) => {
      const [fId, tId] = EDGES[i] ?? [];
      if (!fId || !tId) return;
      const mat       = line.material as THREE.LineBasicMaterial;
      const bothDone  = completed.has(fId) && completed.has(tId);
      const fromDone  = completed.has(fId);
      const toStar    = STAR_MAP.get(tId);
      mat.color.set(bothDone ? CLUSTER[toStar!.cluster].num : fromDone ? 0x2255aa : 0x0a1020);
      mat.opacity     = bothDone ? 0.9 : fromDone ? 0.4 : 0.1;
      mat.needsUpdate = true;
    });
  }, [completed, isUnlocked]);

  // Three.js bootstrap — runs once
  useEffect(() => {
    if (!mountRef.current) return;
    const W = window.innerWidth, H = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00000a);
    scene.fog = new THREE.FogExp2(0x00000a, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(58, W/H, 0.1, 300);
    camera.position.set(0, 4, 30);
    camRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendRef.current = renderer;

    // Background starfield
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(5000 * 3);
    for (let i = 0; i < bgPos.length; i++) bgPos[i] = (Math.random()-0.5)*220;
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      color:0x6688bb, size:0.055, transparent:true, opacity:0.45,
    })));

    // Nebulae
    [[5,3,-16,0x0d0520,22],[-7,-5,-19,0x05101a,18],[0,11,-22,0x120520,28],[8,-8,-14,0x0a0a1f,16]].forEach(([x,y,z,col,sz])=>{
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(sz as number, sz as number),
        new THREE.MeshBasicMaterial({ color:col as number, transparent:true, opacity:0.1, depthWrite:false })
      );
      m.position.set(x as number,y as number,z as number); m.lookAt(camera.position);
      scene.add(m);
    });

    // Skill star sprites
    const texCache = new Map<string, THREE.CanvasTexture>();
    STARS.forEach(star => {
      const hex = star.prerequisites.length === 0 ? CLUSTER[star.cluster].hex : "#1e2a44";
      if (!texCache.has(hex)) texCache.set(hex, glowTex(hex));
      const mat    = new THREE.SpriteMaterial({ map:texCache.get(hex)!, transparent:true, depthWrite:false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(star.prerequisites.length === 0 ? 2.2 : 1.5);
      sprite.position.set(...star.position);
      sprite.userData.starId = star.id;
      scene.add(sprite);
      sprites.current.set(star.id, sprite);
    });

    // ── TEXT LABEL SPRITES ──────────────────────────────────────────
    // Each node gets its technology name rendered on a canvas texture
    // and displayed as a billboard sprite just above the glow orb.
    // The label is always camera-facing (sprite = auto-billboard).
    STARS.forEach(star => {
      const avail = star.prerequisites.length === 0;
      const hex   = avail ? CLUSTER[star.cluster].hex : "#1e2a44";
      const tex   = makeLabelTex(star.label, hex, false);

      // Scale the sprite so wider text stays proportional.
      // Base width ~3 world-units per 100px of canvas width.
      const scaleX = (tex.image.width  / 100) * 2.2;
      const scaleY = (tex.image.height / 100) * 2.2;

      const lMat    = new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false,
        opacity: avail ? 0.82 : 0.28,
      });
      const lSprite = new THREE.Sprite(lMat);
      lSprite.scale.set(scaleX, scaleY, 1);
      // Position label just above the glow sprite (offset in Y)
      lSprite.position.set(
        star.position[0],
        star.position[1] + 1.55,   // sit above the orb
        star.position[2],
      );
      scene.add(lSprite);
      labelSprites.current.set(star.id, lSprite);
    });

    // ── LADDER EDGES ────────────────────────────────────────────────
    // Each edge is drawn as a right-angle 5-point polyline (circuit trace)
    // instead of a straight diagonal. The path drops to a midpoint Y,
    // travels along Z, then X before arriving at the destination —
    // creating the "ladder / scaffold" visual pattern.
    EDGES.forEach(([fromId, toId], i) => {
      const from = STAR_MAP.get(fromId);
      const to   = STAR_MAP.get(toId);
      if (!from || !to) return;

      const vFrom = new THREE.Vector3(...from.position);
      const vTo   = new THREE.Vector3(...to.position);
      const pts   = ladderPoints(vFrom, vTo);

      // Main ladder trace
      const geo  = new THREE.BufferGeometry().setFromPoints(pts);
      const mat  = new THREE.LineBasicMaterial({
        color:0x0a1020, transparent:true, opacity:0.1,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      lineGroups.current[i] = line;

      // Small tick marks at the two bend corners for a "rung" effect
      const bendA = pts[1]; // corner after first leg
      const bendB = pts[3]; // corner before last leg
      [bendA, bendB].forEach(pt => {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pt.x-0.22, pt.y, pt.z),
          new THREE.Vector3(pt.x+0.22, pt.y, pt.z),
        ]);
        scene.add(new THREE.Line(tickGeo,
          new THREE.LineBasicMaterial({ color:0x1a3055, transparent:true, opacity:0.18 })
        ));
      });
    });

    scene.add(new THREE.AmbientLight(0x0a0a22, 1));

    // Manual orbit controls
    let drag = false, px = 0, py = 0;
    const updateCam = () => {
      const {theta,phi,r} = spherical.current;
      camera.position.set(r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
    };

    const onDown  = (e: MouseEvent) => { if((e.target as HTMLElement).closest("[data-ui]")) return; drag=true; px=e.clientX; py=e.clientY; };
    const onMove  = (e: MouseEvent) => {
      mouse.current.set((e.clientX/W)*2-1, -(e.clientY/H)*2+1);
      if (!drag) return;
      spherical.current.theta -= (e.clientX-px)*0.007;
      spherical.current.phi    = Math.max(0.1, Math.min(Math.PI-0.1, spherical.current.phi+(e.clientY-py)*0.007));
      px=e.clientX; py=e.clientY; updateCam();
    };
    const onUp    = () => { drag=false; };
    const onWheel = (e: WheelEvent) => { spherical.current.r = Math.max(4, Math.min(65, spherical.current.r+e.deltaY*0.022)); updateCam(); };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-ui]")) return;
      const ray = new THREE.Raycaster(); ray.setFromCamera(mouse.current, camera);
      const hits = ray.intersectObjects([...sprites.current.values()]);
      if (hits[0]) { const s=STAR_MAP.get(hits[0].object.userData.starId); if(s) openStar(s); }
    };
    const onResize = () => {
      const W2=window.innerWidth, H2=window.innerHeight;
      camera.aspect=W2/H2; camera.updateProjectionMatrix(); renderer.setSize(W2,H2);
    };

    renderer.domElement.addEventListener("mousedown",onDown);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
    renderer.domElement.addEventListener("click",onClick);
    window.addEventListener("resize",onResize);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      clock.current += 0.004;
      sprites.current.forEach((sprite, id) => {
        if (completed.has(id)) sprite.scale.setScalar(2.9*(1+Math.sin(clock.current*2+id.charCodeAt(0)*0.5)*0.1));
      });
      // Gently bob the label of the selected star for attention
      labelSprites.current.forEach((lSprite, id) => {
        const lMat = lSprite.material as THREE.SpriteMaterial;
        if (completed.has(id)) {
          const pulse = 1 + Math.sin(clock.current * 2 + id.charCodeAt(0) * 0.5) * 0.06;
          lSprite.scale.setX(lSprite.scale.x * pulse / lSprite.scale.x * lSprite.scale.x); // keep aspect
          // Simpler: just pulse opacity
          lMat.opacity = 0.9 + Math.sin(clock.current * 1.5) * 0.1;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current!);
      renderer.domElement.removeEventListener("mousedown",onDown);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      renderer.domElement.removeEventListener("wheel",onWheel);
      renderer.domElement.removeEventListener("click",onClick);
      window.removeEventListener("resize",onResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = completed.size;
  const pct  = Math.round((done/STARS.length)*100);

  const onSearch = (q: string) => {
    setQuery(q);
    setResults(q.trim() ? STARS.filter(s=>s.label.toLowerCase().includes(q.toLowerCase())).slice(0,8) : []);
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", position:"relative", cursor:"crosshair", fontFamily:"'Rajdhani',sans-serif", backgroundColor:"#00000a" }}>

      <div ref={mountRef} style={{ position:"absolute", inset:0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        @keyframes lc-pulse { 0%,100%{opacity:.28} 50%{opacity:.75} }
        @keyframes lc-spin  { to{transform:rotate(360deg)} }
        @keyframes lc-glow  { 0%,100%{filter:drop-shadow(0 0 4px #00c8ff)} 50%{filter:drop-shadow(0 0 14px #00c8ff)} }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── WARP LINES ─────────────────────────────────────── */}
      <AnimatePresence>
        {warping && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"absolute",inset:0,zIndex:5,pointerEvents:"none",overflow:"hidden"}}>
            {Array.from({length:70}).map((_,i)=>(
              <motion.div key={i}
                initial={{scaleX:0,opacity:0}} animate={{scaleX:[0,1,0],opacity:[0,0.85,0]}}
                transition={{duration:0.65,delay:i*0.01}}
                style={{position:"absolute",top:`${Math.random()*100}%`,left:"50%",
                  width:`${50+Math.random()*320}px`,height:"1px",
                  background:`rgba(0,${110+Math.floor(Math.random()*145)},255,0.9)`,
                  transformOrigin:"left center",transform:`rotate(${(Math.random()-0.5)*32}deg)`}} />
            ))}
            <motion.div initial={{opacity:0}} animate={{opacity:[0,0.07,0]}} transition={{duration:0.65}}
              style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(0,160,255,0.2) 0%,transparent 70%)"}} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP HUD ────────────────────────────────────────── */}
      <div data-ui style={{position:"absolute",top:0,left:0,right:0,height:"66px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem",background:"linear-gradient(180deg,rgba(0,0,14,0.97) 0%,transparent 100%)",borderBottom:"1px solid rgba(0,200,255,0.08)",zIndex:10}}>

        <div style={{display:"flex",alignItems:"center",gap:"0.875rem"}}>
          <a href="/dashboard" style={{textDecoration:"none",color:"rgba(0,200,255,0.45)",fontSize:"0.65rem",letterSpacing:"0.18em",fontFamily:"'Orbitron',monospace",transition:"color .2s",whiteSpace:"nowrap"}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#00d4ff"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="rgba(0,200,255,0.45)"}>
            ← MISSION CONTROL
          </a>
          <div style={{width:"1px",height:"24px",background:"rgba(0,200,255,0.1)"}} />
          <div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#000b1f,#001540)",border:"1px solid rgba(0,200,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>🌌</div>
            <div>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:"0.875rem",fontWeight:700,color:"#00d4ff",letterSpacing:"0.1em"}}>LEARNING CONSTELLATIONS</div>
              <div style={{fontSize:"0.55rem",color:"rgba(0,200,255,0.38)",letterSpacing:"0.2em",textTransform:"uppercase"}}>Career Galaxy · {STARS.length} Stars · {EDGES.length} Ladder Paths</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{position:"relative",width:"310px"}}>
          <span style={{position:"absolute",left:"0.7rem",top:"50%",transform:"translateY(-50%)",color:"rgba(0,200,255,0.35)",pointerEvents:"none",fontSize:"0.875rem"}}>⌕</span>
          <input value={query} onChange={e=>onSearch(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&results[0])warpTo(results[0]);}}
            placeholder="WARP TO STAR…"
            style={{width:"100%",padding:"0.5rem 1rem 0.5rem 2.125rem",background:"rgba(0,10,30,0.85)",border:"1px solid rgba(0,200,255,0.18)",borderRadius:"0.475rem",color:"#00d4ff",fontSize:"0.72rem",fontFamily:"inherit",outline:"none",letterSpacing:"0.1em",backdropFilter:"blur(12px)",transition:"border-color .2s"}}
            onFocus={e=>(e.target as HTMLInputElement).style.borderColor="rgba(0,200,255,0.45)"}
            onBlur={e=>(e.target as HTMLInputElement).style.borderColor="rgba(0,200,255,0.18)"} />
          {results.length>0&&(
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"rgba(0,5,20,0.97)",border:"1px solid rgba(0,200,255,0.16)",borderRadius:"0.475rem",backdropFilter:"blur(20px)",zIndex:30,overflow:"hidden"}}>
              {results.map(s=>(
                <button key={s.id} onClick={()=>warpTo(s)}
                  style={{display:"flex",alignItems:"center",gap:"0.625rem",width:"100%",padding:"0.45rem 0.875rem",background:"none",border:"none",cursor:"pointer",color:CLUSTER[s.cluster].hex,fontSize:"0.72rem",fontFamily:"inherit",letterSpacing:"0.06em",textAlign:"left",transition:"background .15s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(0,200,255,0.05)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="none"}>
                  <span>{CLUSTER[s.cluster].icon}</span>
                  <span style={{flex:1}}>{s.label}</span>
                  <span style={{fontSize:"0.56rem",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>{TIERS[s.tier].toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress ring */}
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"1.5rem",fontWeight:900,color:"#00d4ff",lineHeight:1}}>{pct}<span style={{fontSize:"0.65rem",color:"rgba(0,200,255,0.4)"}}>%</span></div>
            <div style={{fontSize:"0.55rem",color:"rgba(0,200,255,0.35)",letterSpacing:"0.18em",textTransform:"uppercase"}}>{done}/{STARS.length} CONQUERED</div>
          </div>
          <svg width="42" height="42" style={{transform:"rotate(-90deg)",flexShrink:0}}>
            <circle cx="21" cy="21" r="16" fill="none" stroke="rgba(0,200,255,0.08)" strokeWidth="2.5"/>
            <circle cx="21" cy="21" r="16" fill="none" stroke="#00d4ff" strokeWidth="2.5"
              strokeDasharray={`${2*Math.PI*16}`} strokeDashoffset={`${2*Math.PI*16*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s ease",filter:"drop-shadow(0 0 5px #00d4ff88)"}}/>
          </svg>
          <button onClick={()=>setArModal(true)}
            style={{padding:"0.45rem 0.875rem",background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.25)",borderRadius:"0.45rem",color:"#00d4ff",fontSize:"0.65rem",fontFamily:"inherit",cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:"0.375rem",transition:"all .2s"}}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(0,200,255,0.12)";el.style.boxShadow="0 0 16px rgba(0,200,255,0.22)";}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(0,200,255,0.05)";el.style.boxShadow="none";}}>
            ⬡ AR
          </button>
        </div>
      </div>

      {/* ── CLUSTER LEGEND ─────────────────────────────────── */}
      <AnimatePresence>
        {legend&&(
          <motion.div data-ui initial={{x:-80,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-80,opacity:0}} transition={{type:"spring",stiffness:260,damping:28}}
            style={{position:"absolute",left:"1.25rem",top:"50%",transform:"translateY(-50%)",zIndex:10,display:"flex",flexDirection:"column",gap:"0.375rem"}}>
            {(Object.entries(CLUSTER) as [Cluster, typeof CLUSTER[Cluster]][]).map(([key,cfg])=>{
              const cls=STARS.filter(s=>s.cluster===key);
              const clDone=cls.filter(s=>completed.has(s.id)).length;
              return(
                <div key={key} style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.375rem 0.7rem",background:"rgba(0,3,16,0.84)",border:`1px solid ${cfg.hex}18`,borderRadius:"0.45rem",backdropFilter:"blur(16px)",minWidth:"152px"}}>
                  <div style={{width:"7px",height:"7px",borderRadius:"50%",background:cfg.hex,boxShadow:`0 0 7px ${cfg.hex}`,flexShrink:0}}/>
                  <span style={{fontSize:"0.72rem",color:cfg.hex,letterSpacing:"0.07em",flex:1}}>{cfg.label}</span>
                  <span style={{fontSize:"0.58rem",color:"rgba(255,255,255,0.22)"}}>{clDone}/{cls.length}</span>
                </div>
              );
            })}
            <button onClick={()=>setLegend(false)} style={{fontSize:"0.54rem",color:"rgba(255,255,255,0.15)",background:"none",border:"none",cursor:"pointer",letterSpacing:"0.14em",textTransform:"uppercase",padding:"0.1rem 0",textAlign:"left"}}>[ HIDE ]</button>
          </motion.div>
        )}
      </AnimatePresence>
      {!legend&&(
        <button data-ui onClick={()=>setLegend(true)} style={{position:"absolute",left:"1.25rem",top:"50%",transform:"translateY(-50%)",background:"rgba(0,4,18,0.78)",border:"1px solid rgba(0,200,255,0.12)",borderRadius:"0.4rem",color:"rgba(0,200,255,0.4)",fontSize:"0.54rem",padding:"0.35rem 0.5rem",cursor:"pointer",letterSpacing:"0.14em",zIndex:10}}>
          ◁ MAP
        </button>
      )}

      {/* ── STAR DETAIL PANEL ──────────────────────────────── */}
      <AnimatePresence>
        {selected&&(
          <motion.div data-ui key={selected.id}
            initial={{x:420,opacity:0}} animate={{x:0,opacity:1}} exit={{x:420,opacity:0}}
            transition={{type:"spring",stiffness:300,damping:34}}
            style={{position:"absolute",right:0,top:0,bottom:0,width:"390px",background:"rgba(0,3,16,0.95)",borderLeft:`1px solid ${CLUSTER[selected.cluster].hex}22`,backdropFilter:"blur(32px)",zIndex:15,display:"flex",flexDirection:"column",overflowY:"auto"}}>

            <div style={{padding:"1.25rem 1.375rem",borderBottom:`1px solid ${CLUSTER[selected.cluster].hex}14`,background:`linear-gradient(135deg,${CLUSTER[selected.cluster].hex}08,transparent)`,flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.75rem"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.45rem",marginBottom:"0.3rem"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:CLUSTER[selected.cluster].hex,boxShadow:`0 0 9px ${CLUSTER[selected.cluster].hex}`,flexShrink:0}}/>
                    <span style={{fontSize:"0.58rem",color:CLUSTER[selected.cluster].hex,letterSpacing:"0.2em",textTransform:"uppercase"}}>
                      {CLUSTER[selected.cluster].label} · {TIERS[selected.tier]}
                    </span>
                  </div>
                  <h2 style={{fontFamily:"'Orbitron',monospace",fontSize:"1.05rem",color:"#fff",margin:0,letterSpacing:"0.05em",lineHeight:1.3}}>{selected.label}</h2>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.22)",cursor:"pointer",fontSize:"0.95rem",padding:0,lineHeight:1,flexShrink:0}}>✕</button>
              </div>
              <p style={{fontSize:"0.775rem",color:"rgba(255,255,255,0.45)",lineHeight:1.65,margin:"0.6rem 0 0",fontWeight:300}}>{selected.description}</p>
            </div>

            <div style={{padding:"0.875rem 1.375rem",borderBottom:"1px solid rgba(255,255,255,0.03)",flexShrink:0}}>
              {completed.has(selected.id)?(
                <div style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.6rem 0.875rem",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.22)",borderRadius:"0.475rem"}}>
                  <span style={{color:"#34d399",animation:"lc-glow 2s ease-in-out infinite"}}>✦</span>
                  <span style={{color:"#34d399",fontSize:"0.72rem",letterSpacing:"0.12em",fontWeight:700,fontFamily:"'Orbitron',monospace",flex:1}}>STAR CONQUERED</span>
                  <button onClick={()=>toggleDone(selected.id)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.2)",fontSize:"0.6rem",letterSpacing:"0.08em"}}>UNDO</button>
                </div>
              ):isUnlocked(selected.id)?(
                <button onClick={()=>toggleDone(selected.id)}
                  style={{width:"100%",padding:"0.7rem",background:`linear-gradient(135deg,${CLUSTER[selected.cluster].hex}12,${CLUSTER[selected.cluster].hex}05)`,border:`1px solid ${CLUSTER[selected.cluster].hex}35`,borderRadius:"0.475rem",color:CLUSTER[selected.cluster].hex,fontSize:"0.72rem",fontFamily:"inherit",cursor:"pointer",letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,transition:"all .2s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow=`0 0 20px ${CLUSTER[selected.cluster].hex}28`}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}>
                  ⚡ MARK AS COMPLETED
                </button>
              ):(
                <div style={{padding:"0.625rem 0.875rem",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"0.475rem"}}>
                  <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)",marginBottom:"0.45rem",letterSpacing:"0.12em"}}>🔒 PREREQUISITES REQUIRED</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem"}}>
                    {selected.prerequisites.map(pid=>{
                      const ps=STAR_MAP.get(pid); const isDone=completed.has(pid);
                      return(
                        <button key={pid} onClick={()=>{const s=STAR_MAP.get(pid);if(s)openStar(s);}}
                          style={{fontSize:"0.65rem",padding:"0.2rem 0.55rem",borderRadius:"999px",cursor:"pointer",border:`1px solid ${isDone?"rgba(52,211,153,0.5)":"rgba(255,255,255,0.1)"}`,color:isDone?"#34d399":"rgba(255,255,255,0.32)",background:isDone?"rgba(52,211,153,0.05)":"transparent",letterSpacing:"0.05em",transition:"all .15s",fontFamily:"inherit"}}>
                          {isDone?"✓ ":""}{ps?.label??pid}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{padding:"0.875rem 1.375rem",flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.875rem"}}>
                <span style={{fontSize:"0.57rem",color:"rgba(255,255,255,0.25)",letterSpacing:"0.2em",textTransform:"uppercase"}}>AI-CURATED ELITE RESOURCES</span>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}}/>
                {!loadingR&&resources&&<span style={{fontSize:"0.57rem",color:"rgba(0,200,255,0.38)",letterSpacing:"0.1em"}}>TOP {resources.length}</span>}
              </div>

              {loadingR&&(
                <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
                  {[1,2,3,4].map(i=><div key={i} style={{height:"68px",borderRadius:"0.475rem",background:"rgba(255,255,255,0.02)",animation:`lc-pulse 1.6s ease-in-out ${i*0.1}s infinite`}}/>)}
                </div>
              )}

              {!loadingR&&resources?.map((res,i)=>{
                const col=TYPE_COLOR[res.type]??"#888";
                return(
                  <motion.a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                    initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:i*0.06}}
                    style={{display:"block",textDecoration:"none",padding:"0.675rem 0.875rem",marginBottom:"0.4rem",background:"rgba(255,255,255,0.018)",border:`1px solid ${col}14`,borderRadius:"0.475rem",transition:"all .2s"}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background=`${col}09`;el.style.borderColor=`${col}38`;el.style.boxShadow=`0 0 14px ${col}14`;}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(255,255,255,0.018)";el.style.borderColor=`${col}14`;el.style.boxShadow="none";}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.45rem",marginBottom:"0.25rem"}}>
                      <span style={{fontSize:"0.6rem",color:col,background:`${col}12`,border:`1px solid ${col}25`,padding:"0.1rem 0.375rem",borderRadius:"999px",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{TYPE_ICON[res.type]} {res.type}</span>
                      <span style={{fontSize:"0.775rem",color:"#e8eeff",fontWeight:600,flex:1,lineHeight:1.3}}>{res.title}</span>
                    </div>
                    <p style={{fontSize:"0.695rem",color:"rgba(255,255,255,0.34)",margin:"0 0 0.15rem",lineHeight:1.55}}>{res.why}</p>
                    {res.author&&<p style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.18)",margin:0}}>by {res.author}</p>}
                  </motion.a>
                );
              })}

              {!loadingR&&resources&&resources.length===0&&(
                <div style={{textAlign:"center",padding:"2.5rem 0",color:"rgba(255,255,255,0.16)",fontSize:"0.78rem"}}>No resources found. Try again later.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AR MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {arModal&&(
          <motion.div data-ui initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"absolute",inset:0,background:"rgba(0,2,12,0.96)",backdropFilter:"blur(28px)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
            <motion.div initial={{scale:0.88,y:24,opacity:0}} animate={{scale:1,y:0,opacity:1}} transition={{type:"spring",stiffness:220,damping:28}}
              style={{maxWidth:"480px",width:"100%",background:"rgba(0,6,22,0.9)",border:"1px solid rgba(0,200,255,0.18)",borderRadius:"1.125rem",padding:"2.5rem",backdropFilter:"blur(16px)",textAlign:"center"}}>
              <div style={{fontSize:"3.5rem",marginBottom:"1.25rem",animation:"lc-spin 8s linear infinite",display:"inline-block"}}>⬡</div>
              <h2 style={{fontFamily:"'Orbitron',monospace",fontSize:"1rem",color:"#00d4ff",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"0.875rem"}}>AR Blueprint Mode</h2>
              <p style={{color:"rgba(255,255,255,0.42)",fontSize:"0.82rem",lineHeight:1.8,marginBottom:"1.125rem"}}>
                Project your constellation into your physical room via <strong style={{color:"rgba(255,255,255,0.72)"}}>WebXR</strong>. Spatial memory research shows experiencing your knowledge graph in 3D space improves long-term retention by <strong style={{color:"#00d4ff"}}>up to 40%</strong>.
              </p>
              <div style={{padding:"0.875rem 1rem",background:"rgba(0,200,255,0.03)",border:"1px solid rgba(0,200,255,0.14)",borderRadius:"0.625rem",marginBottom:"1.5rem"}}>
                <p style={{color:"rgba(0,200,255,0.58)",fontSize:"0.72rem",letterSpacing:"0.05em",lineHeight:1.7,margin:0}}>Requires Chrome on Android 10+ or Safari on iOS 16+.<br/>Open on mobile and point at a flat surface.</p>
              </div>
              <div style={{display:"flex",gap:"0.75rem",justifyContent:"center"}}>
                <button onClick={()=>alert("Open /learn-constellation on mobile to activate AR.")}
                  style={{padding:"0.7rem 1.625rem",background:"linear-gradient(135deg,rgba(0,20,50,0.9),rgba(0,30,70,0.9))",border:"1px solid rgba(0,200,255,0.38)",borderRadius:"0.475rem",color:"#00d4ff",fontSize:"0.72rem",fontFamily:"inherit",cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase"}}>
                  ⬡ Launch AR
                </button>
                <button onClick={()=>setArModal(false)}
                  style={{padding:"0.7rem 1.625rem",background:"transparent",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"0.475rem",color:"rgba(255,255,255,0.32)",fontSize:"0.72rem",fontFamily:"inherit",cursor:"pointer",letterSpacing:"0.12em",textTransform:"uppercase"}}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM BAR ─────────────────────────────────────── */}
      <div data-ui style={{position:"absolute",bottom:0,left:0,right:0,height:"42px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem",background:"linear-gradient(0deg,rgba(0,0,14,0.95) 0%,transparent 100%)",borderTop:"1px solid rgba(0,200,255,0.06)",zIndex:10}}>
        <span style={{fontSize:"0.57rem",color:"rgba(0,200,255,0.28)",letterSpacing:"0.18em",textTransform:"uppercase"}}>
          DRAG TO ORBIT · SCROLL TO ZOOM · CLICK ANY STAR TO EXPLORE
        </span>
        <div style={{display:"flex",alignItems:"center",gap:"1.25rem"}}>
          {selected&&<span style={{fontSize:"0.62rem",color:CLUSTER[selected.cluster].hex,letterSpacing:"0.1em"}}>✦ {selected.label.toUpperCase()}</span>}
          <span style={{fontSize:"0.55rem",color:"rgba(255,255,255,0.12)",letterSpacing:"0.1em"}}>TalentOS · v3.0 · {STARS.length} Stars · {EDGES.length} Paths</span>
        </div>
      </div>
    </div>
  );
}