"use client";

import { useEffect, useState } from "react";
import { getProducts, createProduct, deleteProduct, devImportProducts, Product } from "@/lib/api/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImportDevProducts = async () => {
    try {
      setImporting(true);
      setError(null);
      const res = await devImportProducts();
      fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to import dev products");
    } finally {
      setImporting(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await createProduct(name, sku, price, image || undefined, category || undefined);
      setName("");
      setSku("");
      setPrice("");
      setImage("");
      setCategory("");
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || "Failed to create product");
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

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 1s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        style={{
          marginBottom: "64px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
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
            Our <i>products</i> catalog.
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "12px 24px",
            background: "var(--text-primary)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "0px", // Architectural style
            fontWeight: 500,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            cursor: "pointer",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Add Product
        </button>
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
          Loading collection...
        </div>
      ) : products.length === 0 ? (
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
          <p
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "28px",
              color: "var(--text-primary)",
              marginBottom: "16px",
              fontStyle: "italic",
            }}
          >
            The catalog is currently empty.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: "12px 24px",
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "0px",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                cursor: "pointer",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Create Product
            </button>
            <button
              onClick={handleImportDevProducts}
              disabled={importing}
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                cursor: importing ? "not-allowed" : "pointer",
                opacity: importing ? 0.6 : 1,
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                if (!importing) e.currentTarget.style.borderColor = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!importing) e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {importing ? "Importing..." : "Import Dev Products (200+)"}
            </button>
          </div>
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
                  Name
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
                  }}
                >
                  Price
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
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
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
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
                    {product.sku}
                  </td>
                  <td style={{ padding: "20px 24px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {product.name}
                  </td>
                  <td style={{ padding: "20px 24px", textTransform: "capitalize", color: "var(--text-secondary)" }}>
                    {product.category || "General"}
                  </td>
                  <td style={{ padding: "20px 24px", fontWeight: 600, color: "var(--text-primary)" }}>
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td style={{ padding: "20px 24px", textAlign: "right" }}>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        borderRadius: "0px",
                        cursor: "pointer",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#ef4444";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal Overlay */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.4s ease-out",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "0px",
              padding: "48px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "28px", fontWeight: 400, fontStyle: "italic" }}>
                New Catalog Entry
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                ×
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  borderRadius: "0px",
                  marginBottom: "24px",
                  fontSize: "13px",
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Single-Origin Beans"
                  required
                  disabled={submitting}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--text-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--border)";
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Product SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BEANS-ACME-500G"
                  required
                  disabled={submitting}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--text-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--border)";
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="19.99"
                  required
                  disabled={submitting}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--text-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--border)";
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. groceries, beauty, electronics"
                  disabled={submitting}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--text-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--border)";
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={submitting}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--text-primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = "var(--border)";
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "12px 24px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: "0px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "12px 24px",
                    background: "var(--text-primary)",
                    color: "var(--bg)",
                    border: "none",
                    borderRadius: "0px",
                    fontWeight: 500,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: submitting ? 0.7 : 1,
                    transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {submitting ? "Creating..." : "Confirm Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
