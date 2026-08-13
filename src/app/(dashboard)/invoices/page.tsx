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
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Compute Summary Statistics
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalItemsSold = invoices.reduce((sum, inv) => sum + (inv.itemCount || 0), 0);
  const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <style>{`
        .invoices-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 36px;
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-secondary);
          font-weight: 700;
          display: block;
          margin-bottom: 8px;
        }

        .stat-card .value {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0;
        }

        .search-bar-container {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          width: 100%;
        }

        .search-input {
          flex: 1;
          padding: 12px 18px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: var(--accent, #3b82f6);
        }

        .search-btn {
          padding: 12px 24px;
          background: var(--text-primary);
          color: var(--bg);
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .search-btn:hover {
          opacity: 0.9;
        }

        /* 📱 Responsive Mobile Cards for iPhone / Android */
        .invoice-desktop-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--surface);
          border-radius: 14px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .invoice-desktop-table th {
          text-align: left;
          padding: 14px 20px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
          background: rgba(0,0,0,0.02);
        }

        .invoice-desktop-table td {
          padding: 16px 20px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          color: var(--text-primary);
        }

        .invoice-desktop-table tr:hover td {
          background: rgba(0,0,0,0.015);
        }

        .mobile-invoice-cards {
          display: none;
          flex-direction: column;
          gap: 16px;
        }

        .mobile-invoice-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .invoice-desktop-table {
            display: none;
          }
          .mobile-invoice-cards {
            display: flex;
          }
        }
      `}</style>

      {/* Top Page Header */}
      <div className="invoices-header">
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            Invoices & Sales
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              margin: "6px 0 0 0",
            }}
          >
            Manage store transactions, generate customer receipts, and download printable invoices.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <label>Total Invoices</label>
          <p className="value">{invoices.length}</p>
        </div>
        <div className="stat-card">
          <label>Total Revenue</label>
          <p className="value">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <label>Items Sold</label>
          <p className="value">{totalItemsSold}</p>
        </div>
        <div className="stat-card">
          <label>Avg. Order Value</label>
          <p className="value">${avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-bar-container">
        <input
          type="text"
          placeholder="Search invoices by Invoice #, customer name, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>

      {/* Content Area */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "2px solid var(--border)",
              borderTopColor: "var(--text-primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px auto",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading store invoices...
        </div>
      ) : error ? (
        <div
          style={{
            padding: "24px",
            background: "rgba(239, 68, 68, 0.08)",
            color: "#ef4444",
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>📜</span>
          <h3 style={{ margin: 0, color: "var(--text-primary)" }}>No Invoices Found</h3>
          <p style={{ fontSize: "12px", margin: "6px 0 0 0" }}>
            Try resetting your search filter or make a purchase from the POS Checkout.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <table className="invoice-desktop-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "monospace" }}>
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{inv.customerName}</span>
                    {inv.customerPhone && inv.customerPhone !== "N/A" && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {inv.customerPhone}
                      </span>
                    )}
                  </td>
                  <td>
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{inv.itemCount} items</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>${Number(inv.totalAmount).toFixed(2)}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "3px 10px",
                        background: "#10b98118",
                        color: "#10b981",
                        border: "1px solid #10b98133",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {inv.status || "PAID"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleOpenInvoice(inv)}
                      style={{
                        padding: "8px 14px",
                        background: "var(--text-primary)",
                        color: "var(--bg)",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout for Mobile Phones */}
          <div className="mobile-invoice-cards">
            {invoices.map((inv) => (
              <div key={inv.id} className="mobile-invoice-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "14px" }}>
                    {inv.invoiceNumber}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      background: "#10b98118",
                      color: "#10b981",
                      borderRadius: "10px",
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    PAID
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Customer:</span>
                  <span style={{ fontWeight: 600 }}>{inv.customerName}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Date:</span>
                  <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: 800,
                    paddingTop: "8px",
                    borderTop: "1px dashed var(--border)",
                  }}
                >
                  <span>Total</span>
                  <span>${Number(inv.totalAmount).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => handleOpenInvoice(inv)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--text-primary)",
                    color: "var(--bg)",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  View / Print Invoice
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Invoice Detail Modal */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
