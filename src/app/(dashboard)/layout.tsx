// PATH: src/app/(dashboard)/layout.tsx  — REPLACE entire file
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  GraduationCap, LayoutDashboard, CreditCard, PanelLeft,
  LogOut, User, ChevronDown, Settings, Mail,
  FileText, Linkedin, Wand2, Mic, Send,
  BookOpen, BrainCircuit, ChevronRight, Map, Cpu, Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ── Nav structure ───────────────────────────────────────────────────
// type: "link"  = standalone nav item
// type: "group" = collapsible accordion with children + chevron rotation

type NavLink = {
  type: "link";
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  type: "group";
  label: string;
  icon: React.ElementType;
  color: string;           // accent used for active border / left-bar
  children: { href: string; label: string; icon: React.ElementType }[];
};

type NavItem = NavLink | NavGroup;

const NAV: NavItem[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    type: "group",
    label: "Placement Prep",
    icon: BrainCircuit,
    color: "#2563EB",
    children: [
      { href: "/dashboard/resume-report",    label: "Resume Scoring",        icon: FileText  },
      { href: "/dashboard/linkedin-profile", label: "LinkedIn Optimization", icon: Linkedin  },
      { href: "/dashboard/project-rewrite",  label: "Project Rewriter",      icon: Wand2     },
      { href: "/dashboard/mock-interview",   label: "Mock Interview",        icon: Mic       },
      { href: "/dashboard/outreach",         label: "Outreach Generator",    icon: Send      },
    ],
  },
  {
    // Clicking "Smart Learn" toggles this accordion and rotates
    // the ChevronRight 90°. The only child is "Live Roadmap" which
    // navigates to /live-roadmap (outside the dashboard layout).
    type: "group",
    label: "Smart Learn",
    icon: BookOpen,
    color: "#0D9488",
    children: [
      { href: "/live-roadmap", label: "Live Roadmap", icon: Map },
      { href: "/ar-learning",   label: "AR Learning",   icon: Cpu },
    ],
  },
  {
    type: "link",
    href: "/dashboard/mentor",
    label: "Mentor",
    icon: Sparkles,
  },
  {
    type: "link",
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
  },
];

// Flat lookup for breadcrumb
const ALL_LINKS = NAV.flatMap((item) =>
  item.type === "link"
    ? [{ href: item.href, label: item.label }]
    : item.children.map((c) => ({ href: c.href, label: c.label }))
);

