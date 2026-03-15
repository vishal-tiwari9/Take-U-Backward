// PATH: src/app/learn-constellation/page.tsx  — CREATE new file + folder
// This page is standalone (full-screen), outside the /dashboard layout.
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Constellations · TalentOS",
  description: "Explore your career roadmap as a living galaxy of skills.",
};

// Three.js accesses window/document — must be client-only
const ConstellationApp = dynamic(
  () => import("../../components/learn/ConstellationApp"),
  { ssr: false, loading: () => <GalaxyLoader /> }
);

export default function ConstellationPage() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#00000a" }}>
      <ConstellationApp />
    </main>
  );
}

function GalaxyLoader() {
  return (
    <div style={{
      width: "100vw", height: "100vh", backgroundColor: "#00000a",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1.25rem", animation: "lc-spin 3s linear infinite", color: "#00c8ff" }}>✦</div>
      <div style={{ fontSize: "0.7rem", color: "rgba(0,200,255,0.5)", letterSpacing: "0.3em", fontFamily: "monospace", textTransform: "uppercase" }}>
        Mapping the galaxy…
      </div>
      <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}