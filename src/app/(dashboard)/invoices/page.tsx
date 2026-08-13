"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import InvoiceModal from "@/components/InvoiceModal";
import { InvoiceData } from "@/components/InvoiceView";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "today" | "high">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvoices = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/invoices?search=${encodeURIComponent(query)}` : "/api/invoices";
      const data = await apiRequest<InvoiceData[]>(url);
      setInvoices(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(search);
  };

  const handleOpenInvoice = (inv: InvoiceData) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  const handleCopyInvoiceId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered list according to tab
  const displayedInvoices = invoices.filter((inv) => {
    if (filterTab === "high") return Number(inv.totalAmount) >= 100;
    if (filterTab === "today") {
      const invDate = new Date(inv.createdAt).toDateString();
      const todayDate = new Date().toDateString();
      return invDate === todayDate;
    }
    return true;
  });

  // Compute Summary Statistics
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalItemsSold = invoices.reduce((sum, inv) => sum + (inv.itemCount || 0), 0);
  const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1240px", margin: "0 auto" }}>
      <style>{`
        .invoices-header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .header-title-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: var(--accent-light, rgba(164, 131, 116, 0.08));
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 36px;
        }

        .stat-card-luxury {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .stat-card-luxury:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
          border-color: var(--accent);
        }

        .stat-card-luxury::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, var(--accent-light) 0%, transparent 70%);
          pointer-events: none;
        }

        .stat-card-luxury label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-secondary);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .stat-card-luxury .value {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0;
        }

        .controls-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }

        .filter-tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .filter-tab-btn.active {
          background: var(--text-primary);
          color: var(--bg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .search-bar-luxury {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px 6px 4px 16px;
          width: 100%;
          max-width: 440px;
          transition: all 0.3s ease;
        }

        .search-bar-luxury:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-light);
        }

        .search-input-field {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          padding: 8px 0;
        }

        .search-submit-btn {
          padding: 8px 16px;
          background: var(--text-primary);
          color: var(--bg);
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .search-submit-btn:hover {
          opacity: 0.9;
        }

        /* Responsive Table */
        .invoice-desktop-table-luxury {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        }

        .invoice-desktop-table-luxury th {
          text-align: left;
          padding: 16px 24px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-secondary);
          font-weight: 700;
          border-bottom: 1px solid var(--border);
          background: rgba(0,0,0,0.015);
        }

        .invoice-desktop-table-luxury td {
          padding: 18px 24px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
          transition: background 0.2s;
        }

        .invoice-desktop-table-luxury tr:last-child td {
          border-bottom: none;
        }

        .invoice-desktop-table-luxury tr:hover td {
          background: var(--accent-light, rgba(0,0,0,0.02));
        }

        .status-badge-paid {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .action-btn-view {
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--text-primary), var(--accent, #3A2D28));
          color: var(--bg);
          border: none;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .action-btn-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .mobile-invoice-cards-luxury {
          display: none;
          flex-direction: column;
          gap: 16px;
        }

        .mobile-card-luxury {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 820px) {
          .invoice-desktop-table-luxury {
            display: none;
          }
          .mobile-invoice-cards-luxury {
            display: flex;
          }
          .search-bar-luxury {
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="invoices-header-container">
        <div>
          <span className="header-title-badge">
            <span>✨</span> Enterprise Sales Management
          </span>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            Invoices & Receipts
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              margin: "6px 0 0 0",
            }}
          >
            Review customer transactions, issue digital receipts, and generate print-ready tax invoices.
          </p>
        </div>
      </div>

      {/* Luxury Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card-luxury">
          <label>
            Total Invoices <span>📜</span>
          </label>
          <p className="value">{invoices.length}</p>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "6px" }}>
            Recorded store transactions
          </span>
        </div>

        <div className="stat-card-luxury">
          <label>
            Total Sales Revenue <span>📈</span>
          </label>
          <p className="value" style={{ color: "#10b981" }}>
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "6px" }}>
            Gross processed revenue
          </span>
        </div>

        <div className="stat-card-luxury">
          <label>
            Units Delivered <span>🛍️</span>
          </label>
          <p className="value">{totalItemsSold}</p>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "6px" }}>
            Total items fulfilled
          </span>
        </div>

        <div className="stat-card-luxury">
          <label>
            Avg Transaction Value <span>💎</span>
          </label>
          <p className="value">${avgOrderValue.toFixed(2)}</p>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "6px" }}>
            Average basket size
          </span>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="controls-toolbar">
        {/* Quick Filter Tabs */}
        <div className="filter-tabs">
          <button
            onClick={() => setFilterTab("all")}
            className={`filter-tab-btn ${filterTab === "all" ? "active" : ""}`}
          >
            All ({invoices.length})
          </button>
          <button
            onClick={() => setFilterTab("today")}
            className={`filter-tab-btn ${filterTab === "today" ? "active" : ""}`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterTab("high")}
            className={`filter-tab-btn ${filterTab === "high" ? "active" : ""}`}
          >
            High Value ($100+)
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-bar-luxury">
          <span style={{ fontSize: "14px", opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            placeholder="Search by Invoice #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input-field"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchInvoices("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          )}
          <button type="submit" className="search-submit-btn">
            Filter
          </button>
        </form>
      </div>

      {/* Main Table / Cards Content */}
      {loading ? (
        <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--text-primary)",
              borderRadius: "50%",
              animation: "spin 0.8s cubic-bezier(0.16, 1, 0.3, 1) infinite",
              margin: "0 auto 16px auto",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
            Fetching Invoices...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: "24px",
            background: "rgba(239, 68, 68, 0.08)",
            color: "#ef4444",
            borderRadius: "14px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : displayedInvoices.length === 0 ? (
        <div
          style={{
            padding: "80px 20px",
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ fontSize: "42px", display: "block", marginBottom: "12px" }}>📜</span>
          <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "18px" }}>No Invoices Found</h3>
          <p style={{ fontSize: "13px", margin: "6px 0 0 0" }}>
            No transaction match your filter or search query.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <table className="invoice-desktop-table-luxury">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Customer Details</th>
                <th>Issued Date</th>
                <th>Units</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "monospace",
                          fontSize: "13px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {inv.invoiceNumber}
                      </span>
                      <button
                        onClick={(e) => handleCopyInvoiceId(inv.invoiceNumber, e)}
                        title="Copy Invoice Number"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "11px",
                          opacity: 0.6,
                          padding: "2px 4px",
                        }}
                      >
                        {copiedId === inv.invoiceNumber ? "✅" : "📋"}
                      </button>
                    </div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        fontFamily: "monospace",
                      }}
                    >
                      ID: {inv.id.slice(0, 13)}...
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: "13px" }}>{inv.customerName}</span>
                    {inv.customerPhone && inv.customerPhone !== "N/A" && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        📞 {inv.customerPhone}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", fontWeight: 500 }}>
                      {new Date(inv.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {new Date(inv.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "var(--accent-light)",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {inv.itemCount} items
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: "14px" }}>
                      ${Number(inv.totalAmount).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge-paid">
                      <span className="status-dot" />
                      {inv.status || "PAID"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleOpenInvoice(inv)} className="action-btn-view">
                      View Invoice →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout for Phone Screens */}
          <div className="mobile-invoice-cards-luxury">
            {displayedInvoices.map((inv) => (
              <div key={inv.id} className="mobile-card-luxury">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: "14px" }}>
                    {inv.invoiceNumber}
                  </span>
                  <span className="status-badge-paid">
                    <span className="status-dot" />
                    PAID
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>{inv.customerName}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Date</span>
                  <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Quantity</span>
                  <span>{inv.itemCount} items</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "16px",
                    fontWeight: 800,
                    paddingTop: "10px",
                    borderTop: "1px dashed var(--border)",
                  }}
                >
                  <span>Grand Total</span>
                  <span>${Number(inv.totalAmount).toFixed(2)}</span>
                </div>

                <button onClick={() => handleOpenInvoice(inv)} className="action-btn-view" style={{ width: "100%" }}>
                  View / Print Invoice
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Invoice Detail Popup Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