// ── Layout ──────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();

  const [collapsed,   setCollapsed]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // Auto-open a group if the current route lives inside it
  const initialOpen = NAV.reduce<Record<string, boolean>>((acc, item) => {
    if (item.type === "group") {
      acc[item.label] = item.children.some((c) => pathname.startsWith(c.href));
    }
    return acc;
  }, {});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  const profileRef = useRef<HTMLDivElement>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);

  const name     = session?.user?.name  ?? "User";
  const email    = session?.user?.email ?? "";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const currentLabel = ALL_LINKS.find((l) => pathname === l.href)?.label ?? "Dashboard";

  // Re-open the containing group whenever the route changes
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      NAV.forEach((item) => {
        if (item.type === "group" && item.children.some((c) => pathname.startsWith(c.href))) {
          next[item.label] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function handleSignOut() {
    setProfileOpen(false);
    await signOut({ redirect: false });
    window.location.href = "/";
  }

  // Toggle accordion — if sidebar is collapsed, expand it first
  function toggleGroup(label: string) {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [label]: true }));
    } else {
      setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>

      {/* ═══════ SIDEBAR ═══════ */}
      <aside style={{
        width: collapsed ? "72px" : "260px",
        minHeight: "100vh",
        backgroundColor: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s ease",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
      }}>

        {/* Logo */}
        <div style={{ padding: "0 1rem", height: "64px", display: "flex", alignItems: "center", gap: "0.625rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #2563EB, #0D9488)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={20} color="#fff" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              TalentOS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: "1rem 0.75rem", flex: 1 }}>
          {!collapsed && (
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem", paddingLeft: "0.875rem" }}>
              Main Menu
            </p>
          )}

          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV.map((item) => {

              // ── Standalone link ──────────────────────────────────
              if (item.type === "link") {
                return (
                  <li key={item.href}>
                    <NavLinkItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                      collapsed={collapsed}
                    />
                  </li>
                );
              }

              // ── Collapsible group ────────────────────────────────
              const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
              const isOpen        = openGroups[item.label] ?? false;
              const accentColor   = item.color;

              return (
                <li key={item.label}>

                  {/* ── Group header button ─────────────────────── */}
                  <button
                    onClick={() => toggleGroup(item.label)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "0.5rem",
                      width: "100%",
                      border: isGroupActive
                        ? `1px solid ${accentColor}22`
                        : "1px solid transparent",
                      background: isGroupActive && !isOpen
                        ? `${accentColor}10`
                        : "transparent",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: isGroupActive ? 600 : 500,
                      color: isGroupActive ? accentColor : "var(--text-secondary)",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      if (!isGroupActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = "var(--bg-secondary)";
                        el.style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isGroupActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = isGroupActive && !isOpen ? `${accentColor}10` : "transparent";
                        el.style.color = isGroupActive ? accentColor : "var(--text-secondary)";
                      }
                    }}
                  >
                    <item.icon size={18} style={{ flexShrink: 0 }} />

                    {!collapsed && (
                      <>
                        <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>

                        {/* ── Chevron — rotates 90° when dropdown is open ── */}
                        <ChevronRight
                          size={15}
                          style={{
                            flexShrink: 0,
                            opacity: 0.55,
                            transition: "transform 0.22s ease",
                            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          }}
                        />
                      </>
                    )}
                  </button>

                  {/* ── Expanded children (dropdown) ────────────── */}
                  {!collapsed && isOpen && (
                    <ul style={{
                      listStyle: "none",
                      marginTop: "3px",
                      marginLeft: "0.75rem",
                      paddingLeft: "1rem",
                      borderLeft: `2px solid ${accentColor}28`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                      paddingBottom: "4px",
                    }}>
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.625rem",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.375rem",
                                textDecoration: "none",
                                fontSize: "0.8375rem",
                                fontWeight: childActive ? 600 : 400,
                                color: childActive ? accentColor : "var(--text-secondary)",
                                backgroundColor: childActive ? `${accentColor}12` : "transparent",
                                transition: "all 0.12s",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                              }}
                              onMouseEnter={(e) => {
                                if (!childActive) {
                                  const el = e.currentTarget as HTMLElement;
                                  el.style.backgroundColor = "var(--bg-secondary)";
                                  el.style.color = "var(--text-primary)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!childActive) {
                                  const el = e.currentTarget as HTMLElement;
                                  el.style.backgroundColor = "transparent";
                                  el.style.color = "var(--text-secondary)";
                                }
                              }}
                            >
                              <child.icon size={15} style={{ flexShrink: 0 }} />
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* ── Collapsed: icon-only children with tooltips ─ */}
                  {collapsed && (
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              title={child.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                textDecoration: "none",
                                color: childActive ? accentColor : "var(--text-muted)",
                                backgroundColor: childActive ? `${accentColor}12` : "transparent",
                                transition: "all 0.12s",
                              }}
                              onMouseEnter={(e) => {
                                if (!childActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-secondary)";
                              }}
                              onMouseLeave={(e) => {
                                if (!childActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                              }}
                            >
                              <child.icon size={15} />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div style={{ padding: "0.875rem 0.75rem", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign out" : undefined}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 500, width: "100%", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "#FEF2F2"; el.style.color = "#DC2626"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "transparent"; el.style.color = "var(--text-muted)"; }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* ═══════ MAIN AREA ═══════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ height: "64px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", backgroundColor: "var(--bg-card)", position: "sticky", top: 0, zIndex: 20 }}>

          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", padding: "0.25rem", borderRadius: "0.375rem" }}
              title="Toggle sidebar"
            >
              <PanelLeft size={20} />
            </button>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Dashboard</span>
              {pathname !== "/dashboard" && (
                <>
                  <span style={{ color: "var(--border-strong)", fontSize: "0.875rem" }}>/</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 600 }}>
                    {currentLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Profile dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              ref={buttonRef}
              onClick={() => {
                if (!profileOpen && buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();
                  setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                }
                setProfileOpen(!profileOpen);
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.625rem", borderRadius: "0.625rem", border: "1px solid var(--border)", background: profileOpen ? "var(--bg-secondary)" : "var(--bg-card)", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (!profileOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-secondary)"; }}
              onMouseLeave={(e) => { if (!profileOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card)"; }}
            >
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #2563EB, #0D9488)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#fff", flexShrink: 0 }}>
                {initials}
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>

            {profileOpen && (
              <div style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right, width: "240px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0.875rem", boxShadow: "0 8px 32px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)", overflow: "hidden", zIndex: 9999 }}>
                <div style={{ padding: "1rem 1.125rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #2563EB, #0D9488)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "#fff", flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
                      <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0.5rem" }}>
                  <DropdownItem icon={<User size={15} />}     label="Profile"          onClick={() => { setProfileOpen(false); router.push("/dashboard"); }} />
                  <DropdownItem icon={<Mail size={15} />}     label="Account Settings" onClick={() => { setProfileOpen(false); router.push("/dashboard/billing"); }} />
                  <DropdownItem icon={<Settings size={15} />} label="Billing"          onClick={() => { setProfileOpen(false); router.push("/dashboard/billing"); }} />
                </div>

                <div style={{ padding: "0.5rem", borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={handleSignOut}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, color: "#DC2626", textAlign: "left", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FEF2F2"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "2rem 2.5rem", maxWidth: "1400px", width: "100%", minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Standalone nav link ──────────────────────────────────────────────
// For the Mentor item, GSAP animates a purple glow on hover.
// For all other items, plain CSS transitions are used (no GSAP dep in sidebar).
function NavLinkItem({ href, label, icon: Icon, isActive, collapsed }: {
  href: string; label: string; icon: React.ElementType; isActive: boolean; collapsed: boolean;
}) {
  const linkRef  = useRef<HTMLAnchorElement>(null);
  const isMentor = href === "/dashboard/mentor";

  // GSAP hover glow — only wired for the Mentor item
  useEffect(() => {
    if (!isMentor || !linkRef.current) return;
    const el = linkRef.current;

    // Dynamic import GSAP only when Mentor item mounts
    let ctx: any;
    import("gsap").then(({ default: gsap }) => {
      const enterHandler = () => {
        if (isActive) return;
        gsap.to(el, {
          boxShadow: "0 0 0 1px rgba(124,58,237,0.45), 0 0 18px rgba(124,58,237,0.22), 0 2px 8px rgba(0,0,0,0.15)",
          backgroundColor: "rgba(124,58,237,0.08)",
          color: "#a78bfa",
          duration: 0.28,
          ease: "power2.out",
        });
      };
      const leaveHandler = () => {
        if (isActive) return;
        gsap.to(el, {
          boxShadow: "none",
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          duration: 0.35,
          ease: "power2.out",
        });
      };

      el.addEventListener("mouseenter", enterHandler);
      el.addEventListener("mouseleave", leaveHandler);

      // Pulse glow when active
      if (isActive) {
        ctx = gsap.context(() => {
          gsap.fromTo(el,
            { boxShadow: "0 0 0 1px rgba(124,58,237,0.2), 0 0 0px rgba(124,58,237,0)" },
            { boxShadow: "0 0 0 1px rgba(124,58,237,0.5), 0 0 24px rgba(124,58,237,0.18)",
              duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" }
          );
        });
      }

      return () => {
        el.removeEventListener("mouseenter", enterHandler);
        el.removeEventListener("mouseleave", leaveHandler);
        ctx?.revert();
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMentor, isActive]);

  // Mentor-specific active state styling
  const mentorActiveStyle = isMentor && isActive ? {
    background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))",
    borderColor: "rgba(124,58,237,0.35)",
    color: "#a78bfa",
  } : {};

  return (
    <Link
      ref={linkRef}
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
        textDecoration: "none", fontSize: "0.9rem",
        fontWeight: isActive ? 600 : 500,
        color: isActive
          ? isMentor ? "#a78bfa" : "var(--primary)"
          : "var(--text-secondary)",
        backgroundColor: isActive && !isMentor ? "var(--primary-light)" : "transparent",
        border: isActive
          ? isMentor ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(37,99,235,0.15)"
          : "1px solid transparent",
        transition: isMentor ? "color 0.15s" : "all 0.15s",
        whiteSpace: "nowrap", overflow: "hidden",
        ...mentorActiveStyle,
      }}
      onMouseEnter={(e) => {
        if (isMentor) return; // GSAP handles Mentor hover
        if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "var(--bg-secondary)"; el.style.color = "var(--text-primary)"; }
      }}
      onMouseLeave={(e) => {
        if (isMentor) return;
        if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "transparent"; el.style.color = "var(--text-secondary)"; }
      }}
    >
      <Icon
        size={18}
        style={{
          flexShrink: 0,
          ...(isMentor && isActive ? { filter: "drop-shadow(0 0 6px rgba(168,85,247,0.7))" } : {}),
        }}
      />
      {!collapsed && (
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {label}
          {isMentor && !isActive && (
            <span style={{
              fontSize: "0.5rem", padding: "0.05rem 0.35rem", borderRadius: "999px",
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              color: "#fff", fontWeight: 700, letterSpacing: "0.06em",
              lineHeight: 1.6,
            }}>AI</span>
          )}
        </span>
      )}
    </Link>
  );
}

// ── Profile dropdown item ────────────────────────────────────────────
function DropdownItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", textAlign: "left", transition: "background 0.15s" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "var(--bg-secondary)"; el.style.color = "var(--text-primary)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "transparent"; el.style.color = "var(--text-secondary)"; }}
    >
      {icon}{label}
    </button>
  );
}