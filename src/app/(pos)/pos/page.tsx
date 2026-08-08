"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { getProducts, Product } from "@/lib/api/products";
import { createSale } from "@/lib/api/sales";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CheckoutPage() {
  const { user, impersonateRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customer CRM & Checkout inputs
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Shift totals (mocked/persisted in state)
  const [shiftSales, setShiftSales] = useState(0);
  const [shiftTransactions, setShiftTransactions] = useState(0);

  // Receipt Modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState<{
    id: string;
    total: number;
    subtotal: number;
    discount: number;
    items: { name: string; quantity: number; price: number }[];
    customerName?: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch catalog products
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load catalog products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 2. Add to Cart
  const handleAddToCart = (product: Product) => {
    // Check if stock is available
    const existing = cart.find((item) => item.product.id === product.id);
    const cartQty = existing ? existing.quantity : 0;
    
    // If quantity in product stock is <= cartQty, warn (except if quantity is not tracked/undefined)
    if (product.quantity !== undefined && product.quantity !== null && product.quantity <= cartQty) {
      alert(`Cannot add more. Only ${product.quantity} units left in stock.`);
      return;
    }

    setCart((prevCart) => {
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // 3. Update quantity inside cart
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (delta > 0) {
      const product = products.find((p) => p.id === productId);
      if (product && product.quantity !== undefined && product.quantity !== null && product.quantity <= item.quantity) {
        alert(`Cannot add more. Only ${product.quantity} units left in stock.`);
        return;
      }
    }

    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // 4. Complete checkout
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const discountAmount = Number(discountInput) || 0;
      const subtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
      const total = Math.max(0, subtotal - discountAmount);

      const sale = await createSale(itemsPayload, {
        discountAmount,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });

      // Update Cashier Shift Summary values
      setShiftSales((prev) => prev + total);
      setShiftTransactions((prev) => prev + 1);

      // Save sale details for receipt display modal
      setLastSaleDetails({
        id: sale.id,
        total,
        subtotal,
        discount: discountAmount,
        customerName: customerName.trim() || undefined,
        items: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.product.price)
        }))
      });

      // Reset cart and checkout details
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountInput("");
      
      // Open receipt modal
      setIsReceiptOpen(true);
      
      // Refresh local product list to update stock level markers
      fetchCatalog();
    } catch (err: any) {
      alert(err.message || "Transaction failed during checkout processing.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const discountAmount = Number(discountInput) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filters mapping
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getNormalizedCategory = (cat?: string) => {
    if (!cat) return "General";
    const c = cat.trim();
    return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => getNormalizedCategory(p.category))))].sort();
  const displayedProducts = filtered.filter(
    (p) => selectedCategory === "all" || getNormalizedCategory(p.category) === selectedCategory
  );

  // Stock status resolver
  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", color: "#ef4444" };
    if (qty < 10) return { label: "Critical", color: "#dc2626" };
    if (qty <= 20) return { label: "Low", color: "#d97706" };
    return { label: "In Stock", color: "#10b981" };
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg)",
        fontFamily: "'Inter', sans-serif",
        transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}
    >
      <style>{`
        .product-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-radius: 16px;
        }
        .product-card:hover {
          transform: translateY(-4px);
          border-color: var(--text-primary) !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.04) !important;
        }
        .product-card img {
          transition: transform 0.5s ease !important;
        }
        .product-card:hover img {
          transform: scale(1.04);
        }
        .scrollable-capsules {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .scrollable-capsules::-webkit-scrollbar {
          height: 4px;
        }
        .scrollable-capsules::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
        .receipt-line {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          border-bottom: 1px dashed var(--border);
          padding: 8px 0;
        }
        @media (max-width: 960px) {
          .checkout-main {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .cart-sidebar {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--border) !important;
            height: auto !important;
          }
        }
      `}</style>

      {/* Top Header Panel */}
      <header
        style={{
          height: "72px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          transition: "all 0.4s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "var(--text-primary)",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              padding: "10px 18px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            ← Back to Store
          </Link>
          <Logo size={26} direction="row" />
          <span
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--text-secondary)",
              fontWeight: 600,
              borderLeft: "1px solid var(--border)",
              paddingLeft: "24px",
            }}
          >
            Checkout Terminal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderRight: "1px solid var(--border)", paddingRight: "20px" }}>
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", fontWeight: 700 }}>
              Role Toggle:
            </span>
            <select
              value={user?.role || "admin"}
              onChange={(e) => impersonateRole(e.target.value)}
              style={{
                padding: "6px 12px",
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                outline: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Checkout Container */}
      <div className="checkout-main" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left Column: Product Grid Selector */}
        <div
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Search bar & Category capsules filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search register products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 18px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                borderRadius: "8px",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--text-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />

            {/* Scrollable Category Capsules */}
            {categories.length > 1 && (
              <div className="scrollable-capsules">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat.toLowerCase())}
                      style={{
                        padding: "8px 16px",
                        background: isActive ? "var(--text-primary)" : "var(--surface)",
                        color: isActive ? "var(--bg)" : "var(--text-secondary)",
                        border: "1px solid " + (isActive ? "var(--text-primary)" : "var(--border)"),
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catalog Loading/Empty Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "24px" }}>
              {Array(6).fill(0).map((_, idx) => (
                <div key={idx} style={{ height: "260px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px" }} />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--text-secondary)", border: "1px solid var(--border)", background: "var(--surface)", borderRadius: "16px" }}>
              No matching products found in store catalog.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "24px",
                paddingBottom: "32px",
              }}
            >
              {displayedProducts.map((product) => {
                const stock = getStockStatus(product.quantity ?? 0);
                return (
                  <div
                    key={product.id}
                    className="product-card"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    {/* Card Cover image */}
                    <div
                      style={{
                        height: "140px",
                        background: "var(--bg)",
                        position: "relative",
                        borderBottom: "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--text-secondary)" }}>📦</div>
                      )}
                      
                      {/* Stock indicator badge */}
                      <span
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          padding: "3px 8px",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          fontSize: "8px",
                          fontWeight: 700,
                          color: stock.color,
                        }}
                      >
                        {stock.label} ({product.quantity ?? 0})
                      </span>
                    </div>

                    {/* Description Details */}
                    <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "9px", color: "var(--text-secondary)" }}>{product.sku}</span>
                      <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, lineClamp: 2 }}>{product.name}</h4>
                      
                      {/* Stock mini indicator progress bar */}
                      <div style={{ width: "100%", height: "3px", background: "var(--border)", borderRadius: "1px", overflow: "hidden", marginTop: "4px" }}>
                        <div style={{ height: "100%", background: stock.color, width: `${Math.min(100, ((product.quantity ?? 0) / 40) * 100)}%` }} />
                      </div>

                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "auto", paddingTop: "8px" }}>
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Add to Cart checkout button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity === 0}
                      style={{
                        border: "none",
                        borderTop: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-primary)",
                        padding: "12px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        cursor: product.quantity === 0 ? "not-allowed" : "pointer",
                        opacity: product.quantity === 0 ? 0.4 : 1,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (product.quantity !== 0) {
                          e.currentTarget.style.background = "var(--text-primary)";
                          e.currentTarget.style.color = "var(--bg)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                    >
                      {product.quantity === 0 ? "Out of Stock" : "Add to Order"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Cart Order summary */}
        <div
          className="cart-sidebar"
          style={{
            width: "400px",
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            transition: "all 0.4s",
          }}
        >
          {/* Shift Sales stats widget */}
          <div
            style={{
              padding: "14px 24px",
              background: "var(--accent-light)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>Shift Sales: <strong style={{ color: "var(--text-primary)" }}>${shiftSales.toFixed(2)}</strong></span>
            <span>Transactions: <strong style={{ color: "var(--text-primary)" }}>{shiftTransactions}</strong></span>
          </div>

          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", margin: 0 }}>
              Order Basket
            </h3>
          </div>

          {/* Cart item elements */}
          <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", textAlign: "center" }}>
                <span style={{ fontSize: "32px", marginBottom: "12px" }}>🛒</span>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--text-primary)" }}>
                  Basket is Empty
                </span>
                <span style={{ fontSize: "12px", marginTop: "4px", color: "var(--text-secondary)", maxWidth: "200px" }}>
                  Select items from the catalog grid to compile checkout.
                </span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "180px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{item.product.name}</span>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      ${Number(item.product.price).toFixed(2)} each
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Plus/minus buttons */}
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "6px" }}>
                      <button onClick={() => handleUpdateQuantity(item.product.id, -1)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>-</button>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "0 2px" }}>{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.product.id, 1)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>+</button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "16px", cursor: "pointer", padding: "4px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer details input capsule */}
          <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg)" }}>
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", fontWeight: 700 }}>Customer CRM & Discount</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "12px", borderRadius: "6px", outline: "none" }}
              />
              <input
                type="text"
                placeholder="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "12px", borderRadius: "6px", outline: "none" }}
              />
            </div>
            <input
              type="number"
              placeholder="Discount Amount ($)"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "12px", borderRadius: "6px", outline: "none" }}
              min="0"
              step="0.01"
            />
          </div>

          {/* Checkout Totals & complete sale */}
          <div style={{ padding: "24px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
                <span>Subtotal:</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444" }}>
                  <span>Discount Applied:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                <span>Total Due:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitting}
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                cursor: cart.length === 0 || submitting ? "not-allowed" : "pointer",
                opacity: cart.length === 0 || submitting ? 0.5 : 1,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Processing Checkout..." : "Complete Checkout"}
            </button>
          </div>
        </div>

      </div>

      {/* Checkout Receipt Dialog Modal */}
      {isReceiptOpen && lastSaleDetails && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: "420px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <div style={{ textHeading: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "20px", textAlign: "center" }}>
              <Logo size={24} />
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "28px", fontWeight: 400, fontStyle: "italic", margin: "12px 0 4px 0" }}>
                Sale Completed
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace", textTransform: "uppercase" }}>
                Receipt: {lastSaleDetails.id.toUpperCase()}
              </span>
            </div>

            {/* Receipt Table Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
              {lastSaleDetails.items.map((itm, idx) => (
                <div key={idx} className="receipt-line">
                  <span>{itm.name} (x{itm.quantity})</span>
                  <span>${(itm.price * itm.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations summaries */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span>Subtotal:</span>
                <span>${lastSaleDetails.subtotal.toFixed(2)}</span>
              </div>
              {lastSaleDetails.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ef4444" }}>
                  <span>Discount:</span>
                  <span>-${lastSaleDetails.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                <span>Paid Total:</span>
                <span>${lastSaleDetails.total.toFixed(2)}</span>
              </div>
              {lastSaleDetails.customerName && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "8px" }}>
                  <span>Customer:</span>
                  <span>{lastSaleDetails.customerName}</span>
                </div>
              )}
            </div>

            {/* Receipts controls buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { alert("Receipt sent to printer spooler."); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--text-primary)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
