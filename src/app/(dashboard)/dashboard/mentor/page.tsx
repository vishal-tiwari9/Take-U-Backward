// PATH: src/app/(dashboard)/mentor/page.tsx  — CREATE
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentor · TalentOS",
  description: "Your personal AI career mentor — learning paths, placement war-room, time management & future prediction.",
};

const MentorApp = dynamic(
  () => import("@/components/mentor/MentorApp"),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem",
            animation: "spin 2s linear infinite", display: "inline-block", color: "#7c3aed" }}>
            ◈
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", letterSpacing: "0.2em",
            textTransform: "uppercase", fontFamily: "monospace" }}>
            Initialising ARIA…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function MentorPage() {
  return <MentorApp />;
}