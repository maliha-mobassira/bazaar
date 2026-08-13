"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { getProducts, Product } from "@/lib/api/products";
import { createSale } from "@/lib/api/sales";
import { useAuth } from "@/context/AuthContext";
import InvoiceModal from "@/components/InvoiceModal";
import { InvoiceData } from "@/components/InvoiceView";

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

  // Mobile tab state (catalog vs cart)
  const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart">("catalog");

  // Receipt Modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isFullInvoiceOpen, setIsFullInvoiceOpen] = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState<{
    id: string;
    total: number;
    subtotal: number;
    discount: number;
    items: { name: string; quantity: number; price: number }[];
    customerName?: string;
    customerPhone?: string;
    date: string;
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
    const existing = cart.find((item) => item.product.id === product.id);
    const cartQty = existing ? existing.quantity : 0;
    
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

      setShiftSales((prev) => prev + total);
      setShiftTransactions((prev) => prev + 1);

      setLastSaleDetails({
        id: sale.id,
        total,
        subtotal,
        discount: discountAmount,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        date: new Date().toLocaleString(),
        items: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.product.price)
        }))
      });

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountInput("");
      
      setIsReceiptOpen(true);
      fetchCatalog();
    } catch (err: any) {
      alert(err.message || "Transaction failed during checkout processing.");
    } finally {
      setSubmitting(false);
    }
  };

  // Print invoice handler
  const handlePrintInvoice = () => {
    window.print();
  };

  // Cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const discountAmount = Number(discountInput) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
        .mobile-tab-bar {
          display: none;
        }

        /* Print Media Styling for Invoice/Receipt */
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-invoice-modal, .printable-invoice-modal * {
            visibility: visible;
          }
          .printable-invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }

        @media (max-width: 960px) {
          .checkout-main {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .mobile-tab-bar {
            display: flex !important;
          }
          .catalog-section {
            display: ${activeMobileTab === "catalog" ? "flex" : "none"} !important;
            width: 100% !important;
            padding: 16px !important;
          }
          .cart-sidebar {
            display: ${activeMobileTab === "cart" ? "flex" : "none"} !important;
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--border) !important;
            height: auto !important;
            padding: 20px !important;
          }
        }
      `}</style>

      <header
        className="no-print"
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
              Role:
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

      <div
        className="mobile-tab-bar no-print"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "8px 16px",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setActiveMobileTab("catalog")}
          style={{
            flex: 1,
            padding: "10px",
            background: activeMobileTab === "catalog" ? "var(--text-primary)" : "transparent",
            color: activeMobileTab === "catalog" ? "var(--bg)" : "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          📦 Catalog
        </button>
        <button
          onClick={() => setActiveMobileTab("cart")}
          style={{
            flex: 1,
            padding: "10px",
            background: activeMobileTab === "cart" ? "var(--text-primary)" : "transparent",
            color: activeMobileTab === "cart" ? "var(--bg)" : "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          🛒 Cart ({totalItemsCount})
        </button>
      </div>

      <div className="checkout-main no-print" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          className="catalog-section"
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search register products..."
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
              }}
            />
          </div>

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
                  }}
                >
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
                      <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>
                    )}
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

                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", fontWeight: 600 }}>
                        {getNormalizedCategory(product.category)}
                      </span>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "4px 0 2px 0", lineHeight: 1.3 }}>
                        {product.name}
                      </h3>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                        SKU: {product.sku}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

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
                      cursor: product.quantity === 0 ? "not-allowed" : "pointer",
                      opacity: product.quantity === 0 ? 0.4 : 1,
                    }}
                  >
                    {product.quantity === 0 ? "Out of Stock" : "Add to Order"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

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
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "24px", fontWeight: 400, margin: 0 }}>
                Order Summary
              </h2>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", fontWeight: 600 }}>
                {totalItemsCount} items in cart
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear Cart
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", gap: "12px", opacity: 0.6 }}>
                <span style={{ fontSize: "40px" }}>🛒</span>
                <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.product.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      ${Number(item.product.price).toFixed(2)} each
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--surface)" }}>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        style={{ width: "28px", height: "28px", border: "none", background: "transparent", color: "var(--text-primary)", cursor: "pointer", fontWeight: 700 }}
                      >
                        -
                      </button>
                      <span style={{ padding: "0 8px", fontSize: "12px", fontWeight: 700 }}>{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        style={{ width: "28px", height: "28px", border: "none", background: "transparent", color: "var(--text-primary)", cursor: "pointer", fontWeight: 700 }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", padding: "4px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px", background: "var(--surface)" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-primary)",
                  fontSize: "11px",
                  borderRadius: "6px",
                  outline: "none",
                }}
              />
              <input
                type="number"
                placeholder="Discount ($)"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                style={{
                  width: "90px",
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-primary)",
                  fontSize: "11px",
                  borderRadius: "6px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ padding: "24px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ef4444" }}>
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
                <span>Total Due</span>
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
              }}
            >
              {submitting ? "Processing..." : "Complete Checkout"}
            </button>
          </div>
        </div>
      </div>

      {isReceiptOpen && lastSaleDetails && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="printable-invoice-modal" style={{ width: "100%", maxWidth: "440px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
            
            <div style={{ borderBottom: "2px dashed var(--border)", paddingBottom: "20px", marginBottom: "20px", textAlign: "center" }}>
              <Logo size={28} />
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "32px", fontWeight: 400, fontStyle: "italic", margin: "12px 0 4px 0" }}>
                Official Sales Receipt
              </h2>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "monospace", textTransform: "uppercase", display: "block" }}>
                INVOICE #: {lastSaleDetails.id.toUpperCase()}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
                {lastSaleDetails.date}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {lastSaleDetails.items.map((itm, idx) => (
                <div key={idx} className="receipt-line" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                  <span style={{ fontWeight: 600 }}>{itm.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>(x{itm.quantity})</span></span>
                  <span style={{ fontFamily: "monospace" }}>${(itm.price * itm.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px", background: "var(--bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span>Subtotal:</span>
                <span style={{ fontFamily: "monospace" }}>${lastSaleDetails.subtotal.toFixed(2)}</span>
              </div>
              {lastSaleDetails.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ef4444" }}>
                  <span>Discount:</span>
                  <span style={{ fontFamily: "monospace" }}>-${lastSaleDetails.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
                <span>PAID TOTAL:</span>
                <span style={{ fontFamily: "monospace" }}>${lastSaleDetails.total.toFixed(2)}</span>
              </div>
              {lastSaleDetails.customerName && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "8px", borderTop: "1px dashed var(--border)", paddingTop: "6px" }}>
                  <span>Customer:</span>
                  <span>{lastSaleDetails.customerName}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "24px", fontStyle: "italic" }}>
              Thank you for shopping at Bazaar Retail Group!
            </div>

            <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsFullInvoiceOpen(true)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--accent-light, rgba(59, 130, 246, 0.1))",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  📜 Full Invoice
                </button>
                <button
                  onClick={handlePrintInvoice}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "transparent",
                    border: "1px solid var(--text-primary)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  🖨️ Quick Print
                </button>
              </div>

              <button
                onClick={() => setIsReceiptOpen(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--text-primary)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Full Invoice Modal */}
      {lastSaleDetails && (
        <InvoiceModal
          isOpen={isFullInvoiceOpen}
          onClose={() => setIsFullInvoiceOpen(false)}
          invoice={{
            id: lastSaleDetails.id,
            invoiceNumber: `INV-${lastSaleDetails.id.slice(0, 8).toUpperCase()}`,
            createdAt: new Date().toISOString(),
            customerName: lastSaleDetails.customerName || "Walk-in Customer",
            customerPhone: lastSaleDetails.customerPhone || "N/A",
            cashierEmail: user?.email || "Store Cashier",
            subtotal: lastSaleDetails.subtotal,
            discountAmount: lastSaleDetails.discount,
            totalAmount: lastSaleDetails.total,
            itemCount: lastSaleDetails.items.reduce((s, i) => s + i.quantity, 0),
            items: lastSaleDetails.items.map((i, idx) => ({
              productId: `prod-${idx}`,
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.price,
              lineTotal: i.price * i.quantity,
            })),
            storeName: "Bazaar Retail Group",
            status: "Paid",
          }}
        />
      )}
    </div>
  );
}
