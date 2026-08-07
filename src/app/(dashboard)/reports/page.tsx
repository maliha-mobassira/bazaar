"use client";

import { useEffect, useState } from "react";
import { getSalesReport, SalesReportResponse } from "@/lib/api/reports";

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <header style={{ marginBottom: "40px" }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "36px",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--text-primary)",
            marginBottom: "8px",
            letterSpacing: "-0.5px",
          }}
        >
          Reports & Analytics
        </h1>
        <p
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          Business intelligence and sales overview.
        </p>
      </header>

      {error && (
        <div
          style={{
            padding: "16px",
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            borderRadius: "0px",
            marginBottom: "32px",
            fontSize: "13px",
            letterSpacing: "0.02em",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: "80px 0",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          Compiling business intelligence...
        </div>
      ) : !report ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "80px 40px",
            textAlign: "center",
            color: "var(--text-secondary)",
            borderRadius: "0px",
          }}
        >
          Failed to load report metrics.
        </div>
      ) : (
        <div>
          {/* Top row: Bento-style metric summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {/* Metric Card 1 */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "28px 24px",
                borderRadius: "0px",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Total Revenue
              </span>
              <p
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "42px",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                ${Number(report.totalRevenue).toFixed(2)}
              </p>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "12px", display: "block" }}>
                Sum of all completed customer sales.
              </span>
            </div>

            {/* Metric Card 2 */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "28px 24px",
                borderRadius: "0px",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Transactions
              </span>
              <p
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "42px",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {report.sales.length}
              </p>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "12px", display: "block" }}>
                Total checkouts processed at register.
              </span>
            </div>

            {/* Metric Card 3 */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "28px 24px",
                borderRadius: "0px",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Average Ticket
              </span>
              <p
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "42px",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                $
                {report.sales.length > 0
                  ? (Number(report.totalRevenue) / report.sales.length).toFixed(2)
                  : "0.00"}
              </p>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "12px", display: "block" }}>
                Average revenue earned per transaction.
              </span>
            </div>
          </div>

          {/* Section title */}
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
              Transaction Log
            </h2>
          </div>

          {/* Sales History Table */}
          {report.sales.length === 0 ? (
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
              No transactions recorded yet. Complete checkouts in the POS terminal to populate this history.
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "0px",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
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
                      }}
                    >
                      Date & Time
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
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((sale) => (
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
                      <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {sale.id}
                      </td>
                      <td style={{ padding: "20px 24px", color: "var(--text-primary)" }}>
                        {new Date(sale.createdAt).toLocaleString()}
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
