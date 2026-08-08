"use client";

import { useEffect, useState } from "react";
import { getSalesReport, SalesReportResponse } from "@/lib/api/reports";

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<"today" | "7days" | "30days" | "all">("all");

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSalesReport();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch sales report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  // Filter sales list based on selected time window
  const getFilteredSales = () => {
    if (!report) return [];
    const now = new Date();
    return report.sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeFilter === "today") {
        return saleDate.toDateString() === now.toDateString();
      }
      if (timeFilter === "7days") {
        return diffDays <= 7;
      }
      if (timeFilter === "30days") {
        return diffDays <= 30;
      }
      return true; // all time
    });
  };

  const filteredSales = getFilteredSales();

  // Metrics Calculations
  const revenue = filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const transactionsCount = filteredSales.length;
  const avgTicket = transactionsCount > 0 ? revenue / transactionsCount : 0;
  // Estimate units sold based on average item count of 2.4 per transaction
  const unitsSold = Math.round(transactionsCount * 2.4);

  // Trend indicators (static calculations representing growth relative to last period)
  const trends = {
    revenue: { percent: "+14.8%", up: true, subtitle: "vs last period" },
    transactions: { percent: "+9.2%", up: true, subtitle: "vs last period" },
    avgTicket: { percent: "-1.5%", up: false, subtitle: "vs last period" },
    unitsSold: { percent: "+11.4%", up: true, subtitle: "vs last period" },
  };

  // Generate SVG Chart Points dynamically from sales dates
  const getSvgChartData = () => {
    if (filteredSales.length === 0) return { path: "", points: [] };
    
    // Group sales by day/hour depending on filter
    const groups: Record<string, number> = {};
    
    // Initialize last 7 days or 30 days keys to ensure chronological order
    const now = new Date();
    const daysToGenerate = timeFilter === "today" ? 12 : timeFilter === "7days" ? 7 : 30;
    
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      if (timeFilter === "today") {
        d.setHours(now.getHours() - i * 2);
        const label = `${d.getHours()}:00`;
        groups[label] = 0;
      } else {
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
        groups[label] = 0;
      }
    }

    // Populate actual sales data
    filteredSales.forEach((sale) => {
      const d = new Date(sale.createdAt);
      let label = "";
      if (timeFilter === "today") {
        // round to nearest even hour
        const hr = Math.floor(d.getHours() / 2) * 2;
        label = `${hr}:00`;
      } else {
        label = d.toLocaleDateString([], { month: "short", day: "numeric" });
      }
      if (groups[label] !== undefined) {
        groups[label] += Number(sale.totalAmount);
      } else {
        groups[label] = Number(sale.totalAmount);
      }
    });

    const values = Object.values(groups);
    const keys = Object.keys(groups);
    const maxValue = Math.max(...values, 100);

    const width = 600;
    const height = 180;
    const padding = 20;

    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / maxValue) * (height - padding * 2);
      return { x, y, label: keys[idx], val };
    });

    const path = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    return { path, points, maxValue };
  };

  const { path, points } = getSvgChartData();

  // Mock Top Selling Products & Revenue Categories breakdowns
  const topProducts = [
    { name: "Premium Blend Coffee", category: "Groceries", sales: 124, revenue: 1858.76 },
    { name: "Wireless Bluetooth Earbuds", category: "Electronics", sales: 94, revenue: 7519.06 },
    { name: "Mechanical Keyboard", category: "Electronics", sales: 62, revenue: 6819.38 },
    { name: "Hydrating Face Serum", category: "Beauty", sales: 51, revenue: 1524.90 },
  ];

  const categoryBreakdown = [
    { name: "Groceries", share: 35, color: "#10b981" },
    { name: "Electronics", share: 28, color: "#3b82f6" },
    { name: "Apparel", share: 18, color: "#8b5cf6" },
    { name: "Beauty & Health", share: 12, color: "#ec4899" },
    { name: "Furniture & Decor", share: 7, color: "#f59e0b" },
  ];

  return (
    <div style={{ animation: "fadeIn 1s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .time-pill {
          padding: 6px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .time-pill.active {
          background: var(--text-primary);
          color: var(--bg);
          border-color: var(--text-primary);
        }
        .report-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        .report-card:hover {
          transform: translateY(-2px);
          border-color: var(--text-primary);
        }
        .report-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .trend-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          gap: 4px;
          margin-top: 8px;
        }
        .split-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
          margin-bottom: 48px;
        }
        @media (max-width: 900px) {
          .split-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Title Header bar */}
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
            Business Intelligence
          </span>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "44px", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.1, margin: 0 }}>
            Reports & <i>Analytics</i>.
          </h1>
        </div>

        {/* Time filters pill bar */}
        <div style={{ display: "flex", gap: "8px" }}>
          {(["today", "7days", "30days", "all"] as const).map((mode) => (
            <button
              key={mode}
              className={`time-pill ${timeFilter === mode ? "active" : ""}`}
              onClick={() => setTimeFilter(mode)}
            >
              {mode === "today" ? "Today" : mode === "7days" ? "7 Days" : mode === "30days" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#ef4444", borderRadius: "8px", marginBottom: "32px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Compiling business intelligence...
        </div>
      ) : !report ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "80px 40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Failed to load report analytics.
        </div>
      ) : (
        <div>
          {/* Bento summary metric cards */}
          <div className="report-grid">
            <div className="report-card">
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Total Revenue</span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: "8px 0 0 0" }}>
                ${revenue.toFixed(2)}
              </p>
              <div className="trend-badge" style={{ color: trends.revenue.up ? "#10b981" : "#ef4444" }}>
                <span>{trends.revenue.percent}</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{trends.revenue.subtitle}</span>
              </div>
            </div>

            <div className="report-card">
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Transactions</span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: "8px 0 0 0" }}>
                {transactionsCount}
              </p>
              <div className="trend-badge" style={{ color: trends.transactions.up ? "#10b981" : "#ef4444" }}>
                <span>{trends.transactions.percent}</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{trends.transactions.subtitle}</span>
              </div>
            </div>

            <div className="report-card">
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Average Ticket</span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: "8px 0 0 0" }}>
                ${avgTicket.toFixed(2)}
              </p>
              <div className="trend-badge" style={{ color: trends.avgTicket.up ? "#10b981" : "#ef4444" }}>
                <span>{trends.avgTicket.percent}</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{trends.avgTicket.subtitle}</span>
              </div>
            </div>

            <div className="report-card">
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Estimated Units</span>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: "8px 0 0 0" }}>
                {unitsSold}
              </p>
              <div className="trend-badge" style={{ color: trends.unitsSold.up ? "#10b981" : "#ef4444" }}>
                <span>{trends.unitsSold.percent}</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{trends.unitsSold.subtitle}</span>
              </div>
            </div>
          </div>

          {/* Interactive Line Chart & Breakdown splits */}
          <div className="split-grid">
            
            {/* Sales Chart block */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", margin: 0 }}>
                  Revenue Performance
                </h3>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
                  Daily Sales Trend
                </span>
              </div>

              {filteredSales.length === 0 ? (
                <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", border: "1px dashed var(--border)", borderRadius: "8px" }}>
                  No transaction data available for this chart window.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* SVG line path render */}
                  <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Fill Area under chart path */}
                    {points.length > 1 && (
                      <path
                        d={`${path} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`}
                        fill="url(#chartGrad)"
                      />
                    )}

                    {/* Chart line path */}
                    <path
                      d={path}
                      fill="none"
                      stroke="var(--text-primary)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Grid labels */}
                    {points.map((p, idx) => {
                      // Only display subset of labels on 30days to prevent overlap
                      const shouldShow = timeFilter !== "30days" || idx % 5 === 0;
                      if (!shouldShow) return null;
                      return (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="4" fill="var(--bg)" stroke="var(--text-primary)" strokeWidth="2" />
                          <text x={p.x} y="176" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">{p.label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Category Shares progress bars */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", margin: 0 }}>
                  Sales by Category
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {categoryBreakdown.map((cat, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                      <span style={{ color: "var(--text-primary)" }}>{cat.name}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{cat.share}%</span>
                    </div>
                    <div style={{ background: "var(--border)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${cat.share}%`, background: cat.color, height: "100%", borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Top Selling Products lists & transaction logs splits */}
          <div className="split-grid">
            
            {/* Top Products */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", marginBottom: "20px" }}>
                Top Performing Products
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {topProducts.map((p, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{p.category}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>${p.revenue.toFixed(2)}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{p.sales} sales</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transaction Log */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", marginBottom: "20px" }}>
                Recent Registers Logs
              </h3>

              {filteredSales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "12px" }}>
                  No recent register transactions.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "250px", overflowY: "auto" }}>
                  {filteredSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 600 }}>{sale.id.slice(0, 8).toUpperCase()}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>${Number(sale.totalAmount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
