// PATH: src/app/(dashboard)/dashboard/outreach/loading.tsx  (CREATE new file)
export default function OutreachLoading() {
  return (
    <div style={{ animation: "pulse 2s ease-in-out infinite" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.75rem" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "var(--border)" }} />
        <div>
          <div style={{ width: "240px", height: "22px", borderRadius: "6px", backgroundColor: "var(--border)", marginBottom: "6px" }} />
          <div style={{ width: "340px", height: "16px", borderRadius: "6px", backgroundColor: "var(--border)" }} />
        </div>
      </div>
      {/* Tabs */}
      <div style={{ width: "210px", height: "40px", borderRadius: "0.75rem", backgroundColor: "var(--border)", marginBottom: "1.75rem" }} />
      {/* Two-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[112, 100, 200, 230, 60].map((h, i) => (
            <div key={i} style={{ height: `${h}px`, borderRadius: "0.875rem", backgroundColor: "var(--border)" }} />
          ))}
        </div>
        <div style={{ height: "480px", borderRadius: "1rem", backgroundColor: "var(--border)" }} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </div>
  );
}