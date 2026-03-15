// PATH: src/app/ar-learning/page.tsx  — CREATE new file + folder
// Standalone full-screen page — no dashboard sidebar, no topbar.
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AR Learning · TalentOS",
  description: "Explore CS concepts in Augmented Reality with AI walkthroughs.",
};

const ARLearningApp = dynamic(
  () => import("@/components/ar/ARLearningApp"),
  {
    ssr: false,
    loading: () => (
      <div style={{ width:"100vw", height:"100vh", backgroundColor:"#020008",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:"2.5rem", marginBottom:"1rem", animation:"spin 3s linear infinite", color:"#7c3aed" }}>⬡</div>
        <div style={{ fontFamily:"monospace", fontSize:"0.7rem", color:"rgba(124,58,237,0.6)",
          letterSpacing:"0.3em", textTransform:"uppercase" }}>Initialising AR Engine…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function ARLearningPage() {
  return (
    <main style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#020008" }}>
      <ARLearningApp />
    </main>
  );
}