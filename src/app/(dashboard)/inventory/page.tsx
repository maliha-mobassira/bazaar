"use client";

import { useEffect, useState } from "react";
import { getInventory, InventoryItem } from "@/lib/api/inventory";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventory();
      setInventory(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const displayedInventory = showLowStockOnly
    ? inventory.filter((item) => item.quantity <= 20)
    : inventory;

  return (
    <div>
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
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
            Inventory
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
            Track and manage stock levels.
          </p>
        </div>

        {/* Filter Toggle Button */}
        {!loading && inventory.length > 0 && (
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            style={{
              padding: "10px 20px",
              background: showLowStockOnly ? "var(--text-primary)" : "transparent",
              color: showLowStockOnly ? "var(--bg)" : "var(--text-primary)",
              border: "1px solid var(--text-primary)",
              borderRadius: "0px",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {showLowStockOnly ? "Show All Items" : "Filter Low Stock (≤ 20)"}
          </button>
        )}
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
          Loading stock levels...
        </div>
      ) : inventory.length === 0 ? (
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
          No stock records found. Seed products to generate inventory levels.
        </div>
      ) : displayedInventory.length === 0 ? (
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
          No items are currently low in stock (≤ 20).
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
                    width: "80px",
                  }}
                >
                  Image
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
                  SKU
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
                  Product Name
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
                  Category
                </th>
                <th
                  style={{
                    padding: "18px 24px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    width: "150px",
                  }}
                >
                  Status
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
                  Stock Level
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedInventory.map((item) => {
                // Status Badge Calculation
                let statusText = "In Stock";
                let statusColor = "#10b981"; // Green
                let statusBg = "rgba(16, 185, 129, 0.05)";
                let statusBorder = "rgba(16, 185, 129, 0.12)";

                if (item.quantity < 10) {
                  statusText = "Critical";
                  statusColor = "#ef4444"; // Red
                  statusBg = "rgba(239, 68, 68, 0.05)";
                  statusBorder = "rgba(239, 68, 68, 0.12)";
                } else if (item.quantity <= 25) {
                  statusText = "Low Stock";
                  statusColor = "#f59e0b"; // Orange
                  statusBg = "rgba(245, 158, 11, 0.05)";
                  statusBorder = "rgba(245, 158, 11, 0.12)";
                }

                return (
                  <tr
                    key={item.id}
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
                    <td style={{ padding: "12px 24px" }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || "Product"}
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "0px",
                            border: "1px solid var(--border)",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            border: "1px solid var(--border)",
                            background: "var(--accent-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "9px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "var(--text-secondary)",
                          }}
                        >
                          N/A
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      {item.sku || "N/A"}
                    </td>
                    <td style={{ padding: "20px 24px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {item.name || "Unknown Product"}
                    </td>
                    <td style={{ padding: "20px 24px", textTransform: "capitalize", color: "var(--text-secondary)" }}>
                      {item.category || "General"}
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          background: statusBg,
                          border: `1px solid ${statusBorder}`,
                          color: statusColor,
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {statusText}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        textAlign: "right",
                      }}
                    >
                      {item.quantity} units
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
