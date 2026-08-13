"use client";

import React from "react";
import Logo from "./Logo";

export interface InvoiceItem {
  productId: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  cashierEmail?: string;
  subtotal: string | number;
  discountAmount?: string | number;
  totalAmount: string | number;
  itemCount: number;
  items: InvoiceItem[];
  storeName?: string;
  status?: string;
}

interface InvoiceViewProps {
  invoice: InvoiceData;
  onPrint?: () => void;
  onClose?: () => void;
}

export default function InvoiceView({ invoice, onPrint, onClose }: InvoiceViewProps) {
  const formattedDate = new Date(invoice.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotalNum = Number(invoice.subtotal || invoice.totalAmount);
  const discountNum = Number(invoice.discountAmount || 0);
  const totalNum = Number(invoice.totalAmount);
  const taxEstimated = subtotalNum * 0.05; // 5% estimated tax for display breakdown

  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="invoice-container">
      <style>{`
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: var(--surface, #ffffff);
          color: var(--text-primary, #111827);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          position: relative;
        }

        .invoice-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          margin-bottom: 32px;
          border-bottom: 1px dashed var(--border, #e5e7eb);
          gap: 12px;
          flex-wrap: wrap;
        }

        .invoice-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .invoice-btn-primary {
          background: var(--text-primary, #111827);
          color: var(--bg, #ffffff);
        }

        .invoice-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .invoice-btn-secondary {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-primary, #111827);
          border: 1px solid var(--border, #e5e7eb);
        }

        [data-theme="dark"] .invoice-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
        }

        .invoice-btn-secondary:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }

        .invoice-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #10b98118;
          color: #10b981;
          border: 1px solid #10b98133;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 6px;
        }

        .invoice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          padding: 20px 24px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          border: 1px solid var(--border, #e5e7eb);
          margin-bottom: 32px;
        }

        [data-theme="dark"] .invoice-grid {
          background: rgba(255, 255, 255, 0.02);
        }

        .invoice-meta-item label {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-secondary, #6b7280);
          font-weight: 600;
          margin-bottom: 4px;
        }

        .invoice-meta-item p {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }

        .invoice-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-secondary, #6b7280);
          font-weight: 600;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: rgba(0,0,0,0.01);
        }

        .invoice-table td {
          padding: 14px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          color: var(--text-primary, #111827);
        }

        .invoice-table tr:last-child td {
          border-bottom: none;
        }

        .invoice-summary-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
          flex-wrap: wrap;
          margin-bottom: 36px;
        }

        .invoice-summary-box {
          width: 100%;
          max-width: 320px;
          margin-left: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .summary-row.total {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          padding-top: 12px;
          border-top: 2px solid var(--border, #e5e7eb);
          margin-top: 4px;
        }

        .barcode-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        /* 📱 Responsive Mobile Styles (iPhone & Android) */
        @media (max-width: 640px) {
          .invoice-container {
            padding: 20px 16px !important;
            border-radius: 12px !important;
          }
          .invoice-header {
            flex-direction: column !alignment: flex-start !important;
            gap: 16px !important;
          }
          .invoice-header-right {
            text-align: left !important;
          }
          .invoice-table th:nth-child(2),
          .invoice-table td:nth-child(2) {
            display: none; /* Hide SKU on small mobile phones to keep table super clean */
          }
          .invoice-table th, .invoice-table td {
            padding: 10px 8px !important;
            font-size: 12px !important;
          }
          .invoice-summary-box {
            max-width: 100% !important;
          }
        }

        /* 🖨️ Clean Print Engine CSS Rules */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .invoice-actions, .desktop-sidebar, .mobile-top-bar, header {
            display: none !important;
          }
          .invoice-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .invoice-grid {
            background: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
          }
          .invoice-badge {
            border: 1px solid #10b981 !important;
            color: #10b981 !important;
          }
        }
      `}</style>

      {/* Top Action Toolbar */}
      <div className="invoice-actions">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo size={20} direction="row" />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Official Sales Invoice
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleNativePrint} className="invoice-btn invoice-btn-primary">
            <span>🖨️</span> Print / Save PDF
          </button>
          {onClose && (
            <button onClick={onClose} className="invoice-btn invoice-btn-secondary">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Invoice Header */}
      <div className="invoice-header">
        <div>
          <Logo size={36} />
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              margin: "12px 0 4px 0",
              color: "var(--text-primary)",
            }}
          >
            {invoice.storeName || "Bazaar Retail Store"}
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
            Retail Management & POS System
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
            Tax ID: VAT-8839210-BZ
          </p>
        </div>

        <div className="invoice-header-right" style={{ textAlign: "right" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            {invoice.invoiceNumber}
          </h2>
          <span className="invoice-badge">{invoice.status || "PAID"}</span>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "8px 0 0 0" }}>
            Date: {formattedDate}
          </p>
        </div>
      </div>

      {/* Invoice Metadata Grid */}
      <div className="invoice-grid">
        <div className="invoice-meta-item">
          <label>Billed To</label>
          <p>{invoice.customerName || "Walk-in Customer"}</p>
          {invoice.customerPhone && invoice.customerPhone !== "N/A" && (
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              📞 {invoice.customerPhone}
            </span>
          )}
        </div>

        <div className="invoice-meta-item">
          <label>Issued By</label>
          <p>{invoice.cashierEmail || "Store Cashier"}</p>
        </div>

        <div className="invoice-meta-item">
          <label>Payment Method</label>
          <p>Credit / Digital POS</p>
        </div>

        <div className="invoice-meta-item">
          <label>Total Items</label>
          <p>{invoice.itemCount} units</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>SKU</th>
            <th style={{ textAlign: "center" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <tr key={item.productId || idx}>
                <td>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  {item.category && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                </td>
                <td style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {item.sku || "N/A"}
                </td>
                <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  ${item.lineTotal.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                No items recorded for this invoice.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary Box & Barcode Graphic */}
      <div className="invoice-summary-container">
        <div className="barcode-box">
          <svg width="180" height="40" viewBox="0 0 180 40">
            {/* Simulated barcode SVG lines for realistic retail invoice verification */}
            <rect x="0" y="0" width="3" height="35" fill="currentColor" />
            <rect x="5" y="0" width="2" height="35" fill="currentColor" />
            <rect x="10" y="0" width="4" height="35" fill="currentColor" />
            <rect x="17" y="0" width="1" height="35" fill="currentColor" />
            <rect x="20" y="0" width="3" height="35" fill="currentColor" />
            <rect x="26" y="0" width="5" height="35" fill="currentColor" />
            <rect x="34" y="0" width="2" height="35" fill="currentColor" />
            <rect x="39" y="0" width="4" height="35" fill="currentColor" />
            <rect x="46" y="0" width="1" height="35" fill="currentColor" />
            <rect x="50" y="0" width="3" height="35" fill="currentColor" />
            <rect x="56" y="0" width="2" height="35" fill="currentColor" />
            <rect x="61" y="0" width="4" height="35" fill="currentColor" />
            <rect x="68" y="0" width="1" height="35" fill="currentColor" />
            <rect x="72" y="0" width="3" height="35" fill="currentColor" />
            <rect x="78" y="0" width="5" height="35" fill="currentColor" />
            <rect x="86" y="0" width="2" height="35" fill="currentColor" />
            <rect x="91" y="0" width="4" height="35" fill="currentColor" />
            <rect x="98" y="0" width="1" height="35" fill="currentColor" />
            <rect x="102" y="0" width="3" height="35" fill="currentColor" />
            <rect x="108" y="0" width="2" height="35" fill="currentColor" />
            <rect x="113" y="0" width="4" height="35" fill="currentColor" />
            <rect x="120" y="0" width="1" height="35" fill="currentColor" />
            <rect x="124" y="0" width="3" height="35" fill="currentColor" />
            <rect x="130" y="0" width="5" height="35" fill="currentColor" />
            <rect x="138" y="0" width="2" height="35" fill="currentColor" />
            <rect x="143" y="0" width="4" height="35" fill="currentColor" />
            <rect x="150" y="0" width="1" height="35" fill="currentColor" />
            <rect x="154" y="0" width="3" height="35" fill="currentColor" />
            <rect x="160" y="0" width="2" height="35" fill="currentColor" />
            <rect x="165" y="0" width="4" height="35" fill="currentColor" />
            <rect x="172" y="0" width="2" height="35" fill="currentColor" />
          </svg>
          <span style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.2em", color: "var(--text-secondary)" }}>
            {invoice.id}
          </span>
        </div>

        <div className="invoice-summary-box">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotalNum.toFixed(2)}</span>
          </div>

          {discountNum > 0 && (
            <div className="summary-row" style={{ color: "#10b981" }}>
              <span>Discount</span>
              <span>-${discountNum.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Tax (Incl. 5% VAT)</span>
            <span>${taxEstimated.toFixed(2)}</span>
          </div>

          <div className="summary-row total">
            <span>Grand Total</span>
            <span>${totalNum.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div
        style={{
          borderTop: "1px dashed var(--border, #e5e7eb)",
          paddingTop: "20px",
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-secondary)",
          lineHeight: "1.6",
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>
          Thank you for your business! Please keep this invoice for returns or exchanges within 14 days.
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: "10px", opacity: 0.7 }}>
          Generated by Bazaar Retail SaaS • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
