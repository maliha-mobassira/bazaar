"use client";

export default function Logo({
  size = 32,
  direction = "column",
}: {
  size?: number;
  direction?: "row" | "column";
}) {
  const isColumn = direction === "column";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isColumn ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: isColumn ? "2px" : "4px",
        textAlign: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--text-primary)", display: "block" }}
      >
        {/* Canopy Top */}
        <path d="M3 10L5 4H19L21 10" />
        {/* Canopy Stripes */}
        <path d="M8 4V10" />
        <path d="M12 4V10" />
        <path d="M16 4V10" />
        {/* Horizontal beam */}
        <path d="M2 10H22" />
        {/* Counter Table */}
        <rect x="4" y="14" width="16" height="7" />
        {/* Support columns */}
        <path d="M5 10V14" />
        <path d="M19 10V14" />
      </svg>
      <span
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: isColumn ? `${size * 0.9}px` : `${size * 0.8}px`,
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
          color: "var(--text-primary)",
        }}
      >
        Bazaar
      </span>
    </div>
  );
}
