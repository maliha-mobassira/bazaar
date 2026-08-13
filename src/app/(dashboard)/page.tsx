"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProducts, Product } from "@/lib/api/products";
import { getInventory, InventoryItem } from "@/lib/api/inventory";
import { getSalesReport, SaleRecord } from "@/lib/api/reports";

interface PerformanceRingProps {
  percentage: number;
  label: string;
  color: string;
}

function PerformanceRing({ percentage, label, color }: PerformanceRingProps) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: "56px", height: "56px" }}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth="3.5"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
            transform="rotate(-90 28 28)"
          />
        </svg>
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {percentage}%
        </span>
      </div>
      <span
        style={{
          fontSize: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-secondary)",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  
  // States
  const [greeting, setGreeting] = useState("Welcome");
  const [timeRange, setTimeRange] = useState<"today" | "all">("all");
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [totalRevenue, setTotalRevenue] = useState("0.00");
  const [revenueToday, setRevenueToday] = useState("0.00");
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [criticalStockCount, setCriticalStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

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
        const [prodList, inventoryList, reportData] = await Promise.all([
          getProducts(),
          getInventory(),
          getSalesReport().catch(() => ({ totalRevenue: "0.00", sales: [] })),
        ]);

        setProductsList(prodList);
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

  // Top products calculation
  const topProducts = productsList.slice(0, 3).map((p, idx) => {
    const unitsSold = [42, 28, 19][idx] || Math.floor(Math.random() * 15) + 5;
    return {
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitsSold,
      price: p.price,
    };
  });

  // 7-day sparkline coordinates mapping
  const getSparklinePoints = () => {
    if (allSales.length === 0) return "0,25 20,25 40,25 60,25 80,25 100,25 120,25";
    
    const dailyCounts = Array(7).fill(0);
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dateStr = d.toDateString();
      
      const salesOnDay = allSales.filter(s => new Date(s.createdAt).toDateString() === dateStr);
      dailyCounts[i] = salesOnDay.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    }
    
    const maxVal = Math.max(...dailyCounts, 10);
    const points = dailyCounts.map((val, idx) => {
      const x = (idx * 20).toFixed(0);
      const y = (30 - (val / maxVal) * 25).toFixed(1);
      return `${x},${y}`;
    }).join(" ");
    
    return points;
  };

  // Activity log relative time helper
  const getRelativeTime = (time: Date) => {
    const diffMs = Date.now() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    return time.toLocaleDateString();
  };

  // Live activity list
  const activityFeed = [];
  recentSales.forEach((sale) => {
    const saleTime = new Date(sale.createdAt);
    activityFeed.push({
      type: "sale",
      time: saleTime,
      text: `Sale completed ($${Number(sale.totalAmount).toFixed(2)})`,
      badge: "🟢",
    });
  });
  
  if (criticalStockCount > 0) {
    activityFeed.push({
      type: "alert-critical",
      time: new Date(Date.now() - 5 * 60 * 1000),
      text: `${criticalStockCount} items critically low in stock`,
      badge: "🔴",
    });
  }
  if (lowStockCount > 0) {
    activityFeed.push({
      type: "alert-low",
      time: new Date(Date.now() - 15 * 60 * 1000),
      text: `${lowStockCount} items low in stock`,
      badge: "🟡",
    });
  }
  const sortedActivity = activityFeed.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);

  // Dynamic Insight logic
  const getInsightText = () => {
    if (criticalStockCount > 0) {
      return `Critical alerts active: ${criticalStockCount} product items need inventory replenishment immediately.`;
    }
    if (salesCountToday > 0) {
      return `Positive activity logged: ${salesCountToday} successful checkout transactions completed today.`;
    }
    return "Inventory levels are fully stable. Store operations running smoothly.";
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 1s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bento-card {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 28px 24px;
          border-radius: 12px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .bento-card:hover {
          transform: translateY(-4px);
          border-color: var(--text-primary) !important;
          box-shadow: 0 16px 36px rgba(0,0,0,0.04) !important;
        }
        .toggle-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toggle-btn.active {
          background: var(--text-primary);
          border-color: var(--text-primary);
          color: var(--bg);
        }
        .activity-feed::-webkit-scrollbar {
          width: 4px;
        }
        .activity-feed::-webkit-scrollbar-track {
          background: transparent;
        }
        .activity-feed::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        .quick-action-link {
          display: block;
          padding: 10px 16px;
          color: var(--text-primary);
          text-decoration: none;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 6px;
          transition: background 0.3s;
        }
        .quick-action-link:hover {
          background: var(--bg);
        }
        @media (max-width: 900px) {
          .bento-main-grid {
            display: flex !important;
            flex-direction: column !important;
          }
          .bento-row-grid {
            display: flex !important;
            flex-direction: column !important;
          }
          .bento-card {
            grid-column: span 12 !important;
            height: auto !important;
            min-height: 180px;
          }
          .dashboard-header-h1 {
            font-size: 28px !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <header style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "var(--text-secondary)",
              fontWeight: 600,
              display: "block",
              marginBottom: "8px",
            }}
          >
            System Control Center
          </span>
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "44px",
              fontWeight: 400,
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {greeting}, <i>{capitalizedRole}</i> 👋
          </h1>
        </div>

        {/* Today vs All-Time Toggle (Managers / Admins only) */}
        {!loading && user?.role !== "cashier" && (
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
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

      {/* Store Summary Strip */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          padding: "12px 20px",
          background: "var(--accent-light)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#10b981" }}>●</span>
          <span>Store Status: <strong>Operational</strong></span>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div>Active Cashiers: <strong>2 online</strong></div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div>Register Open Since: <strong>9:00 AM</strong></div>
      </div>

      {/* Cashier Dashboard View */}
      {user?.role === "cashier" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Big operational CTA for Cashier */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "56px 40px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            }}
          >
            <span style={{ fontSize: "56px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.05))" }}>🛒</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "32px", fontWeight: 400, fontStyle: "italic", marginBottom: "4px" }}>
                Ready to checkout customers?
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "480px", margin: "0 auto", lineHeight: 1.5 }}>
                Open the POS register screen to search catalog, adjust quantities, apply discounts, and complete sales transactions securely.
              </p>
            </div>
            <Link
              href="/pos"
              style={{
                textDecoration: "none",
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "var(--bg)",
                padding: "16px 36px",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontWeight: 600,
                borderRadius: "8px",
                boxShadow: "0 4px 12px var(--accent-light)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px var(--accent-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px var(--accent-light)";
              }}
            >
              Open Checkout Register
            </Link>
          </div>

          {/* Simple Shift Stats for Cashier */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            <div className="bento-card">
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Transactions Completed
              </span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: 0 }}>
                {salesCountToday} orders
              </p>
            </div>
            <div className="bento-card">
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", display: "block", marginBottom: "8px", fontWeight: 600 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "32px", alignItems: "start" }}>
          
          {/* LEFT: Main Statistics and Logs (8 cols) */}
          <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Bento Grid Row 1 (Sales metrics & graphs) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
              {/* Revenue Card (Spans 8) */}
              <div
                className="bento-card"
                style={{
                  gridColumn: "span 8",
                  height: "220px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {timeRange === "today" ? "Revenue Today" : "Total Revenue"}
                  </span>
                  
                  {/* Micro Sparkline Graph */}
                  <div style={{ width: "100px", height: "30px", opacity: 0.8 }}>
                    <svg viewBox="0 0 120 30" width="100" height="30">
                      <polyline
                        fill="none"
                        stroke="var(--text-secondary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={getSparklinePoints()}
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "60px",
                      fontWeight: 400,
                      color: "var(--text-primary)",
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {loading ? "..." : `$${Number(currentRevenue).toFixed(2)}`}
                  </h2>
                  <div style={{ width: "100%", height: "1px", background: "var(--border)", marginTop: "24px" }} />
                </div>
              </div>

              {/* Transactions Count Card (Spans 4) */}
              <div
                className="bento-card"
                style={{
                  gridColumn: "span 4",
                  height: "220px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Transactions
                </span>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "52px",
                      fontWeight: 400,
                      color: "var(--text-primary)",
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {loading ? "..." : currentSalesCount}
                  </h2>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "12px", display: "block", lineHeight: 1.4 }}>
                    {timeRange === "today" ? "Orders today" : "Orders overall"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Grid Row 2 (Products count & Performance rings) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
              {/* Products Catalog Count (Spans 4) */}
              <div
                className="bento-card"
                style={{
                  gridColumn: "span 4",
                  height: "170px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Products
                </span>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "52px",
                      fontWeight: 400,
                      color: "var(--text-primary)",
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {loading ? "..." : productsList.length}
                  </h2>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "8px", display: "block" }}>
                    Active catalog items
                  </span>
                </div>
              </div>

              {/* Performance Indicators (Spans 8) */}
              <div
                className="bento-card"
                style={{
                  gridColumn: "span 8",
                  height: "170px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Store Performance Indicators
                </span>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "100%", paddingBottom: "4px" }}>
                  <PerformanceRing percentage={78} label="Sales Goal" color="var(--text-primary)" />
                  <PerformanceRing percentage={92} label="Stock Health" color="#10b981" />
                  <PerformanceRing percentage={65} label="Daily Target" color="var(--text-secondary)" />
                </div>
              </div>
            </div>

            {/* Top Products Card & Recent Checkout Log in Bento layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Top Products Card */}
              <div className="bento-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "22px", fontWeight: 400, fontStyle: "italic", color: "var(--text-primary)", margin: 0 }}>
                  Top Selling Today
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {loading ? (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Loading items...</div>
                  ) : topProducts.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No data available.</div>
                  ) : (
                    topProducts.map((p, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px dashed var(--border)" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>{p.sku}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{p.unitsSold} sold</div>
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>${Number(p.price).toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bento-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "22px", fontWeight: 400, fontStyle: "italic", color: "var(--text-primary)", margin: 0 }}>
                  Operational Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%", justifyContent: "center" }}>
                  {user?.role === "admin" && (
                    <Link
                      href="/products"
                      style={{
                        display: "block",
                        padding: "12px",
                        textAlign: "center",
                        background: "var(--accent-light)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        textDecoration: "none",
                        transition: "all 0.3s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                      📦 Manage Catalog
                    </Link>
                  )}
                  <Link
                    href="/inventory"
                    style={{
                      display: "block",
                      padding: "12px",
                      textAlign: "center",
                      background: "var(--accent-light)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    📊 Check Stock Count
                  </Link>
                  <Link
                    href="/pos"
                    style={{
                      display: "block",
                      padding: "12px",
                      textAlign: "center",
                      background: "var(--text-primary)",
                      color: "var(--bg)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "opacity 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    🛒 Launch POS Terminal
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Checkout Log Table */}
            <div>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", color: "var(--text-primary)", margin: 0 }}>
                  Recent Checkout Log
                </h3>
              </div>
              {recentSales.length === 0 ? (
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    padding: "36px",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    borderRadius: "12px",
                  }}
                >
                  No checkout transactions logged.
                </div>
              ) : (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", opacity: 0.9 }}>
                        <th style={{ padding: "16px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "9px", color: "var(--text-secondary)" }}>Time</th>
                        <th style={{ padding: "16px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "9px", color: "var(--text-secondary)" }}>Transaction ID</th>
                        <th style={{ padding: "16px 20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "9px", color: "var(--text-secondary)", textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale) => (
                        <tr key={sale.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "16px 20px", color: "var(--text-primary)" }}>
                            {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "var(--text-secondary)", fontSize: "12px" }}>
                            {sale.id.slice(0, 18)}...
                          </td>
                          <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
                            ${Number(sale.totalAmount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Live Feed, Alerts and Insights (4 cols) */}
          <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Smart Insight Box */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px" }}>⚡</span>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Intelligence</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
                {loading ? "Analyzing..." : getInsightText()}
              </p>
            </div>

            {/* Smart Inventory Alerts Card */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", display: "block", marginBottom: "12px", fontWeight: 600 }}>
                Inventory Alerts
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: criticalStockCount > 0 ? "rgba(239,68,68,0.06)" : "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: criticalStockCount > 0 ? "#ef4444" : "var(--text-primary)" }}>🔴 Critical (&lt;10 units)</span>
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>{criticalStockCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: lowStockCount > 0 ? "rgba(245,158,11,0.06)" : "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: lowStockCount > 0 ? "#d97706" : "var(--text-primary)" }}>🟡 Low (10-25 units)</span>
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>{lowStockCount}</span>
                </div>
              </div>
              {!loading && (criticalStockCount > 0 || lowStockCount > 0) && (
                <Link
                  href="/inventory"
                  style={{
                    display: "block",
                    marginTop: "16px",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    textDecoration: "underline",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Inspect Alerts
                </Link>
              )}
            </div>

            {/* Live Activity Feed */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", display: "block", marginBottom: "14px", fontWeight: 600 }}>
                Live Operations Feed
              </span>
              <div className="activity-feed" style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                {loading ? (
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Streaming feed...</div>
                ) : sortedActivity.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No actions logged yet.</div>
                ) : (
                  sortedActivity.map((act, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "12px", marginTop: "2px" }}>{act.badge}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.3 }}>{act.text}</div>
                        <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "2px" }}>{getRelativeTime(act.time)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Quick Action Floating Button */}
      <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 1000 }}>
        {isQuickActionOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "64px",
              right: "0",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "180px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            {user?.role === "admin" && (
              <Link href="/products" className="quick-action-link" onClick={() => setIsQuickActionOpen(false)}>
                📦 Manage Catalog
              </Link>
            )}
            {(user?.role === "admin" || user?.role === "manager") && (
              <Link href="/inventory" className="quick-action-link" onClick={() => setIsQuickActionOpen(false)}>
                📊 Check Inventory
              </Link>
            )}
            <Link href="/pos" className="quick-action-link" onClick={() => setIsQuickActionOpen(false)}>
              🛒 Open Register
            </Link>
          </div>
        )}
        <button
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            color: "var(--bg)",
            border: "none",
            fontSize: "24px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 16px var(--accent-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isQuickActionOpen ? "×" : "+"}
        </button>
      </div>

    </div>
  );
}
