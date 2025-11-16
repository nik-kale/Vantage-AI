import React, { useState } from "react";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  link?: string;
}

export interface ChecklistProps {
  title: string;
  items: ChecklistItem[];
  onItemToggle?: (id: string) => void;
  onClose?: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const Checklist: React.FC<ChecklistProps> = ({
  title,
  items: initialItems,
  onItemToggle,
  onClose,
  position = "bottom-right"
}) => {
  const [items, setItems] = useState(initialItems);

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
    onItemToggle?.(id);
  };

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  const positions = {
    "top-right": { top: "16px", right: "16px" },
    "top-left": { top: "16px", left: "16px" },
    "bottom-right": { bottom: "16px", right: "16px" },
    "bottom-left": { bottom: "16px", left: "16px" }
  };

  return (
    <div
      style={{
        position: "fixed",
        ...positions[position],
        width: "320px",
        background: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          background: "#2563eb",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: "1rem" }}>{title}</div>
          <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>
            {completedCount} of {items.length} completed
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "1.25rem"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ background: "#e5e7eb", height: "4px" }}>
        <div
          style={{
            background: "#10b981",
            height: "100%",
            width: `${progress}%`,
            transition: "width 0.3s ease"
          }}
        />
      </div>

      {/* Items */}
      <div style={{ padding: "16px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #e5e7eb"
            }}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggle(item.id)}
              style={{
                width: "18px",
                height: "18px",
                marginRight: "12px",
                cursor: "pointer"
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  textDecoration: item.completed ? "line-through" : "none",
                  color: item.completed ? "#9ca3af" : "#1f2937"
                }}
              >
                {item.label}
              </div>
              {item.link && !item.completed && (
                <a
                  href={item.link}
                  style={{
                    fontSize: "0.75rem",
                    color: "#2563eb",
                    textDecoration: "none"
                  }}
                >
                  Learn more →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
