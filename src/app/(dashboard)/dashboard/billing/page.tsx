export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreditCard, Construction } from "lucide-react";

export default async function BillingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CreditCard size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.625rem", fontWeight: 800 }}>
              Billing
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Manage your subscription and payment methods
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "4rem 2rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <Construction size={48} color="var(--teal)" style={{ margin: "0 auto 1.5rem" }} />
        <h2
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "1.375rem",
            fontWeight: 700,
            marginBottom: "0.625rem",
          }}
        >
          Coming in Phase 6
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: "480px", margin: "0 auto" }}>
          Payment integration and subscription management coming soon.
        </p>
      </div>
    </div>
  );
}
