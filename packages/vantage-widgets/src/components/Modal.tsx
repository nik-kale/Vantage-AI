import React, { useEffect } from "react";
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

export interface ModalProps {
  title: string;
  content: string;
  severity?: "info" | "warning" | "critical";
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  onClose?: () => void;
}

const severityColors: Record<string, string> = {
  info: "#2563eb",
  warning: "#f59e0b",
  critical: "#dc2626"
};

export const Modal: React.FC<ModalProps> = ({
  title,
  content,
  severity = "info",
  primaryAction,
  secondaryAction,
  onClose
}) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const color = severityColors[severity] || severityColors.info;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          zIndex: 9999,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: color
            }}
          >
            {title}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#9ca3af"
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div
          style={{ padding: "20px", color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
        />

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div
            style={{
              padding: "20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}
          >
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: color,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500
                }}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
