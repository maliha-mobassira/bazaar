"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProducts, createProduct, updateProduct, deleteProduct, devImportProducts, Product } from "@/lib/api/products";
import { createInventory, updateInventory } from "@/lib/api/inventory";

const categoryMap: Record<string, string> = {
  "groceries": "Groceries",
  "smartphones": "Electronics",
  "laptops": "Electronics",
  "electronics": "Electronics",
  "home-decoration": "Home & Decor",
  "decor": "Home & Decor",
  "furniture": "Furniture",
  "beauty": "Beauty",
  "fragrances": "Beauty",
  "mens-shirts": "Apparel",
  "womens-dresses": "Apparel",
  "womens-shoes": "Apparel",
  "mens-shoes": "Apparel",
  "apparel": "Apparel",
  "accessories": "Accessories",
  "jewelry": "Accessories",
};

const categoryIcons: Record<string, string> = {
  "All": "✨",
  "Groceries": "🛒",
  "Electronics": "💻",
  "Apparel": "👕",
  "Home & Decor": "🏠",
  "Beauty": "💄",
  "Accessories": "👜",
  "Furniture": "🪑",
  "General": "📦",
};

export default function ProductsPage() {
  const { user } = useAuth();
  const role = user?.role || "cashier"; // admin, manager, cashier

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("category");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("groceries");
  const [stockQty, setStockQty] = useState(0);

  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImportDevProducts = async () => {
    try {
      setImporting(true);
      setError(null);
      await devImportProducts();
      fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to import dev products");
    } finally {
      setImporting(false);
    }
  };

  const getNormalizedCategory = (cat?: string) => {
    if (!cat) return "General";
    const c = cat.trim();
    return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const getCategoryIcon = (cat: string) => {
    if (categoryIcons[cat]) return categoryIcons[cat];
    const c = cat.toLowerCase();
    if (c.includes("fruit")) return "🍎";
    if (c.includes("veg")) return "🥗";
    if (c.includes("dairy") || c.includes("milk") || c.includes("cheese")) return "🥛";
    if (c.includes("bread") || c.includes("bake") || c.includes("cookie")) return "🍞";
    if (c.includes("staple") || c.includes("oil") || c.includes("honey")) return "🍯";
    if (c.includes("snack") || c.includes("chip") || c.includes("nut")) return "🍿";
    if (c.includes("drink") || c.includes("beverage") || c.includes("water") || c.includes("tea") || c.includes("coffee")) return "☕";
    if (c.includes("meat") || c.includes("fish") || c.includes("chicken") || c.includes("seafood")) return "🥩";
    if (c.includes("phone")) return "📱";
    if (c.includes("laptop") || c.includes("computer")) return "💻";
    if (c.includes("display") || c.includes("monitor")) return "🖥️";
    if (c.includes("keyboard") || c.includes("mouse")) return "⌨️";
    if (c.includes("headphone") || c.includes("audio") || c.includes("earbud")) return "🎧";
    if (c.includes("watch") || c.includes("wearable")) return "⌚";
    if (c.includes("smarthome") || c.includes("plug") || c.includes("light")) return "🔌";
    if (c.includes("camera") || c.includes("photo")) return "📷";
    if (c.includes("shirt")) return "👕";
    if (c.includes("pant") || c.includes("jean")) return "👖";
    if (c.includes("coat") || c.includes("jacket") || c.includes("outerwear")) return "🧥";
    if (c.includes("dress")) return "👗";
    if (c.includes("shoes") || c.includes("footwear") || c.includes("boot")) return "👟";
    if (c.includes("kid") || c.includes("baby") || c.includes("romper")) return "👶";
    if (c.includes("sport") || c.includes("activewear")) return "🎽";
    if (c.includes("living") || c.includes("sofa") || c.includes("armchair")) return "🛋️";
    if (c.includes("bed") || c.includes("mattress")) return "🛏️";
    if (c.includes("office") || c.includes("desk") || c.includes("chair")) return "🪑";
    if (c.includes("dining")) return "🍽️";
    if (c.includes("patio") || c.includes("outdoor")) return "🏡";
    if (c.includes("light") || c.includes("lamp")) return "💡";
    if (c.includes("art") || c.includes("frame") || c.includes("sculpture")) return "🖼️";
    if (c.includes("rug") || c.includes("carpet")) return "🎴";
    if (c.includes("linen") || c.includes("sheet") || c.includes("pillow")) return "🛏️";
    if (c.includes("kitchen") || c.includes("cook")) return "🍳";
    if (c.includes("candle") || c.includes("fragrance")) return "🕯️";
    if (c.includes("mirror") || c.includes("shelf")) return "🪞";
    if (c.includes("skin") || c.includes("cream") || c.includes("serum")) return "🧴";
    if (c.includes("hair") || c.includes("shampoo")) return "🧼";
    if (c.includes("makeup") || c.includes("lipstick")) return "💄";
    if (c.includes("perfume")) return "🌸";
    if (c.includes("bath") || c.includes("bomb")) return "🧽";
    if (c.includes("bag") || c.includes("backpack")) return "🎒";
    if (c.includes("jewelry") || c.includes("ring")) return "💍";
    if (c.includes("hat") || c.includes("cap") || c.includes("beanie")) return "🎩";
    if (c.includes("sunglass") || c.includes("eyewear")) return "🕶️";
    if (c.includes("belt") || c.includes("wallet")) return "💳";
    if (c.includes("stationery") || c.includes("notebook")) return "📝";
    if (c.includes("workout") || c.includes("fitness")) return "💪";
    return "📦";
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const result = await createProduct(name, sku, price, image || undefined, category || undefined);
      const newProd = result[0];
      
      // Auto create inventory record for new product
      if (newProd && stockQty > 0) {
        await createInventory(newProd.id, stockQty);
      }
      
      setName("");
      setSku("");
      setPrice("");
      setImage("");
      setCategory("groceries");
      setStockQty(0);
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (p: Product) => {
    setActiveProduct(p);
    setName(p.name);
    setSku(p.sku);
    setPrice(p.price);
    setImage(p.image || "");
    setCategory(p.category || "groceries");
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setSubmitting(true);
    setModalError(null);

    try {
      await updateProduct(activeProduct.id, name, sku, price, image || undefined, category || undefined);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || "Failed to update product details");
    } finally {
      setSubmitting(false);
    }
  };

  const openStockModal = (p: Product) => {
    setActiveProduct(p);
    setStockQty(p.quantity || 0);
    setIsStockModalOpen(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setSubmitting(true);
    setModalError(null);

    try {
      if (activeProduct.quantity === undefined || activeProduct.quantity === null) {
        await createInventory(activeProduct.id, stockQty);
      } else {
        await updateInventory(activeProduct.id, stockQty);
      }
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || "Failed to update stock quantity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) return;

    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete selected items");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Stock status text & color resolver
  const getStockStatus = (qty?: number | null) => {
    if (qty === undefined || qty === null || qty === 0) return { label: "Out of Stock", badge: "🔴 Out of Stock", color: "#ef4444" };
    if (qty < 5) return { label: "Critical", badge: "🔴 Critical (<5)", color: "#ef4444" };
    if (qty <= 20) return { label: "Low", badge: "⚠ Low (5-20)", color: "#f59e0b" };
    return { label: "In Stock", badge: "✅ In Stock (>20)", color: "#10b981" };
  };

  // Sorting & Filtering implementation
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      
      const normalizedCat = getNormalizedCategory(p.category);
      const matchCategory = selectedCategory === "All" || normalizedCat === selectedCategory;

      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-low-high") return Number(a.price) - Number(b.price);
      if (sortBy === "price-high-low") return Number(b.price) - Number(a.price);
      if (sortBy === "category") return getNormalizedCategory(a.category).localeCompare(getNormalizedCategory(b.category));
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });

  // Dynamically compute the category list from unique categories in products database
  const categoriesList = ["All", ...Array.from(new Set(products.map(p => getNormalizedCategory(p.category))))].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 1s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .control-bar {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .search-input {
          padding: 10px 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          border-radius: 8px;
          outline: none;
          min-width: 260px;
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
          transition: all 0.3s;
        }
        .select-filter:focus {
          border-color: var(--text-primary);
        }
        .view-btn {
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          fontWeight: 600;
        }
        .view-btn.active {
          background: var(--text-primary);
          color: var(--bg);
          border-color: var(--text-primary);
        }
        .pill-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }
        .pill {
          padding: 8px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
        .pill:hover:not(.active) {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .product-grid { grid-template-columns: 1fr; }
        }
        .product-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .product-card:hover {
          transform: translateY(-4px);
          border-color: var(--text-primary);
          box-shadow: 0 16px 36px rgba(0,0,0,0.03);
        }
        .img-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
        }
        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .product-card:hover .product-img {
          transform: scale(1.03);
        }
        .form-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-secondary);
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
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
          transition: border-color 0.3s;
        }
        .form-input:focus {
          border-bottom-color: var(--text-primary);
        }
        .action-button {
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          transition: all 0.3s;
        }
        .action-button.primary {
          background: var(--text-primary);
          color: var(--bg);
          border-color: var(--text-primary);
        }
        .action-button.primary:hover {
          opacity: 0.85;
        }
        .action-button:hover:not(.primary) {
          border-color: var(--text-primary);
        }
        .skeleton-pulse {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          height: 280px;
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Header section */}
      <header
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
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
            Store Catalog
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
            Product <i>Catalog</i>.
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
            Manage and organize your store inventory catalog.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {role === "admin" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                padding: "12px 24px",
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                cursor: "pointer",
                transition: "opacity 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Add Product
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: "16px",
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            borderRadius: "8px",
            marginBottom: "32px",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Control Bar (Search, Sort, View Toggle) */}
      <div className="control-bar">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="category">Product Category</option>
            <option value="newest">Newest Added</option>
            <option value="price-low-high">Price: Low → High</option>
            <option value="price-high-low">Price: High → Low</option>
          </select>
        </div>

        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          <button
            className={`view-btn ${viewMode === "card" ? "active" : ""}`}
            onClick={() => setViewMode("card")}
          >
            Cards
          </button>
          <button
            className={`view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="pill-bar">
        {categoriesList.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              className={`pill ${isActive ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedIds([]); // reset selection
              }}
            >
              <span style={{ marginRight: "6px" }}>{getCategoryIcon(cat)}</span>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Bulk actions strip (visible to admin when selections exist) */}
      {role === "admin" && selectedIds.length > 0 && (
        <div
          style={{
            background: "var(--accent-light)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            {selectedIds.length} items selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            style={{
              padding: "8px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.3s",
            }}
          >
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      {/* Products Display catalog */}
      {loading ? (
        <div className="product-grid">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "80px 40px",
            textAlign: "center",
            color: "var(--text-secondary)",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "28px",
              color: "var(--text-primary)",
              marginBottom: "16px",
              fontStyle: "italic",
            }}
          >
            No products found matching filters.
          </p>
          {role === "admin" ? (
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <button className="action-button primary" onClick={() => setIsAddModalOpen(true)}>Add Product</button>
              <button className="action-button" onClick={handleImportDevProducts} disabled={importing}>
                {importing ? "Importing..." : "Import Dev Products"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "14px" }}>Please check back later or modify your search terms.</p>
          )}
        </div>
      ) : viewMode === "card" ? (
        // CARD VIEW GRID
        <div className="product-grid">
          {filteredProducts.map((p) => {
            const stockInfo = getStockStatus(p.quantity);
            const normalizedCat = getNormalizedCategory(p.category);
            const icon = getCategoryIcon(normalizedCat);
            
            return (
              <div key={p.id} className="product-card">
                <div className="img-wrapper">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="product-img" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>📦</div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {icon} {normalizedCat}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: stockInfo.color }}>
                      {stockInfo.label}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "4px 0 0 0", minHeight: "36px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.3 }}>
                    {p.name}
                  </h3>
                  
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    SKU: {p.sku}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "4px" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                      ${Number(p.price).toFixed(2)}
                    </span>
                    
                    {/* Stock level indicators */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                      <div style={{ width: "60px", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", background: stockInfo.color, width: `${Math.min(100, ((p.quantity || 0) / 40) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: "9px", color: "var(--text-secondary)", fontWeight: 600 }}>
                        {p.quantity || 0} units
                      </span>
                    </div>
                  </div>

                  {/* Actions based on role */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {role === "admin" && (
                      <>
                        <button className="action-button" onClick={() => openEditModal(p)} style={{ padding: "6px 10px" }}>Edit</button>
                        <button className="action-button" onClick={() => handleDeleteProduct(p.id)} style={{ padding: "6px 10px" }}>Remove</button>
                      </>
                    )}
                    {role === "manager" && (
                      <button className="action-button" onClick={() => openStockModal(p)} style={{ padding: "6px 10px" }}>Adjust Stock</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // TABLE VIEW DATA MODE
        <div className="responsive-table-container" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", opacity: 0.9 }}>
                {role === "admin" && (
                  <th style={{ padding: "16px 20px", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                )}
                <th style={{ padding: "16px 20px", width: "60px" }}>Image</th>
                <th style={{ padding: "16px 20px" }}>SKU</th>
                <th style={{ padding: "16px 20px" }}>Name</th>
                <th style={{ padding: "16px 20px" }}>Category</th>
                <th style={{ padding: "16px 20px" }}>Price</th>
                <th style={{ padding: "16px 20px" }}>Stock</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                {(role === "admin" || role === "manager") && (
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const stockInfo = getStockStatus(p.quantity);
                const normalizedCat = getNormalizedCategory(p.category);
                const icon = getCategoryIcon(normalizedCat);
                const isSelected = selectedIds.includes(p.id);

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "var(--accent-light)" : "transparent",
                    }}
                  >
                    {role === "admin" && (
                      <td style={{ padding: "16px 20px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(p.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                    )}
                    <td style={{ padding: "12px 20px" }}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                        />
                      ) : (
                        <div style={{ width: "36px", height: "36px", background: "var(--accent-light)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{p.sku}</td>
                    <td style={{ padding: "16px 20px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</td>
                    <td style={{ padding: "16px 20px" }}>{icon} {normalizedCat}</td>
                    <td style={{ padding: "16px 20px", fontWeight: 600 }}>${Number(p.price).toFixed(2)}</td>
                    <td style={{ padding: "16px 20px", fontWeight: 600 }}>{p.quantity || 0} units</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: stockInfo.color }}>
                        {stockInfo.label}
                      </span>
                    </td>
                    {(role === "admin" || role === "manager") && (
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {role === "admin" && (
                            <>
                              <button className="action-button" onClick={() => openEditModal(p)}>Edit</button>
                              <button className="action-button" onClick={() => handleDeleteProduct(p.id)}>Remove</button>
                            </>
                          )}
                          {role === "manager" && (
                            <button className="action-button" onClick={() => openStockModal(p)}>Adjust Stock</button>
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

      {/* Add Product Modal Overlay */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: "460px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "28px", fontWeight: 400, fontStyle: "italic" }}>
                Add New Product
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            {modalError && (
              <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#ef4444", borderRadius: "8px", marginBottom: "24px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label className="form-label">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Single-Origin Beans" required disabled={submitting} className="form-input" />
              </div>
              <div>
                <label className="form-label">Product SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="BEANS-ACME-500G" required disabled={submitting} className="form-input" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Price ($)</label>
                  <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19.99" required disabled={submitting} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Initial Stock</label>
                  <input type="number" min="0" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} placeholder="50" required disabled={submitting} className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-filter" style={{ width: "100%", background: "transparent" }}>
                  <option value="groceries">Groceries</option>
                  <option value="smartphones">Smartphones / Gadgets</option>
                  <option value="laptops">Laptops / Electronics</option>
                  <option value="home-decoration">Home Decor</option>
                  <option value="furniture">Furniture</option>
                  <option value="beauty">Beauty</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="form-label">Image URL</label>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" disabled={submitting} className="form-input" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="action-button">Cancel</button>
                <button type="submit" disabled={submitting} className="action-button primary">{submitting ? "Creating..." : "Confirm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal Overlay */}
      {isEditModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: "460px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "28px", fontWeight: 400, fontStyle: "italic" }}>
                Edit Product Entry
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            {modalError && (
              <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#ef4444", borderRadius: "8px", marginBottom: "24px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditProduct} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label className="form-label">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} className="form-input" />
              </div>
              <div>
                <label className="form-label">Product SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required disabled={submitting} className="form-input" />
              </div>
              <div>
                <label className="form-label">Price ($)</label>
                <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required disabled={submitting} className="form-input" />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-filter" style={{ width: "100%", background: "transparent" }}>
                  <option value="groceries">Groceries</option>
                  <option value="smartphones">Smartphones / Gadgets</option>
                  <option value="laptops">Laptops / Electronics</option>
                  <option value="home-decoration">Home Decor</option>
                  <option value="furniture">Furniture</option>
                  <option value="beauty">Beauty</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="form-label">Image URL</label>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} disabled={submitting} className="form-input" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="action-button">Cancel</button>
                <button type="submit" disabled={submitting} className="action-button primary">{submitting ? "Saving..." : "Confirm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Inventory Stock Modal Overlay */}
      {isStockModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: "400px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "28px", fontWeight: 400, fontStyle: "italic" }}>
                Adjust Inventory Stock
              </h3>
              <button onClick={() => setIsStockModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-secondary)" }}>×</button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.4 }}>
              Adjusting stock counts for: <strong style={{ color: "var(--text-primary)" }}>{activeProduct?.name}</strong>
            </p>

            {modalError && (
              <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#ef4444", borderRadius: "8px", marginBottom: "24px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateStock} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label className="form-label">Available Stock Quantity (Units)</label>
                <input type="number" min="0" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} required disabled={submitting} className="form-input" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="action-button">Cancel</button>
                <button type="submit" disabled={submitting} className="action-button primary">{submitting ? "Updating..." : "Confirm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
