// PATH: src/app/(dashboard)/dashboard/page.tsx  — REPLACE entire file
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModuleGrid } from "@/components/ModuleCard";
import { getReadinessScore } from "@/lib/cache";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const firstName = session.user?.name?.split(" ")[0] ?? "there";
  const readiness = await getReadinessScore(session.user!.id!);

  const readinessColor =
    readiness.overall >= 70 ? "#0D9488" :
    readiness.overall >= 40 ? "#D97706" : "#64748B";

  const readinessLabel =
    readiness.overall >= 70 ? "On Track" :
    readiness.overall >= 40 ? "In Progress" : "Getting Started";

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.875rem", fontWeight: 800, marginBottom: "0.375rem", color: "var(--text-primary)" }}>
          Welcome back, {firstName}! 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Your placement readiness dashboard
        </p>
      </div>

      {/* Readiness banner */}
      <div style={{
        padding: "1.75rem 2rem", borderRadius: "1rem",
        border: "1px solid var(--border)", backgroundColor: "var(--bg-card)",
        marginBottom: "2rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
      }}>
        <div>
          <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.375rem", color: "var(--text-primary)" }}>
            Overall Placement Readiness
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
            Based on your activity across all modules
          </p>

          <div style={{ width: "280px", maxWidth: "100%" }}>
            <div style={{ height: "8px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.375rem" }}>
              <div style={{
                height: "100%",
                width: `${readiness.overall}%`,
                background: readiness.overall >= 70
                  ? "linear-gradient(90deg, #2563EB, #0D9488)"
                  : readiness.overall >= 40
                  ? "linear-gradient(90deg, #D97706, #F59E0B)"
                  : "var(--border-strong)",
                borderRadius: "4px",
                transition: "width 0.6s ease",
              }} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { label: "Resume",     done: readiness.hasResume },
                { label: "LinkedIn",   done: readiness.hasLinkedIn },
                { label: "Projects",   done: readiness.projectCount > 0 },
                { label: "Interviews", done: readiness.interviewCount > 0 },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  fontSize: "0.75rem",
                  color: item.done ? "#0D9488" : "var(--text-muted)",
                  fontWeight: item.done ? 600 : 400,
                }}>
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    backgroundColor: item.done ? "#0D9488" : "var(--border-strong)",
                  }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: "3rem", fontWeight: 800, color: readinessColor, lineHeight: 1, marginBottom: "0.5rem" }}>
            {readiness.overall}%
          </div>
          <span style={{
            display: "inline-block", padding: "0.3rem 0.875rem", borderRadius: "999px",
            backgroundColor: readiness.overall >= 70 ? "rgba(13,148,136,0.08)" : readiness.overall >= 40 ? "#FFFBEB" : "var(--bg-secondary)",
            color: readinessColor,
            border: `1px solid ${readiness.overall >= 70 ? "rgba(13,148,136,0.2)" : readiness.overall >= 40 ? "#FDE68A" : "var(--border)"}`,
            fontSize: "0.8125rem", fontWeight: 700, fontFamily: "Sora, sans-serif",
          }}>
            {readinessLabel}
          </span>
        </div>
      </div>

      {/* Module grid — client component, owns its own icons */}
      <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
        Modules
      </h2>
      <ModuleGrid />

      {/* Recent activity */}
      <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
        Recent Activity
      </h2>
      <div style={{ padding: "2.5rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "center", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
          {readiness.projectCount + readiness.interviewCount > 0
            ? `You have ${readiness.projectCount} project rewrite(s) and ${readiness.interviewCount} mock interview(s). Keep going!`
            : "No activity yet. Start with one of the modules above!"}
        </p>
      </div>
    </div>
  );
}