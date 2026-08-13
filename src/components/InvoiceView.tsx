"use client";

import React, { useState } from "react";
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
  const [copiedLink, setCopiedLink] = useState(false);

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
  const taxEstimated = subtotalNum * 0.05; // 5% estimated VAT breakdown

  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="invoice-container-luxury">
      <style>{`
        .invoice-container-luxury {
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          background: var(--surface, #ffffff);
          color: var(--text-primary, #111827);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 20px;
          padding: 44px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .invoice-container-luxury::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, var(--accent, #3A2D28), #10b981, var(--sand-caramel, #CBAD8D));
        }

        .invoice-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          margin-bottom: 36px;
          border-bottom: 1px dashed var(--border, #e5e7eb);
          gap: 12px;
          flex-wrap: wrap;
        }

        .invoice-btn-luxury {
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .invoice-btn-luxury-primary {
          background: var(--text-primary, #111827);
          color: var(--bg, #ffffff);
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }

        .invoice-btn-luxury-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          opacity: 0.95;
        }

        .invoice-btn-luxury-secondary {
          background: rgba(0, 0, 0, 0.04);
          color: var(--text-primary, #111827);
          border: 1px solid var(--border, #e5e7eb);
        }

        [data-theme="dark"] .invoice-btn-luxury-secondary {
          background: rgba(255, 255, 255, 0.06);
        }

        .invoice-btn-luxury-secondary:hover {
          background: rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .invoice-header-luxury {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 36px;
          flex-wrap: wrap;
          position: relative;
        }

        .paid-stamp-graphic {
          position: absolute;
          top: 30px;
          right: 220px;
          border: 3px double #10b981;
          color: #10b981;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.25em;
          padding: 6px 16px;
          border-radius: 8px;
          transform: rotate(-12deg);
          opacity: 0.85;
          pointer-events: none;
          text-transform: uppercase;
        }

        .invoice-badge-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: 8px;
        }

        .invoice-grid-luxury {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          padding: 24px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 14px;
          border: 1px solid var(--border, #e5e7eb);
          margin-bottom: 36px;
        }

        [data-theme="dark"] .invoice-grid-luxury {
          background: rgba(255, 255, 255, 0.02);
        }

        .invoice-meta-item label {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-secondary, #6b7280);
          font-weight: 700;
          margin-bottom: 6px;
        }

        .invoice-meta-item p {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #111827);
        }

        .invoice-table-luxury {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 36px;
        }

        .invoice-table-luxury th {
          text-align: left;
          padding: 14px 18px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--text-secondary, #6b7280);
          font-weight: 700;
          border-bottom: 2px solid var(--border, #e5e7eb);
          background: rgba(0,0,0,0.015);
        }

        .invoice-table-luxury td {
          padding: 16px 18px;
          font-size: 13px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          color: var(--text-primary, #111827);
        }

        .invoice-summary-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .summary-card-box {
          width: 100%;
          max-width: 340px;
          margin-left: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0, 0, 0, 0.015);
          padding: 20px;
          border-radius: 14px;
          border: 1px solid var(--border, #e5e7eb);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
        }

        .summary-row.grand-total {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary, #111827);
          padding-top: 14px;
          border-top: 2px solid var(--border, #e5e7eb);
          margin-top: 4px;
        }

        /* 📱 Responsive Screen Adjustments */
        @media (max-width: 640px) {
          .invoice-container-luxury {
            padding: 24px 18px !important;
            border-radius: 14px !important;
          }
          .paid-stamp-graphic {
            display: none;
          }
          .invoice-table-luxury th:nth-child(2),
          .invoice-table-luxury td:nth-child(2) {
            display: none;
          }
          .summary-card-box {
            max-width: 100% !important;
          }
        }

        /* 🖨️ Clean Print Engine Rules */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .invoice-actions-bar, .desktop-sidebar, .mobile-top-bar, header {
            display: none !important;
          }
          .invoice-container-luxury {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .paid-stamp-graphic {
            border-color: #000000 !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Action Toolbar */}
      <div className="invoice-actions-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo size={22} direction="row" />
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)" }}>
            Bazaar Official Tax Receipt
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleNativePrint} className="invoice-btn-luxury invoice-btn-luxury-primary">
            <span>🖨️</span> Print / Save PDF
          </button>
          <button onClick={handleCopyShareLink} className="invoice-btn-luxury invoice-btn-luxury-secondary">
            {copiedLink ? "Link Copied!" : "🔗 Share"}
          </button>
          {onClose && (
            <button onClick={onClose} className="invoice-btn-luxury invoice-btn-luxury-secondary">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Official Stamp Graphic */}
      <div className="paid-stamp-graphic">OFFICIALLY PAID</div>

      {/* Invoice Header */}
      <div className="invoice-header-luxury">
        <div>
          <Logo size={42} />
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              margin: "14px 0 4px 0",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {invoice.storeName || "Bazaar Retail Store"}
          </h1>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
            Retail Management & POS Platform
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
            VAT Reg No: 883-9210-BZ • HQ Branch
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 900,
              margin: 0,
              fontFamily: "monospace",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            {invoice.invoiceNumber}
          </h2>
          <span className="invoice-badge-status">
            <span>✓</span> {invoice.status || "PAID & VERIFIED"}
          </span>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "8px 0 0 0", fontWeight: 500 }}>
            Issued: {formattedDate}
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="invoice-grid-luxury">
        <div className="invoice-meta-item">
          <label>Billed Customer</label>
          <p>{invoice.customerName || "Walk-in Customer"}</p>
          {invoice.customerPhone && invoice.customerPhone !== "N/A" && (
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              📞 {invoice.customerPhone}
            </span>
          )}
        </div>

        <div className="invoice-meta-item">
          <label>Cashier / Terminal</label>
          <p>{invoice.cashierEmail || "Store Cashier"}</p>
        </div>

        <div className="invoice-meta-item">
          <label>Payment Channel</label>
          <p>Credit / Digital POS</p>
        </div>

        <div className="invoice-meta-item">
          <label>Fulfilled Quantity</label>
          <p>{invoice.itemCount} units total</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="invoice-table-luxury">
        <thead>
          <tr>
            <th>Line Item & Description</th>
            <th>SKU</th>
            <th style={{ textAlign: "center" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Unit Price</th>
            <th style={{ textAlign: "right" }}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <tr key={item.productId || idx}>
                <td>
                  <span style={{ fontWeight: 700, fontSize: "13px" }}>{item.name}</span>
                  {item.category && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                </td>
                <td style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {item.sku || "N/A"}
                </td>
                <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: "right", fontWeight: 800 }}>
                  ${item.lineTotal.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "30px" }}>
                No items recorded for this invoice.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary Container & Barcode */}
      <div className="invoice-summary-section">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <svg width="200" height="42" viewBox="0 0 180 40">
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
            VERIFIED SALE • {invoice.id}
          </span>
        </div>

        <div className="summary-card-box">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotalNum.toFixed(2)}</span>
          </div>

          {discountNum > 0 && (
            <div className="summary-row" style={{ color: "#10b981" }}>
              <span>Promo / Store Discount</span>
              <span>-${discountNum.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Tax Breakdown (5% VAT)</span>
            <span>${taxEstimated.toFixed(2)}</span>
          </div>

          <div className="summary-row grand-total">
            <span>Grand Total</span>
            <span>${totalNum.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Receipt Footer */}
      <div
        style={{
          borderTop: "1px dashed var(--border, #e5e7eb)",
          paddingTop: "24px",
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-secondary)",
          lineHeight: "1.6",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>
          Thank you for choosing Bazaar Retail Group! Returns & exchanges are accepted within 14 days with original receipt.
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: "10px", opacity: 0.7 }}>
          Bazaar Retail OS • Secure Multi-Tenant Cloud Architecture
        </p>
      </div>
    </div>
  );
}
