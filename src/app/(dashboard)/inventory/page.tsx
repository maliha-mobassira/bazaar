"use client";

import { useEffect, useState } from "react";
import { getInventory, updateInventory, InventoryItem } from "@/lib/api/inventory";
import { deleteProduct } from "@/lib/api/products";
import { useAuth } from "@/context/AuthContext";

interface RestockLog {
  id: string;
  name: string;
  sku: string;
  change: string;
  role: string;
  time: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const role = user?.role || "cashier"; // admin, manager, cashier

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Sort states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("lowest");

  // Selection states (for bulk restock)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Custom Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Restock logs state
  const [logs, setLogs] = useState<RestockLog[]>([]);

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

  // Load audit logs from localStorage on mount
  useEffect(() => {
    fetchInventory();
    const storedLogs = localStorage.getItem("bazaar_restock_logs");
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (_) {}
    }
  }, []);

  // Log stock changes helper
  const addRestockLog = (name: string, sku: string, change: string) => {
    const newLog: RestockLog = {
      id: Math.random().toString(36).slice(2, 9),
      name,
      sku,
      change,
      role: user?.role?.toUpperCase() || "CASHIER",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    const updated = [newLog, ...logs].slice(0, 10); // keep last 10 logs
    setLogs(updated);
    localStorage.setItem("bazaar_restock_logs", JSON.stringify(updated));
  };

  // Increment / decrement stock handler
  const handleQuickAdjust = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      await updateInventory(item.productId, newQty);
      addRestockLog(item.name || "Unknown Product", item.sku || "N/A", delta > 0 ? `+${delta}` : `${delta}`);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to update stock quantity");
    }
  };

  // Bulk restock handler
  const handleBulkRestock = async () => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const item = inventory.find(i => i.id === id);
          if (item) {
            const newQty = item.quantity + 50;
            await updateInventory(item.productId, newQty);
            addRestockLog(item.name || "Unknown Product", item.sku || "N/A", "+50 (Bulk)");
          }
        })
      );
      setSelectedIds([]);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to complete bulk restock");
    } finally {
      setBulkUpdating(false);
    }
  };

  // Open adjustment modal
  const openAdjustModal = (item: InventoryItem) => {
    setActiveItem(item);
    setAdjustQty(item.quantity);
    setIsAdjustModalOpen(true);
  };

  // Handle custom stock value submit
  const handleCustomAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await updateInventory(activeItem.productId, adjustQty);
      const diff = adjustQty - activeItem.quantity;
      if (diff !== 0) {
        addRestockLog(
          activeItem.name || "Unknown Product",
          activeItem.sku || "N/A",
          diff > 0 ? `+${diff}` : `${diff}`
        );
      }
      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to set custom stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin delete product handler
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product catalog entry?")) return;
    try {
      await deleteProduct(id);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  // Multi-select helpers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInventory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInventory.map((i) => i.id));
    }
  };

  // Normalize categories dynamically
  const getNormalizedCategory = (cat?: string) => {
    if (!cat) return "General";
    const c = cat.trim();
    return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  // Get dynamic categories list
  const categoriesList = ["All", ...Array.from(new Set(inventory.map(item => getNormalizedCategory(item.category))))].sort();

  // Get stock level statistics
  const totalProducts = inventory.length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = inventory.filter(item => item.quantity >= 10 && item.quantity <= 20).length;
  const criticalStockCount = inventory.filter(item => item.quantity < 10).length;
  
  // Overall stock health indicator percentage (Healthy products / Total products)
  const healthyCount = inventory.filter(item => item.quantity > 20).length;
  const healthPercent = totalProducts > 0 ? Math.round((healthyCount / totalProducts) * 100) : 100;

  // Stock status badge resolver
  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", color: "#ef4444", bg: "rgba(239, 68, 68, 0.06)", border: "rgba(239, 68, 68, 0.15)" };
    if (qty < 10) return { label: "Critical", color: "#dc2626", bg: "rgba(220, 38, 38, 0.06)", border: "rgba(220, 38, 38, 0.15)" };
    if (qty <= 20) return { label: "Low", color: "#d97706", bg: "rgba(217, 119, 6, 0.06)", border: "rgba(217, 119, 6, 0.15)" };
    return { label: "In Stock", color: "#10b981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.15)" };
  };

  // Filters & Sorting implementation
  const filteredInventory = inventory
    .filter((item) => {
      const matchSearch =
        (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(search.toLowerCase());

      const normalizedCat = getNormalizedCategory(item.category);
      const matchCategory = selectedCategory === "All" || normalizedCat === selectedCategory;

      let matchStatus = true;
      if (selectedStatus === "In Stock") matchStatus = item.quantity > 20;
      else if (selectedStatus === "Low") matchStatus = item.quantity >= 10 && item.quantity <= 20;
      else if (selectedStatus === "Critical") matchStatus = item.quantity < 10 && item.quantity > 0;
      else if (selectedStatus === "Out of Stock") matchStatus = item.quantity === 0;

      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "lowest") return a.quantity - b.quantity;
      if (sortBy === "highest") return b.quantity - a.quantity;
      if (sortBy === "category") return getNormalizedCategory(a.category).localeCompare(getNormalizedCategory(b.category));
      return (a.name || "").localeCompare(b.name || ""); // name alphabetical
    });

  return (
    <div style={{ animation: "fadeIn 1s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bento-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.3s ease;
        }
        .bento-card:hover {
          transform: translateY(-2px);
          border-color: var(--text-primary);
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .search-input {
          padding: 10px 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          border-radius: 8px;
          outline: none;
          min-width: 220px;
          transition: all 0.3s;
        }
        .search-input:focus {
          border-color: var(--text-primary);
          background: var(--bg);
        }
        .select-filter {
          padding: 10px 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          border-radius: 8px;
          outline: none;
          cursor: pointer;
        }
        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .action-icon-btn:hover {
          border-color: var(--text-primary);
          background: var(--bg);
        }
        .pill-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .pill {
          padding: 6px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s;
        }
        .pill.active {
          background: var(--text-primary);
          color: var(--bg);
          border-color: var(--text-primary);
        }
        .form-input {
          width: 100%;
          padding: 10px 0;
          border: none;
          border-bottom: 1px solid var(--border);
          background: transparent;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        .adjust-submit-btn {
          padding: 10px 20px;
          background: var(--text-primary);
          color: var(--bg);
          border: 1px solid var(--text-primary);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .adjust-submit-btn:hover {
          opacity: 0.9;
        }
        .adjust-cancel-btn {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .adjust-cancel-btn:hover {
          background: var(--bg);
        }
      `}</style>

      {/* Header section */}
      <header style={{ marginBottom: "32px" }}>
        <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
          Inventory Manager
        </span>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "44px", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.1 }}>
          Store <i>Inventory</i>.
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
          Track store stock counts, identify low stock warnings, and perform manual restocking.
        </p>
      </header>

      {/* Alert Banner for Low Stock */}
      {!loading && (lowStockCount > 0 || criticalStockCount > 0) && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.18)",
            color: "#d97706",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "18px" }}>⚠</span>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              {lowStockCount + criticalStockCount} products are running low in stock.
            </span>
          </div>
          <button
            onClick={() => { setSelectedStatus("Low"); setSelectedCategory("All"); }}
            style={{
              padding: "6px 14px",
              background: "#d97706",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Review Alerts
          </button>
        </div>
      )}

      {/* Top Bento Health Summary Cards */}
      <div className="bento-grid">
        <div className="bento-card">
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Total Products</span>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: 0 }}>{totalProducts}</p>
        </div>
        <div className="bento-card">
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Total Units</span>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "var(--text-primary)", margin: 0 }}>{totalUnits} units</p>
        </div>
        <div className="bento-card">
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#d97706", fontWeight: 600 }}>Low Stock Alert</span>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "#d97706", margin: 0 }}>{lowStockCount} items</p>
        </div>
        <div className="bento-card">
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#ef4444", fontWeight: 600 }}>Critical Stock</span>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: "36px", color: "#ef4444", margin: 0 }}>{criticalStockCount} items</p>
        </div>
      </div>

      {/* Inventory Health Bar */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px 24px", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
          <span>Overall Stock Health</span>
          <span style={{ color: healthPercent > 70 ? "#10b981" : healthPercent > 40 ? "#f59e0b" : "#ef4444" }}>{healthPercent}% Healthy</span>
        </div>
        <div style={{ background: "var(--border)", height: "8px", borderRadius: "4px", overflow: "hidden", marginTop: "8px" }}>
          <div style={{ width: `${healthPercent}%`, background: healthPercent > 70 ? "#10b981" : healthPercent > 40 ? "#f59e0b" : "#ef4444", height: "100%", borderRadius: "4px", transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Smart Control Bar (Search, Status filters, Sort) */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search stock by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Stock Levels</option>
            <option value="In Stock">In Stock (&gt;20)</option>
            <option value="Low">Low (10-20)</option>
            <option value="Critical">Critical (&lt;10)</option>
            <option value="Out of Stock">Out of Stock (0)</option>
          </select>

          <select
            className="select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="lowest">Stock: Lowest First</option>
            <option value="highest">Stock: Highest First</option>
            <option value="name">Product Name (A-Z)</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* Dynamic Category Pill Bar */}
      <div className="pill-bar">
        {categoriesList.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              className={`pill ${isActive ? "active" : ""}`}
              onClick={() => { setSelectedCategory(cat); setSelectedIds([]); }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Bulk actions panel */}
      {role === "admin" && selectedIds.length > 0 && (
        <div
          style={{
            background: "var(--accent-light)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 600 }}>{selectedIds.length} products selected for restock</span>
          <button
            onClick={handleBulkRestock}
            disabled={bulkUpdating}
            style={{
              padding: "10px 20px",
              background: "var(--text-primary)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {bulkUpdating ? "Restocking..." : "Bulk Restock (+50 Units)"}
          </button>
        </div>
      )}

      {/* Stock Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Array(5).fill(0).map((_, idx) => (
            <div key={idx} style={{ height: "60px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }} />
          ))}
        </div>
      ) : filteredInventory.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "64px", textAlign: "center", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "15px", fontWeight: 500 }}>No stock levels found matching filters.</p>
          <button style={{ marginTop: "16px" }} className="pill active" onClick={() => { setSearch(""); setSelectedCategory("All"); setSelectedStatus("All"); }}>Reset Filters</button>
        </div>
      ) : (
        <div className="responsive-table-container" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {role === "admin" && (
                  <th style={{ padding: "16px 20px", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredInventory.length}
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                )}
                <th style={{ padding: "16px 20px", width: "70px" }}>Image</th>
                <th style={{ padding: "16px 20px" }}>SKU</th>
                <th style={{ padding: "16px 20px" }}>Product</th>
                <th style={{ padding: "16px 20px" }}>Category</th>
                <th style={{ padding: "16px 20px" }}>Level</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                {role !== "cashier" && (
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const status = getStockStatus(item.quantity);
                const normalizedCat = getNormalizedCategory(item.category);

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "var(--accent-light)" : "transparent",
                      transition: "background 0.2s",
                    }}
                  >
                    {role === "admin" && (
                      <td style={{ padding: "16px 20px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(item.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                    )}
                    <td style={{ padding: "12px 20px" }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || ""}
                          style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                        />
                      ) : (
                        <div style={{ width: "36px", height: "36px", background: "var(--accent-light)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{item.sku}</td>
                    <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</td>
                    <td style={{ padding: "16px 20px" }}>{normalizedCat}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: 700 }}>{item.quantity} units</span>
                        {/* Horizontal stock level bar */}
                        <div style={{ width: "80px", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: status.color, width: `${Math.min(100, (item.quantity / 50) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ padding: "4px 10px", background: status.bg, border: `1px solid ${status.border}`, color: status.color, borderRadius: "20px", fontSize: "10px", fontWeight: 600 }}>
                        {status.label}
                      </span>
                    </td>
                    {role !== "cashier" && (
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button className="action-icon-btn" onClick={() => handleQuickAdjust(item, 10)} title="Add 10 Units">➕</button>
                          <button className="action-icon-btn" onClick={() => handleQuickAdjust(item, -10)} title="Reduce 10 Units" disabled={item.quantity <= 0}>➖</button>
                          <button className="action-icon-btn" onClick={() => openAdjustModal(item)} title="Adjust Stock">✏</button>
                          {role === "admin" && (
                            <button className="action-icon-btn" onClick={() => handleDeleteProduct(item.productId)} title="Delete Product" style={{ color: "#ef4444" }}>×</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock History Log (Recent Stock Changes) */}
      {!loading && logs.length > 0 && (
        <div style={{ marginTop: "48px" }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", marginBottom: "16px" }}>
            Recent Stock Changes
          </h3>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "12px 20px" }}>Product</th>
                  <th style={{ padding: "12px 20px" }}>SKU</th>
                  <th style={{ padding: "12px 20px" }}>Change</th>
                  <th style={{ padding: "12px 20px" }}>Staff Role</th>
                  <th style={{ padding: "12px 20px", textAlign: "right" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 600 }}>{log.name}</td>
                    <td style={{ padding: "12px 20px", fontFamily: "monospace" }}>{log.sku}</td>
                    <td style={{ padding: "12px 20px", fontWeight: 700, color: log.change.startsWith("-") ? "#ef4444" : "#10b981" }}>
                      {log.change}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ padding: "2px 6px", background: "var(--border)", borderRadius: "4px", fontSize: "9px", fontWeight: 700 }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", color: "var(--text-secondary)" }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Custom Stock Modal Overlay */}
      {isAdjustModalOpen && activeItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: "400px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "28px", fontWeight: 400, fontStyle: "italic" }}>
                Adjust Stock Quantity
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.4 }}>
              Set explicit stock level for: <strong style={{ color: "var(--text-primary)" }}>{activeItem.name}</strong>
            </p>

            <form onSubmit={handleCustomAdjustSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 600 }}>Units in Stock</label>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  required
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="adjust-cancel-btn">Cancel</button>
                <button type="submit" disabled={submitting} className="adjust-submit-btn">
                  {submitting ? "Updating..." : "Save Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
