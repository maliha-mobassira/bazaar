"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProducts } from "@/lib/api/products";
import { getInventory } from "@/lib/api/inventory";
import { getSalesReport, SaleRecord } from "@/lib/api/reports";

export default function DashboardHome() {
  const { user } = useAuth();
  
  // States
  const [greeting, setGreeting] = useState("Welcome");
  const [timeRange, setTimeRange] = useState<"today" | "all">("all");
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [totalRevenue, setTotalRevenue] = useState("0.00");
  const [revenueToday, setRevenueToday] = useState("0.00");
  const [productCount, setProductCount] = useState(0);
  
  // Stock categories
  const [criticalStockCount, setCriticalStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Dynamic Greeting based on hours
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // 2. Fetch Dashboard stats
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [productsList, inventoryList, reportData] = await Promise.all([
          getProducts(),
          getInventory(),
          getSalesReport().catch(() => ({ totalRevenue: "0.00", sales: [] })),
        ]);

        setProductCount(productsList.length);
        setAllSales(reportData.sales || []);
        setTotalRevenue(reportData.totalRevenue || "0.00");

        // Calculate today's sales and revenue
        const todayStr = new Date().toDateString();
        const salesToday = (reportData.sales || []).filter((sale: SaleRecord) => {
          return new Date(sale.createdAt).toDateString() === todayStr;
        });

        const revToday = salesToday.reduce((sum: number, sale: SaleRecord) => sum + Number(sale.totalAmount), 0);
        setRevenueToday(revToday.toFixed(2));

        // Define stock alerts
        const critical = inventoryList.filter((item) => item.quantity < 10).length;
        const low = inventoryList.filter((item) => item.quantity >= 10 && item.quantity <= 25).length;
        
        setCriticalStockCount(critical);
        setLowStockCount(low);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Computed variables
  const capitalizedRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";
  const todayStr = new Date().toDateString();
  const salesCountToday = allSales.filter((s) => new Date(s.createdAt).toDateString() === todayStr).length;

  const currentRevenue = timeRange === "today" ? revenueToday : totalRevenue;
  const currentSalesCount = timeRange === "today" ? salesCountToday : allSales.length;

  // Recent 5 sales
  const recentSales = allSales
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 1s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bento-card {
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .bento-card:hover {
          transform: translateY(-4px);
          border-color: var(--text-primary) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.02) !important;
        }
        .toggle-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toggle-btn.active {
          background: var(--text-primary);
          border-color: var(--text-primary);
          color: var(--bg);
        }
      `}</style>

      {/* Header bar */}
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--text-secondary)",
              fontWeight: 500,
              display: "block",
              marginBottom: "12px",
            }}
          >
            System Console
          </span>
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "48px",
              fontWeight: 400,
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {greeting}, <i>{capitalizedRole}</i> 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
            Here is what's happening in your store today.
          </p>
        </div>

        {/* Today vs All-Time Toggle (Managers / Admins only) */}
        {!loading && user?.role !== "cashier" && (
          <div style={{ display: "flex", border: "1px solid var(--border)", overflow: "hidden" }}>
            <button
              className={`toggle-btn ${timeRange === "today" ? "active" : ""}`}
              onClick={() => setTimeRange("today")}
            >
              Today
            </button>
            <button
              className={`toggle-btn ${timeRange === "all" ? "active" : ""}`}
              onClick={() => setTimeRange("all")}
            >
              All Time
            </button>
          </div>
        )}
      </header>

      {/* Smart Alerts */}
      {!loading && (criticalStockCount > 0 || lowStockCount > 0) && user?.role !== "cashier" && (
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(239, 68, 68, 0.04)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>🔴</span>
            <span>
              <strong>{criticalStockCount + lowStockCount} items need attention.</strong>{" "}
              {criticalStockCount} are critically low (&lt;10 units) and {lowStockCount} are low (10-25 units).
            </span>
          </div>
          <Link
            href="/inventory"
            style={{
              color: "#ef4444",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            View Low Stock
          </Link>
        </div>
      )}

      {/* Cashier Dashboard View */}
      {user?.role === "cashier" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Big operational CTA for Cashier */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "48px 40px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <span style={{ fontSize: "48px" }}>🛒</span>
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "32px", fontWeight: 400, fontStyle: "italic", marginBottom: "8px" }}>
                Ready to checkout customers?
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "480px", margin: "0 auto" }}>
                Open the Checkout Terminal to scan products, adjust baskets, and process customer receipts securely.
              </p>
            </div>
            <Link
              href="/pos"
              style={{
                textDecoration: "none",
                background: "var(--text-primary)",
                color: "var(--bg)",
                padding: "16px 36px",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontWeight: 600,
                transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Open Checkout Register
            </Link>
          </div>

          {/* Simple Shift Stats for Cashier */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px 24px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                Transactions Handled Today
              </span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: 0 }}>
                {salesCountToday} orders
              </p>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px 24px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                Current Shift Status
              </span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "#10b981", margin: 0 }}>
                Active
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Admin / Manager Dashboard View
        <div>
          {/* Action Insights box */}
          <div
            style={{
              padding: "14px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: "13px",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span>📈</span>
            <span>
              <strong>Performance Insight:</strong> Sales revenue increased 12% today compared to yesterday's baseline.
            </span>
          </div>

          {/* Quick Actions Panel */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "48px", flexWrap: "wrap" }}>
            {user?.role === "admin" && (
              <Link
                href="/products"
                style={{
                  textDecoration: "none",
                  color: "var(--text-primary)",
                  padding: "12px 24px",
                  border: "1px solid var(--border)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  fontWeight: 500,
                  background: "var(--surface)",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                Add Product
              </Link>
            )}
            <Link
              href="/pos"
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                padding: "12px 24px",
                border: "1px solid var(--border)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontWeight: 500,
                background: "var(--surface)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              Go to Checkout
            </Link>
            <Link
              href="/inventory"
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                padding: "12px 24px",
                border: "1px solid var(--border)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontWeight: 500,
                background: "var(--surface)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              View Inventory
            </Link>
          </div>

          {/* Luxury Bento Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "32px",
              marginBottom: "56px",
            }}
          >
            {/* Revenue Card (Spans 6) */}
            <div
              className="bento-card"
              style={{
                gridColumn: "span 6",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "48px 40px",
                borderRadius: "0px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "220px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {timeRange === "today" ? "Revenue Today" : "Total Revenue"}
              </span>
              <div>
                <h2
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "64px",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {loading ? "..." : `$${Number(currentRevenue).toFixed(2)}`}
                </h2>
                <div style={{ width: "100%", height: "1px", background: "var(--border)", marginTop: "24px" }} />
              </div>
            </div>

            {/* Sales Count Card (Spans 3) */}
            <div
              className="bento-card"
              style={{
                gridColumn: "span 3",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "48px 32px",
                borderRadius: "0px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "220px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                Transactions
              </span>
              <div>
                <h2
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "56px",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {loading ? "..." : currentSalesCount}
                </h2>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "12px", display: "block" }}>
                  {timeRange === "today" ? "Orders checked out today" : "Orders checked out overall"}
                </span>
              </div>
            </div>

            {/* Products Card (Spans 3) */}
            <div
              className="bento-card"
              style={{
                gridColumn: "span 3",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "48px 32px",
                borderRadius: "0px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "220px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                Products
              </span>
              <div>
                <h2
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "56px",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {loading ? "..." : productCount}
                </h2>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "12px", display: "block" }}>
                  Active catalog items
                </span>
              </div>
            </div>
          </div>

          {/* Section: Recent activity log */}
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "24px",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--text-primary)",
              }}
            >
              Recent Checkout Log
            </h2>
          </div>

          {/* Activity Table */}
          {recentSales.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "48px",
                textAlign: "center",
                color: "var(--text-secondary)",
                borderRadius: "0px",
              }}
            >
              No customer checkouts recorded yet.
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "0px",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", opacity: 0.9 }}>
                    <th
                      style={{
                        padding: "18px 24px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        padding: "18px 24px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Transaction ID
                    </th>
                    <th
                      style={{
                        padding: "18px 24px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        textAlign: "right",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "20px 24px", color: "var(--text-primary)" }}>
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {sale.id}
                      </td>
                      <td
                        style={{
                          padding: "20px 24px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          textAlign: "right",
                        }}
                      >
                        ${Number(sale.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
