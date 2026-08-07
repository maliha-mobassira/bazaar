"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function OnboardPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Onboarding failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
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
            maxWidth: "460px",
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
            Get started with Bazaar
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

        {success && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              fontSize: "13px",
              marginBottom: "24px",
              borderRadius: "0px",
            }}
          >
            Store created successfully! Redirecting to login...
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
              Business / Tenant Name
            </label>
            <input
              type="text"
              name="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Retail Store"
              required
              disabled={loading || success}
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
              Admin Email Address
            </label>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@acme.com"
              required
              disabled={loading || success}
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
              Admin Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                disabled={loading || success}
                style={{
                  width: "100%",
                  padding: "12px 64px 12px 16px",
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              padding: "14px",
              background: "var(--text-primary)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "0px",
              fontWeight: 500,
              cursor: loading || success ? "not-allowed" : "pointer",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginTop: "16px",
              opacity: loading || success ? 0.7 : 1,
              boxShadow: "none",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              if (!loading && !success) e.currentTarget.style.opacity = "1";
            }}
          >
            {loading ? "Creating..." : "Confirm & Setup"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
            Already have a store?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              Log In
            </Link>
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}
