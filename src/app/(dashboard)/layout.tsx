"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, impersonateRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        // Enforce role-based path access
        const allowedPaths: Record<string, string[]> = {
          admin: ["/", "/products", "/inventory", "/reports", "/pos"],
          manager: ["/", "/inventory", "/pos"],
          cashier: ["/pos"],
        };

        const userAllowedPaths = allowedPaths[user.role] || [];
        if (!userAllowedPaths.includes(pathname)) {
          const defaultPath = user.role === "cashier" ? "/pos" : "/";
          router.push(defaultPath);
        }
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text-secondary)",
          fontFamily: "'Inter', sans-serif",
          transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "1px solid var(--border)",
              borderTop: "1px solid var(--text-primary)",
              borderRadius: "50%",
              animation: "spin 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
              margin: "0 auto 24px auto",
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--text-secondary)",
            }}
          >
            Verifying Session
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter menu items by user role
  const menuItems = [
    { name: "Dashboard", href: "/", allowedRoles: ["admin", "manager"] },
    { name: "Products", href: "/products", allowedRoles: ["admin"] },
    { name: "Inventory", href: "/inventory", allowedRoles: ["admin", "manager"] },
    { name: "Reports", href: "/reports", allowedRoles: ["admin"] },
    { name: "Checkout", href: "/pos", allowedRoles: ["admin", "manager", "cashier"] },
  ].filter((item) => item.allowedRoles.includes(user.role));

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "'Inter', sans-serif",
        transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .desktop-sidebar {
            position: fixed !important;
            left: ${isMobileMenuOpen ? "0" : "-280px"} !important;
            top: 0 !important;
            bottom: 0 !important;
            z-index: 2000 !important;
            box-shadow: ${isMobileMenuOpen ? "0 24px 64px rgba(0,0,0,0.15)" : "none"} !important;
          }
          .mobile-top-bar {
            display: flex !important;
          }
          .main-content {
            padding: 96px 24px 48px 24px !important;
          }
        }
      `}</style>

      {/* Mobile Top Navigation Header */}
      <div
        className="mobile-top-bar"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 1000,
          transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Logo size={24} direction="row" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "24px",
            color: "var(--text-primary)",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(4px)",
            zIndex: 1999,
          }}
        />
      )}

      {/* Sidebar aside panel */}
      <aside
        className="desktop-sidebar"
        style={{
          width: "280px",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "48px 32px 32px 32px",
          position: "sticky",
          top: 0,
          height: "100vh",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ marginBottom: "48px" }}>
          <Logo size={32} />
          <div style={{ marginTop: "12px" }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              Role: {user.role}
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, margin: "0 -32px" }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "10px 32px",
                  textDecoration: "none",
                  fontSize: "11px",
                  fontWeight: isActive ? 600 : 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  borderLeft: isActive ? "3px solid var(--text-primary)" : "3px solid transparent",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)" }}>
              Theme
            </span>
            <ThemeToggle />
          </div>

          {/* Role Impersonation Switcher */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>
              Simulate Role
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {["admin", "manager", "cashier"].map((r) => {
                const isCurrent = user.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => impersonateRole(r)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      background: isCurrent ? "var(--text-primary)" : "transparent",
                      color: isCurrent ? "var(--bg)" : "var(--text-primary)",
                      border: "1px solid var(--border)",
                      fontSize: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "0px",
                      transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {r.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              padding: "12px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "0px",
              cursor: "pointer",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontWeight: 500,
              textAlign: "center",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="main-content"
        style={{
          flex: 1,
          padding: "80px 64px",
          background: "var(--bg)",
          transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
