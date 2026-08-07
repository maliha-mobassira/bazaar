"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Logo from "@/components/Logo";

// Utility to decode JWT payload on the client without dependencies
function decodeToken(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save token using AuthContext
      login(data.token);

      // Decode token to find role
      const payload = decodeToken(data.token);
      if (!payload) {
        throw new Error("Invalid token format received");
      }

      // Redirect based on user role
      if (payload.role === "cashier") {
        router.push("/pos");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Full-Screen Closet Background Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/closet_editorial.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "var(--bg-image-opacity)",
          pointerEvents: "none",
          zIndex: 0,
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Content Overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "0px", // Architectural sharp corners
            padding: "56px 48px",
            boxShadow: "none",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
            <Logo size={48} />
            <p
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Sign in to your store
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                fontSize: "13px",
                marginBottom: "24px",
                borderRadius: "0px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@store.com"
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  borderRadius: "0px",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--text-primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  borderRadius: "0px",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--text-primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px",
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "0px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginTop: "16px",
                opacity: loading ? 0.7 : 1,
                boxShadow: "none",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? "Verifying..." : "Log In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
              Don't have a store yet?{" "}
              <Link
                href="/onboard"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                Get Started
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
