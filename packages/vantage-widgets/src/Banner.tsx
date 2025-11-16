import React from "react";
import type { BannerProps } from "./types";

const severityColors: Record<string, string> = {
  info: "#2563eb",
  warning: "#f59e0b",
  critical: "#dc2626"
};

export const Banner: React.FC<BannerProps> = ({
  title,
  message,
  severity = "info",
  link,
  onClose
}) => {
  const color = severityColors[severity] ?? severityColors.info;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        padding: "12px 16px",
        borderRadius: "8px",
        background: "#0f172a",
        color: "#f9fafb",
        border: `1px solid ${color}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        zIndex: 9999
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{title}</div>
        <div style={{ fontSize: "0.9rem" }}>{message}</div>
        {link && (
          <a
            href={link}
            style={{
              marginTop: "4px",
              display: "inline-block",
              color
            }}
          >
            Learn more →
          </a>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: "1.1rem"
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
