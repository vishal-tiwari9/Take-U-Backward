// PATH: src/components/ar/ARLearningApp.tsx  — REPLACE
// Clean orchestrator. All 3D logic lives in DynamicNode / Synapse.
// All timing logic lives in TimelineController (GSAP).
// This file owns: Three.js bootstrap, camera orbit, UI state, scrub bar.
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { createTimelineController } from "./TimelineController";
import { breatheNode } from "./DynamicNode";
import type { ARTopic, NodeRecord, SynapseRecord, PlaybackControls } from "./ar-types";
import type { PulseHandle } from "./TimelineController";

// ─── Constants ───────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  Beginner: "#34d399", Intermediate: "#fbbf24", Advanced: "#f87171",
};
const SPEED_CYCLE = [0.5, 1, 1.5, 2] as const;

// ─── Component ───────────────────────────────────────────────────────
export default function ARLearningApp() {
  // Three.js refs
  const mountRef    = useRef<HTMLDivElement>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef      = useRef<number>(0);
  const groupRef    = useRef<THREE.Group | null>(null);
  const clockRef    = useRef<THREE.Clock>(new THREE.Clock(false));

  // Engine refs — never trigger re-renders
  const nodesRef    = useRef<Map<string, NodeRecord>>(new Map());
  const synapsesRef = useRef<Map<string, SynapseRecord>>(new Map());
  const pulsesRef   = useRef<PulseHandle[]>([]);
  const tlRef       = useRef<PlaybackControls | null>(null);

  // UI state
  const [topics,      setTopics]     = useState<ARTopic[]>([]);
  const [selected,    setSelected]   = useState<ARTopic | null>(null);
  const [phase,       setPhase]      = useState<"grid" | "scene">("grid");
  const [activeTag,   setActiveTag]  = useState<string | null>(null);
  const [hoveredId,   setHoveredId]  = useState<string | null>(null);
  const [whisper,     setWhisper]    = useState<string | null>(null);
  const [loadingW,    setLoadingW]   = useState(false);
  const [playing,     setPlaying]    = useState(false);
  const [playhead,    setPlayhead]   = useState(0);
  const [speed,       setSpeed]      = useState(1);
  const [totalDur,    setTotalDur]   = useState(16);
  const [manifest,    setManifest]   = useState<any[]>([]);
  const [arSupported, setArSupported]= useState(false);
  const [loadingAR,   setLoadingAR]  = useState(false);

  // Stable ref so TimelineController callback never stale-closes
  const setTagRef = useRef(setActiveTag);
  setTagRef.current = setActiveTag;

  // Load topics
  useEffect(() => {
    fetch("/api/ar/topics")
      .then((r) => r.json())
      .then((d) => setTopics(d.topics ?? []))
      .catch(() => {});
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar")
        .then(setArSupported).catch(() => {});
    }
  }, []);

  // AI whisper on node hover
  const fetchWhisper = useCallback(async (nodeLabel: string) => {
    if (!selected) return;
    setLoadingW(true); setWhisper(null);
    try {
      const r = await fetch("/api/ar/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle: selected.title, nodeName: nodeLabel, category: selected.category }),
      });
      setWhisper((await r.json()).tip ?? null);
    } catch { setWhisper(null); }
    setLoadingW(false);
  }, [selected]);

  useEffect(() => {
    if (!hoveredId) { setWhisper(null); return; }
    const t = setTimeout(() => fetchWhisper(hoveredId), 500);
    return () => clearTimeout(t);
  }, [hoveredId, fetchWhisper]);

  // Three.js bootstrap — runs once when entering scene phase
  useEffect(() => {
    if (!mountRef.current || phase !== "scene" || !selected) return;
    const W = window.innerWidth, H = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020008);
    scene.fog = new THREE.FogExp2(0x020008, 0.038);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 0.5, 7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0x080018, 4));
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 30);
    sunLight.position.set(3, 4, 6);
    scene.add(sunLight);
    const accentLight = new THREE.PointLight(selected.accentHex, 2, 22);
    accentLight.position.set(-4, -1, 2);
    scene.add(accentLight);

    // Background star-field
    const bgArr = new Float32Array(2400 * 3);
    for (let i = 0; i < bgArr.length; i++) bgArr[i] = (Math.random() - 0.5) * 80;
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgArr, 3));
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      color: 0x4a1a88, size: 0.045, transparent: true, opacity: 0.45,
    })));

    // Accent ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.014, 8, 90),
      new THREE.MeshBasicMaterial({ color: selected.accentHex, transparent: true, opacity: 0.12 })
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Topic group — DynamicNodes and Synapses attach here
    const group = new THREE.Group();
    group.userData.isTopic = true;
    scene.add(group);
    groupRef.current = group;

    // Reset registries for fresh scene
    nodesRef.current    = new Map();
    synapsesRef.current = new Map();
    pulsesRef.current   = [];

    // Fetch manifest then wire TimelineController
    async function initTimeline() {
      let events: any[] = [];
      let dur = 16;
      try {
        const r = await fetch(`/api/ar/manifest?id=${selected!.id}`);
        if (r.ok) { const d = await r.json(); events = d.events ?? []; dur = d.totalDuration ?? 16; }
      } catch { /* empty manifest */ }

      setManifest(events);
      setTotalDur(dur);

      const controller = createTimelineController({
        scene,
        group,
        topic:         selected!,
        events,
        totalDuration: dur,
        nodesRef,
        synapsesRef,
        pulsesRef,
        onTagChange: (tag) => setTagRef.current(tag),
        onProgress:  (pct) => setPlayhead(pct),
      });
      tlRef.current = controller;
    }
    initTimeline();

    // Orbit controls
    const sph = { theta: 0.2, phi: Math.PI / 2.6, r: 7 };
    let drag = false, px = 0, py = 0;
    function updateCamera() {
      camera.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi),
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
      );
      camera.lookAt(0, 0, 0);
    }
    const onDown  = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("[data-ui]")) return; drag = true; px = e.clientX; py = e.clientY; };
    const onMove  = (e: MouseEvent) => {
      if (!drag) return;
      sph.theta -= (e.clientX - px) * 0.007;
      sph.phi    = Math.max(0.3, Math.min(Math.PI - 0.3, sph.phi + (e.clientY - py) * 0.007));
      px = e.clientX; py = e.clientY; updateCamera();
    };
    const onUp    = () => { drag = false; };
    const onWheel = (e: WheelEvent) => { sph.r = Math.max(2.5, Math.min(16, sph.r + e.deltaY * 0.01)); updateCamera(); };

    // Raycaster for hover
    const mouse = new THREE.Vector2();
    const ray   = new THREE.Raycaster();
    const onHover = (e: MouseEvent) => {
      mouse.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      const meshes = [...nodesRef.current.values()].map((r) => r.mesh);
      const hits = ray.intersectObjects(meshes);
      setHoveredId(hits.length > 0 ? (hits[0].object.userData.label as string ?? null) : null);
    };

    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousemove", onHover);
    window.addEventListener("mouseup",   onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", onResize);
    clockRef.current.start();

    // Render loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();
      nodesRef.current.forEach((rec) => breatheNode(rec, t));
      pulsesRef.current = pulsesRef.current.filter((p) => !p.update(performance.now()));
      if (group && !playing) group.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      clockRef.current.stop();
      cancelAnimationFrame(rafRef.current);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", onHover);
      window.removeEventListener("mouseup",   onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      tlRef.current?.reset();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selected]);

  // Playback controls
  const togglePlay = useCallback(() => {
    if (!tlRef.current) return;
    if (playhead >= 0.99) { tlRef.current.reset(); setTimeout(() => { tlRef.current?.play(); setPlaying(true); }, 30); }
    else if (playing) { tlRef.current.pause(); setPlaying(false); }
    else { tlRef.current.play(); setPlaying(true); }
  }, [playing, playhead]);

  const rewind   = useCallback(() => tlRef.current?.seek(Math.max(0, playhead * totalDur - 3)), [playhead, totalDur]);
  const forward  = useCallback(() => tlRef.current?.seek(Math.min(totalDur, playhead * totalDur + 3)), [playhead, totalDur]);
  const cycleSpd = useCallback(() => {
    const next = SPEED_CYCLE[(SPEED_CYCLE.indexOf(speed as any) + 1) % SPEED_CYCLE.length];
    setSpeed(next); tlRef.current?.setSpeed(next);
  }, [speed]);
  const seekTo = useCallback((pct: number) => { tlRef.current?.seek(pct * totalDur); setPlayhead(pct); }, [totalDur]);

  const launchAR = useCallback(async () => {
    setLoadingAR(true);
    try {
      if (!navigator.xr) throw new Error("No WebXR");
      await (navigator.xr as any).requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"], optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body },
      });
    } catch { alert("AR requires Chrome on Android 10+ or Safari on iOS 16+."); }
    setLoadingAR(false);
  }, []);

  const fmtTime   = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const tagEvents = manifest.filter((ev: any) => ev.tag);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", backgroundColor: "#020008", fontFamily: "'Rajdhani','Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes ar-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ar-spin  { to{transform:rotate(360deg)} }
        @keyframes ar-pulse { 0%,100%{opacity:.2} 50%{opacity:.8} }
        * { box-sizing: border-box; }
        input[type=range] { appearance:none; outline:none; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { appearance:none; width:15px; height:15px; border-radius:50%; border:2px solid #fff; cursor:pointer; }
        input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:2px; }
      `}</style>

      {/* ══ GRID PHASE ════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === "grid" && (
          <motion.div key="grid" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0, scale:0.97 }}
            style={{ position:"absolute", inset:0, overflowY:"auto", paddingBottom:"4rem" }}>

            <div style={{ position:"sticky", top:0, zIndex:10,
              background:"linear-gradient(180deg,rgba(2,0,8,0.97) 0%,transparent 100%)",
              padding:"1rem 1.5rem", borderBottom:"1px solid rgba(124,58,237,0.14)",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
                <a href="/dashboard" style={{ textDecoration:"none", color:"rgba(167,139,250,0.5)", fontSize:"0.65rem",
                  fontFamily:"'Orbitron',monospace", letterSpacing:"0.18em", transition:"color .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="#a78bfa"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(167,139,250,0.5)"}>← DASHBOARD</a>
                <div style={{ width:1, height:20, background:"rgba(124,58,237,0.2)" }}/>
                <div>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"0.9rem", fontWeight:700, color:"#a78bfa", letterSpacing:"0.1em" }}>AR LEARNING ENGINE</div>
                  <div style={{ fontSize:"0.55rem", color:"rgba(167,139,250,0.38)", letterSpacing:"0.2em", textTransform:"uppercase" }}>
                    GSAP-Synced · Billboard Labels · Dynamic Spawner · {topics.length} Experiences
                  </div>
                </div>
              </div>
              <ARStatusPill supported={arSupported} />
            </div>

            <div style={{ padding:"2rem 1.5rem 1.25rem" }}>
              <h1 style={{ fontFamily:"'Orbitron',monospace", fontSize:"1.5rem", fontWeight:900, color:"#fff", margin:"0 0 0.4rem" }}>
                Choose Your{" "}
                <span style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Build Sequence</span>
              </h1>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.85rem", margin:0, fontWeight:300 }}>
                Each experience assembles itself node-by-node, synapse-by-synapse — driven by a GSAP timeline reading a JSON manifest.
              </p>
            </div>

            {topics.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem", color:"rgba(255,255,255,0.2)" }}>Loading experiences…</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:"1.125rem", padding:"0 1.5rem" }}>
                {topics.map(t => (
                  <TopicCard key={t.id} topic={t} onClick={() => { setSelected(t); setPlayhead(0); setPlaying(false); setPhase("scene"); }} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SCENE PHASE ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === "scene" && selected && (
          <motion.div key="scene" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"absolute", inset:0 }}>

            <div ref={mountRef} style={{ position:"absolute", inset:0, cursor: playing ? "default" : "grab" }}/>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1,
              backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }}/>

            {/* TOP HUD */}
            <div data-ui style={{ position:"absolute", top:0, left:0, right:0, height:60,
              display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.25rem",
              background:"linear-gradient(180deg,rgba(2,0,8,0.96) 0%,transparent 100%)",
              borderBottom:`1px solid ${selected.accentHex}1e`, zIndex:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <button onClick={() => { tlRef.current?.reset(); setPhase("grid"); setPlaying(false); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(167,139,250,0.5)",
                    fontSize:"0.65rem", fontFamily:"'Orbitron',monospace", letterSpacing:"0.18em", transition:"color .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color=selected.accentHex}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(167,139,250,0.5)"}>← BACK</button>
                <div style={{ width:1, height:20, background:`${selected.accentHex}30` }}/>
                <span style={{ fontSize:"0.65rem", color:selected.accentHex, fontFamily:"'Orbitron',monospace", letterSpacing:"0.12em", fontWeight:700 }}>{selected.category.toUpperCase()}</span>
                <span style={{ fontSize:"1rem", fontWeight:700, color:"#fff" }}>{selected.emoji} {selected.title}</span>
              </div>
              <div style={{ display:"flex", gap:"0.625rem", alignItems:"center" }}>
                <span style={{ fontSize:"0.58rem", color:`${selected.accentHex}88`, letterSpacing:"0.1em",
                  border:`1px solid ${selected.accentHex}22`, padding:"0.2rem 0.6rem", borderRadius:"999px" }}>
                  GSAP · BILLBOARD · DYNAMIC SPAWNER
                </span>
                <button onClick={launchAR} disabled={loadingAR}
                  style={{ padding:"0.42rem 0.875rem", borderRadius:"0.4rem",
                    background:`linear-gradient(135deg,${selected.accentHex}cc,${selected.accentHex}77)`,
                    border:"none", color:"#fff", fontSize:"0.68rem", fontFamily:"inherit",
                    cursor:"pointer", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700,
                    opacity:loadingAR?0.6:1, display:"flex", alignItems:"center", gap:"0.4rem" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter="brightness(1.25)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter="brightness(1)"}>
                  {loadingAR ? <span style={{ animation:"ar-spin 1s linear infinite", display:"inline-block" }}>⬡</span> : "⬡"} VIEW IN ROOM
                </button>
              </div>
            </div>

            {/* FLOATING TAG */}
            <AnimatePresence>
              {activeTag && (
                <motion.div key={activeTag}
                  initial={{ opacity:0, y:-10, scale:0.94 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8 }}
                  transition={{ type:"spring", stiffness:340, damping:30 }}
                  style={{ position:"absolute", top:70, left:"50%", transform:"translateX(-50%)",
                    background:"rgba(2,0,8,0.9)", backdropFilter:"blur(22px)",
                    border:`1px solid ${selected.accentHex}45`, borderRadius:"0.625rem",
                    padding:"0.55rem 1.25rem", zIndex:10, pointerEvents:"none",
                    boxShadow:`0 0 28px ${selected.accentHex}22` }}>
                  <p style={{ margin:0, fontSize:"0.84rem", color:"#fff", fontWeight:600, letterSpacing:"0.04em",
                    textShadow:`0 0 14px ${selected.accentHex}` }}>{activeTag}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NODE WHISPER */}
            <AnimatePresence>
              {hoveredId && (
                <motion.div data-ui initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
                  style={{ position:"absolute", right:"1.5rem", bottom:"8rem", maxWidth:280, zIndex:10,
                    background:"rgba(2,0,8,0.92)", backdropFilter:"blur(24px)",
                    border:`1px solid ${selected.accentHex}30`, borderRadius:"0.75rem", padding:"0.875rem 1rem" }}>
                  <div style={{ fontSize:"0.58rem", color:selected.accentHex, letterSpacing:"0.18em",
                    textTransform:"uppercase", marginBottom:"0.35rem", fontFamily:"'Orbitron',monospace" }}>🔍 {hoveredId}</div>
                  {loadingW ? <div style={{ height:14, borderRadius:4, background:"rgba(255,255,255,0.06)", animation:"ar-pulse 1.4s ease infinite" }}/>
                    : whisper ? <p style={{ margin:0, fontSize:"0.78rem", color:"rgba(255,255,255,0.72)", lineHeight:1.65 }}>{whisper}</p>
                    : <p style={{ margin:0, fontSize:"0.72rem", color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Fetching tip…</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* NODE LIST */}
            <div data-ui style={{ position:"absolute", left:"1.25rem", top:72,
              background:"rgba(2,0,8,0.82)", backdropFilter:"blur(18px)",
              border:`1px solid ${selected.accentHex}18`, borderRadius:"0.75rem",
              padding:"0.75rem 0.875rem", zIndex:10, maxWidth:180 }}>
              <div style={{ fontSize:"0.55rem", color:"rgba(255,255,255,0.18)", letterSpacing:"0.18em",
                textTransform:"uppercase", marginBottom:"0.5rem" }}>Registered Nodes</div>
              {selected.nodes.map(n => (
                <div key={n} style={{ display:"flex", alignItems:"center", gap:"0.45rem", marginBottom:"0.28rem" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", flexShrink:0, transition:"all .2s",
                    background: hoveredId===n ? selected.accentHex:"rgba(255,255,255,0.18)",
                    boxShadow:  hoveredId===n ? `0 0 8px ${selected.accentHex}`:"none" }}/>
                  <span style={{ fontSize:"0.7rem", letterSpacing:"0.04em", transition:"color .2s",
                    color: hoveredId===n ? selected.accentHex:"rgba(255,255,255,0.42)" }}>{n}</span>
                </div>
              ))}
            </div>

            {/* ══ SCRUB BAR ════════════════════════════════════════ */}
            <div data-ui style={{ position:"absolute", bottom:"1.125rem", left:"50%", transform:"translateX(-50%)",
              width:"min(700px,93vw)", zIndex:15,
              background:"rgba(2,0,8,0.93)", backdropFilter:"blur(30px)",
              border:`1px solid ${selected.accentHex}28`, borderRadius:"1.125rem",
              padding:"0.9rem 1.25rem",
              boxShadow:`0 8px 48px rgba(0,0,0,0.65), 0 0 0 1px ${selected.accentHex}0c` }}>

              {/* Event markers */}
              <div style={{ position:"relative", height:22, marginBottom:"0.3rem" }}>
                {tagEvents.map((ev: any, i: number) => {
                  const pct  = (ev.t / totalDur) * 100;
                  const past = playhead * totalDur >= ev.t;
                  return (
                    <button key={i} onClick={() => seekTo(ev.t / totalDur)} title={ev.tag}
                      style={{ position:"absolute", left:`${pct}%`, transform:"translateX(-50%)",
                        display:"flex", flexDirection:"column", alignItems:"center",
                        background:"none", border:"none", cursor:"pointer", padding:0,
                        opacity:past?1:0.3, transition:"opacity .3s" }}>
                      <div style={{ width:2, height:9, background:selected.accentHex, boxShadow:past?`0 0 6px ${selected.accentHex}`:"none" }}/>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:selected.accentHex, marginTop:1 }}/>
                    </button>
                  );
                })}
              </div>

              {/* Track */}
              <div style={{ position:"relative", marginBottom:"0.7rem" }}>
                <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", height:4,
                  width:`${playhead*100}%`, borderRadius:2, pointerEvents:"none",
                  background:`linear-gradient(90deg,${selected.accentHex}77,${selected.accentHex})`,
                  boxShadow:`0 0 10px ${selected.accentHex}55` }}/>
                <input type="range" min={0} max={1000} value={Math.round(playhead*1000)}
                  onChange={e => seekTo(parseInt(e.target.value)/1000)}
                  style={{ width:"100%", background:"rgba(255,255,255,0.08)", height:4, borderRadius:2, accentColor:selected.accentHex } as React.CSSProperties}/>
              </div>

              {/* Controls */}
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <CtrlBtn onClick={rewind}  title="−3s" accent={selected.accentHex}>⏮</CtrlBtn>
                <button onClick={togglePlay}
                  style={{ width:44, height:44, borderRadius:"50%", border:"none",
                    background:`linear-gradient(135deg,${selected.accentHex},${selected.accentHex}88)`,
                    color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center", flexShrink:0,
                    boxShadow:playing?`0 0 20px ${selected.accentHex}88`:"none", transition:"all .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter="brightness(1.2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter="brightness(1)"}>
                  {playing ? "⏸" : playhead >= 0.99 ? "↺" : "▶"}
                </button>
                <CtrlBtn onClick={forward} title="+3s" accent={selected.accentHex}>⏭</CtrlBtn>
                <span style={{ fontFamily:"'Orbitron',monospace", fontSize:"0.68rem",
                  color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", flexShrink:0 }}>
                  {fmtTime(playhead*totalDur)} / {fmtTime(totalDur)}
                </span>
                <div style={{ flex:1 }}/>
                <button onClick={cycleSpd}
                  style={{ padding:"0.3rem 0.7rem", borderRadius:"0.4rem",
                    border:`1px solid ${selected.accentHex}40`, background:`${selected.accentHex}12`,
                    color:selected.accentHex, fontSize:"0.68rem", fontFamily:"inherit",
                    cursor:"pointer", letterSpacing:"0.1em", fontWeight:700, flexShrink:0 }}>
                  {speed}×
                </button>
                <span style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.2)", flexShrink:0 }}>
                  {tagEvents.length} checkpoints
                </span>
              </div>

              {/* Chapter pills */}
              <div style={{ marginTop:"0.625rem", display:"flex", gap:"0.35rem", overflowX:"auto",
                paddingBottom:2, scrollbarWidth:"none" }}>
                {tagEvents.map((ev: any, i: number) => {
                  const past = playhead * totalDur >= ev.t;
                  return (
                    <button key={i} onClick={() => seekTo(ev.t / totalDur)}
                      style={{ flexShrink:0, fontSize:"0.58rem", padding:"0.18rem 0.55rem",
                        borderRadius:"999px", cursor:"pointer", whiteSpace:"nowrap",
                        border:`1px solid ${past ? selected.accentHex+"55":"rgba(255,255,255,0.08)"}`,
                        background: past ? `${selected.accentHex}14`:"transparent",
                        color: past ? selected.accentHex:"rgba(255,255,255,0.25)",
                        letterSpacing:"0.04em", transition:"all .25s" }}>
                      {ev.tag.length > 30 ? ev.tag.slice(0, 28) + "…" : ev.tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UI atoms ─────────────────────────────────────────────────────────
function CtrlBtn({ onClick, title, accent, children }: { onClick:()=>void; title:string; accent:string; children:React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width:34, height:34, borderRadius:"50%", border:`1px solid ${accent}35`,
        background:`${accent}0e`, color:"rgba(255,255,255,0.6)", fontSize:"0.9rem",
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, transition:"all .18s" }}
      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement; el.style.background=`${accent}22`; el.style.color="#fff";}}
      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement; el.style.background=`${accent}0e`; el.style.color="rgba(255,255,255,0.6)";}}>
      {children}
    </button>
  );
}

function ARStatusPill({ supported }: { supported: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.35rem 0.875rem",
      borderRadius:"999px", border:"1px solid rgba(124,58,237,0.25)", background:"rgba(124,58,237,0.06)" }}>
      <div style={{ width:7, height:7, borderRadius:"50%",
        background: supported?"#34d399":"#f87171", boxShadow:`0 0 7px ${supported?"#34d399":"#f87171"}` }}/>
      <span style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em" }}>
        {supported ? "WebXR READY" : "AR: MOBILE REQUIRED"}
      </span>
    </div>
  );
}

function TopicCard({ topic, onClick }: { topic: ARTopic; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx:0, ry:0 });
  const [hov,  setHov]  = useState(false);
  function onMM(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const r  = el.getBoundingClientRect();
    setTilt({ rx:((e.clientY-r.top)/r.height-0.5)*-16, ry:((e.clientX-r.left)/r.width-0.5)*16 });
  }
  return (
    <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", stiffness:220, damping:24 }}
      onMouseMove={onMM} onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{ setTilt({rx:0,ry:0}); setHov(false); }} onClick={onClick}
      style={{ background:hov?`linear-gradient(135deg,${topic.accentHex}16,rgba(2,0,8,.92))`:"rgba(10,4,28,.85)",
        border:`1px solid ${hov?topic.accentHex+"44":"rgba(255,255,255,.06)"}`,
        borderRadius:"1rem", padding:"1.375rem", cursor:"pointer", backdropFilter:"blur(18px)",
        transform:`perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hov?1.03:1})`,
        transition:hov?"transform .1s,border-color .2s,background .2s":"transform .4s,border-color .2s,background .2s",
        boxShadow:hov?`0 12px 40px ${topic.accentHex}22`:"none", userSelect:"none" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.875rem" }}>
        <div style={{ fontSize:"2.2rem", lineHeight:1, animation:hov?"ar-float 2s ease-in-out infinite":"none" }}>{topic.emoji}</div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.3rem" }}>
          <span style={{ fontSize:"0.58rem", color:topic.accentHex, background:`${topic.accentHex}14`,
            border:`1px solid ${topic.accentHex}30`, padding:"0.15rem 0.5rem", borderRadius:"999px", letterSpacing:"0.1em", fontWeight:700 }}>
            {topic.category}</span>
          <span style={{ fontSize:"0.56rem", color:DIFF_COLOR[topic.difficulty]??"#aaa", letterSpacing:"0.08em", fontWeight:600 }}>{topic.difficulty}</span>
        </div>
      </div>
      <h3 style={{ fontFamily:"'Orbitron',monospace", fontSize:"0.9rem", fontWeight:700, color:"#fff",
        margin:"0 0 0.4rem", letterSpacing:"0.04em", lineHeight:1.3 }}>{topic.title}</h3>
      <p style={{ fontSize:"0.775rem", color:"rgba(255,255,255,.38)", lineHeight:1.6, margin:"0 0 0.875rem", fontWeight:300 }}>{topic.description}</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.3rem", marginBottom:"0.875rem" }}>
        {topic.nodes.slice(0,4).map(n => (
          <span key={n} style={{ fontSize:"0.6rem", color:"rgba(255,255,255,.3)",
            border:"1px solid rgba(255,255,255,.08)", borderRadius:"999px", padding:"0.1rem 0.45rem" }}>{n}</span>
        ))}
        {topic.nodes.length>4 && <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,.18)", padding:"0.1rem 0.3rem" }}>+{topic.nodes.length-4}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
        <div style={{ flex:1, height:1, background:`${topic.accentHex}20` }}/>
        <span style={{ fontSize:"0.65rem", letterSpacing:"0.14em", fontWeight:700, textTransform:"uppercase",
          color:hov?topic.accentHex:"rgba(255,255,255,.22)", transition:"color .2s" }}>
          {hov?"BUILD →":"ENTER SEQUENCE"}
        </span>
      </div>
    </motion.div>
  );
}