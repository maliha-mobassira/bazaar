"use client";

import React from "react";
import InvoiceView, { InvoiceData } from "./InvoiceView";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export default function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .modal-body-wrapper {
          max-height: 92vh;
          overflow-y: auto;
          width: 100%;
          max-width: 860px;
          border-radius: 24px;
          box-shadow: 0 32px 100px rgba(0, 0, 0, 0.4);
          animation: modalPop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(16px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <div className="modal-body-wrapper">
        <InvoiceView invoice={invoice} onClose={onClose} />
      </div>
    </div>
  );
}
