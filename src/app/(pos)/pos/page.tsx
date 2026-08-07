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
  const [checkoutStatus, setCheckoutStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountInput, setDiscountInput] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch catalog products on mount
  useEffect(() => {
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
    fetchCatalog();

    // Auto-focus search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 2. Cart Operations
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
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

  // 3. Complete checkout sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setCheckoutStatus(null);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const sale = await createSale(itemsPayload, {
        discountAmount: Number(discountInput) || 0,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountInput("");
      setCheckoutStatus({
        success: true,
        message: `✅ Sale completed successfully. Receipt ID: ${sale.id.slice(0, 8).toUpperCase()}`,
      });

      // Clear success banner after 4 seconds
      setTimeout(() => setCheckoutStatus(null), 4000);
    } catch (err: any) {
      setCheckoutStatus({
        success: false,
        message: err.message || "Transaction failed during checkout processing.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const discountAmount = Number(discountInput) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 5. Filters
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c)))];
  const displayedProducts = filtered.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

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
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .product-card:hover {
          transform: translateY(-4px);
          border-color: var(--text-primary) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.02) !important;
        }
        .product-card img {
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .product-card:hover img {
          transform: scale(1.05);
        }
        @media (max-width: 900px) {
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
          transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "var(--text-primary)",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              padding: "10px 18px",
              border: "1px solid var(--border)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            ← Dashboard
          </Link>
          <Logo size={26} direction="row" />
          <span
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--text-secondary)",
              fontWeight: 500,
              borderLeft: "1px solid var(--border)",
              paddingLeft: "24px",
            }}
          >
            Checkout Terminal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderRight: "1px solid var(--border)", paddingRight: "20px" }}>
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", fontWeight: 600 }}>
              Simulate:
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
                borderRadius: "0px",
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

      {/* Main Container */}
      <div className="checkout-main" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left Side: Product Catalog */}
        <div
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          {/* Search and Category Filter Capsule row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search catalog by SKU or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                borderRadius: "0px",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--text-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />

            {/* Category Capsules */}
            {categories.length > 1 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "8px 16px",
                        background: isActive ? "var(--text-primary)" : "var(--surface)",
                        color: isActive ? "var(--bg)" : "var(--text-secondary)",
                        border: "1px solid " + (isActive ? "var(--text-primary)" : "var(--border)"),
                        borderRadius: "0px",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        cursor: "pointer",
                        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catalog grid */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px",
                color: "var(--text-secondary)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              Loading register catalog...
            </div>
          ) : error ? (
            <div
              style={{
                padding: "16px",
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              No matching products found.
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
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "0px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {/* Image container */}
                  <div
                    style={{
                      height: "150px",
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
                          transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-secondary)",
                        }}
                      >
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "9px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {product.sku}
                    </span>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        lineHeight: 1.3,
                        margin: 0,
                      }}
                    >
                      {product.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginTop: "auto",
                        paddingTop: "6px",
                      }}
                    >
                      ${Number(product.price).toFixed(2)}
                    </span>
                  </div>

                  {/* Add action */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-primary)",
                      padding: "12px",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--text-primary)";
                      e.currentTarget.style.color = "var(--bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Cart Panel */}
        <div
          className="cart-sidebar"
          style={{
            width: "420px",
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            transition: "background 0.8s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "22px", fontWeight: 400, fontStyle: "italic", margin: 0 }}>
              Current Selection
            </h3>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>
              {totalItemsCount} items
            </span>
          </div>

          {/* Cart list panel */}
          <div
            style={{
              flex: 1,
              padding: "24px 32px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                <span style={{ fontSize: "36px", marginBottom: "16px", display: "block" }}>🛒</span>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, display: "block", color: "var(--text-primary)" }}>
                  Your cart is empty
                </span>
                <span style={{ fontSize: "12px", marginTop: "6px", color: "var(--text-secondary)", maxWidth: "240px", lineHeight: 1.4 }}>
                  Search and add products from the catalog to start checkout.
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
                    paddingBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "200px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {item.product.name}
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      {item.product.sku} (${Number(item.product.price).toFixed(2)})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Controls */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-primary)",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "0 4px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-primary)",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px",
                      }}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Feedback/Status overlay banner */}
          {checkoutStatus && (
            <div
              style={{
                margin: "0 32px 16px 32px",
                padding: "12px 16px",
                background: checkoutStatus.success ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                border: "1px solid " + (checkoutStatus.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"),
                color: checkoutStatus.success ? "#10b981" : "#ef4444",
                fontSize: "12px",
                letterSpacing: "0.02em",
              }}
            >
              {checkoutStatus.message}
            </div>
          )}

          {/* Customer CRM & Discount Inputs */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "var(--bg)",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--text-secondary)",
                fontWeight: 600,
                display: "block",
              }}
            >
              Customer & Discount Details
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  outline: "none",
                  borderRadius: "0px",
                }}
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  outline: "none",
                  borderRadius: "0px",
                }}
              />
            </div>
            <input
              type="number"
              placeholder="Discount Amount ($)"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-primary)",
                fontSize: "12px",
                outline: "none",
                borderRadius: "0px",
              }}
              min="0"
              step="0.01"
            />
          </div>

          {/* Checkout Totals & Button */}
          <div
            style={{
              padding: "32px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Subtotal:</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#ef4444",
                  }}
                >
                  <span>Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "16px",
                  marginTop: "6px",
                }}
              >
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitting}
              style={{
                width: "100%",
                padding: "16px",
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "0px",
                fontWeight: 600,
                cursor: cart.length === 0 || submitting ? "not-allowed" : "pointer",
                opacity: cart.length === 0 || submitting ? 0.5 : 1,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                if (cart.length > 0 && !submitting) e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                if (cart.length > 0 && !submitting) e.currentTarget.style.opacity = "1";
              }}
            >
              {submitting ? "Processing Transaction..." : "Complete Checkout"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
