import React, { useEffect, useState } from "react";
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

export interface ToastProps {
  message: string;
  severity?: "info" | "success" | "warning" | "error";
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  onClose?: () => void;
}

const severityConfig = {
  info: { bg: "#3b82f6", icon: "ℹ️" },
  success: { bg: "#10b981", icon: "✓" },
  warning: { bg: "#f59e0b", icon: "⚠️" },
  error: { bg: "#ef4444", icon: "✕" }
};

const positions = {
  "top-right": { top: "20px", right: "20px" },
  "top-left": { top: "20px", left: "20px" },
  "bottom-right": { bottom: "20px", right: "20px" },
  "bottom-left": { bottom: "20px", left: "20px" },
  "top-center": { top: "20px", left: "50%", transform: "translateX(-50%)" },
  "bottom-center": { bottom: "20px", left: "50%", transform: "translateX(-50%)" }
};

export const Toast: React.FC<ToastProps> = ({
  message,
  severity = "info",
  duration = 5000,
  position = "bottom-right",
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const config = severityConfig[severity];
  const posStyle = positions[position];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        ...posStyle,
        minWidth: "300px",
        maxWidth: "400px",
        background: config.bg,
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 10000,
        opacity: isExiting ? 0 : 1,
        transform: `translateY(${isExiting ? "-20px" : "0"})`,
        transition: "all 0.3s ease"
      }}
    >
      <span style={{ fontSize: "1.5rem" }}>{config.icon}</span>
      <div
        style={{ flex: 1, fontSize: "0.9rem" }}
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(message) }}
      />
      <button
        onClick={handleClose}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: "4px"
        }}
      >
        ✕
      </button>
    </div>
  );
};
