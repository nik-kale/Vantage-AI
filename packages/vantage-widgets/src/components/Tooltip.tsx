import React, { useEffect, useRef, useState } from "react";
import { sanitizeHTML, sanitizeURL } from "@vantage-ai/sdk/security/sanitizer";

export interface TooltipProps {
  content: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
  severity?: "info" | "warning" | "critical";
  onClose?: () => void;
  autoClose?: number;
}

const severityColors: Record<string, string> = {
  info: "#2563eb",
  warning: "#f59e0b",
  critical: "#dc2626"
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  targetSelector,
  position = "top",
  severity = "info",
  onClose,
  autoClose
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (targetSelector) {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current?.offsetHeight || 0;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 0;

        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top - tooltipHeight - 8;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - 8;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + 8;
            break;
        }

        setCoords({ top, left });
      }
    }
  }, [targetSelector, position]);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const color = severityColors[severity] || severityColors.info;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        background: "#1f2937",
        color: "#f9fafb",
        padding: "8px 12px",
        borderRadius: "6px",
        border: `1px solid ${color}`,
        maxWidth: "250px",
        zIndex: 10000,
        fontSize: "0.875rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: "0.875rem"
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
