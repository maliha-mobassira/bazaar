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
  const [showPassword, setShowPassword] = useState(false);

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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        .login-card {
          width: 100%;
          max-width: 420px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 56px 48px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          z-index: 2;
          opacity: 0;
          transform: translateY(24px);
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.02);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          border-radius: 8px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        [data-theme="dark"] .login-input {
          background: rgba(0, 0, 0, 0.15);
        }

        .login-input:focus {
          border-color: var(--accent);
          background: var(--bg);
          box-shadow: 0 0 0 4px var(--accent-light);
        }

        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          color: var(--bg);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px var(--accent-light);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--accent-light);
          opacity: 0.95;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
          opacity: 0.9;
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Full-Screen Closet Background Image with Espresso-based Dark Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "linear-gradient(rgba(28, 22, 19, 0.65), rgba(28, 22, 19, 0.85)), url('/closet_editorial.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.85,
          pointerEvents: "none",
          zIndex: 0,
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      <div className="login-card">
        {/* Logo Area */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "36px", textAlign: "center" }}>
          <Logo size={48} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h2
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--text-secondary)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Retail Management Platform
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                opacity: 0.8,
                margin: 0,
              }}
            >
              Secure access to your store dashboard
            </p>
          </div>
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
              borderRadius: "8px",
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
              className="login-input"
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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="login-input"
                style={{ paddingRight: "64px" }}
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

          <div style={{ marginTop: "12px" }}>
            <button type="submit" disabled={loading} className="login-button">
              {loading && <div className="spinner" />}
              {loading ? "Signing in..." : "Log In"}
            </button>
            
            {/* Security Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "20px",
                color: "var(--text-secondary)",
                fontSize: "11px",
                opacity: 0.75,
              }}
            >
              <span>🔒 Secure login powered by JWT authentication</span>
            </div>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <span>New to Bazaar?</span>
            <br />
            <Link
              href="/onboard"
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              Create your store and start selling in minutes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
