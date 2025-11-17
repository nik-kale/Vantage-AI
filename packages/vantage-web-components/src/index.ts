/**
 * @vantage-ai/web-components
 * Framework-agnostic Web Components for Vantage AI
 *
 * Custom Elements that work in any framework or vanilla JS
 */

// =============================================================================
// Metric Card Web Component
// =============================================================================

class VantageMetricCard extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
  }

  static get observedAttributes(): string[] {
    return ["label", "value", "change", "trend", "format"];
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const label = this.getAttribute("label") || "Metric";
    const value = this.getAttribute("value") || "0";
    const change = this.getAttribute("change");
    const trend = this.getAttribute("trend") || "neutral";
    const format = this.getAttribute("format") || "number";

    const formattedValue = this.formatValue(parseFloat(value), format);
    const trendColor = trend === "up" ? "#4CAF50" : trend === "down" ? "#f44336" : "#999";

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .value {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #333;
        }

        .change {
          font-size: 14px;
          font-weight: 500;
        }
      </style>

      <div class="label">${label}</div>
      <div class="value">${formattedValue}</div>
      ${change ? `<div class="change" style="color: ${trendColor}">${parseFloat(change) > 0 ? "+" : ""}${parseFloat(change).toFixed(1)}%</div>` : ""}
    `;
  }

  private formatValue(value: number, format: string): string {
    switch (format) {
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "currency":
        return `$${value.toLocaleString()}`;
      case "duration":
        return this.formatDuration(value);
      default:
        return value.toLocaleString();
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// =============================================================================
// Banner Web Component
// =============================================================================

class VantageBanner extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }

  static get observedAttributes(): string[] {
    return ["title", "message", "type", "dismissible"];
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const title = this.getAttribute("title") || "";
    const message = this.getAttribute("message") || "";
    const type = this.getAttribute("type") || "info";
    const dismissible = this.hasAttribute("dismissible");

    const colors = {
      info: { bg: "#E3F2FD", border: "#2196F3", text: "#1976D2" },
      success: { bg: "#E8F5E9", border: "#4CAF50", text: "#388E3C" },
      warning: { bg: "#FFF3E0", border: "#FF9800", text: "#F57C00" },
      error: { bg: "#FFEBEE", border: "#f44336", text: "#D32F2F" }
    };

    const color = colors[type as keyof typeof colors] || colors.info;

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          max-width: 600px;
          width: 90%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .banner {
          background: ${color.bg};
          border: 2px solid ${color.border};
          border-radius: 8px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .content {
          flex: 1;
        }

        .title {
          font-size: 16px;
          font-weight: 600;
          color: ${color.text};
          margin-bottom: 4px;
        }

        .message {
          font-size: 14px;
          color: ${color.text};
          opacity: 0.9;
        }

        .close {
          background: none;
          border: none;
          font-size: 20px;
          color: ${color.text};
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .close:hover {
          opacity: 1;
        }
      </style>

      <div class="banner">
        <div class="content">
          ${title ? `<div class="title">${this.escapeHtml(title)}</div>` : ""}
          <div class="message">${this.escapeHtml(message)}</div>
        </div>
        ${dismissible ? '<button class="close" part="close-button">×</button>' : ""}
      </div>
    `;
  }

  private attachEventListeners(): void {
    const closeButton = this.shadow.querySelector(".close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("dismiss"));
        this.remove();
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// =============================================================================
// Chart Web Component
// =============================================================================

class VantageChart extends HTMLElement {
  private shadow: ShadowRoot;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
  }

  static get observedAttributes(): string[] {
    return ["type", "data", "labels"];
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const type = this.getAttribute("type") || "line";
    const dataAttr = this.getAttribute("data");
    const labelsAttr = this.getAttribute("labels");

    if (!dataAttr) return;

    const data = JSON.parse(dataAttr);
    const labels = labelsAttr ? JSON.parse(labelsAttr) : [];

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 300px;
        }

        canvas {
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this.canvas = this.shadow.querySelector("canvas");
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) return;

    // Set canvas size
    const rect = this.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Draw chart based on type
    switch (type) {
      case "line":
        this.drawLineChart(data, labels);
        break;
      case "bar":
        this.drawBarChart(data, labels);
        break;
      default:
        this.drawLineChart(data, labels);
    }
  }

  private drawLineChart(data: number[], labels: string[]): void {
    if (!this.ctx || !this.canvas) return;

    const padding = 40;
    const width = this.canvas.width - padding * 2;
    const height = this.canvas.height - padding * 2;

    const max = Math.max(...data);
    const min = Math.min(...data, 0);
    const range = max - min;

    // Draw axes
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, padding + height);
    this.ctx.lineTo(padding + width, padding + height);
    this.ctx.stroke();

    // Draw line
    this.ctx.strokeStyle = "#2196F3";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    data.forEach((value, i) => {
      const x = padding + (width / (data.length - 1)) * i;
      const y = padding + height - ((value - min) / range) * height;

      if (i === 0) {
        this.ctx!.moveTo(x, y);
      } else {
        this.ctx!.lineTo(x, y);
      }
    });

    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = "#2196F3";
    data.forEach((value, i) => {
      const x = padding + (width / (data.length - 1)) * i;
      const y = padding + height - ((value - min) / range) * height;

      this.ctx!.beginPath();
      this.ctx!.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx!.fill();
    });

    // Draw labels
    this.ctx.fillStyle = "#666";
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = "center";

    labels.forEach((label, i) => {
      const x = padding + (width / (data.length - 1)) * i;
      const y = padding + height + 20;
      this.ctx!.fillText(label, x, y);
    });
  }

  private drawBarChart(data: number[], labels: string[]): void {
    if (!this.ctx || !this.canvas) return;

    const padding = 40;
    const width = this.canvas.width - padding * 2;
    const height = this.canvas.height - padding * 2;

    const max = Math.max(...data);
    const barWidth = width / data.length - 10;

    // Draw axes
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, padding + height);
    this.ctx.lineTo(padding + width, padding + height);
    this.ctx.stroke();

    // Draw bars
    this.ctx.fillStyle = "#2196F3";
    data.forEach((value, i) => {
      const x = padding + (width / data.length) * i + 5;
      const barHeight = (value / max) * height;
      const y = padding + height - barHeight;

      this.ctx!.fillRect(x, y, barWidth, barHeight);
    });

    // Draw labels
    this.ctx.fillStyle = "#666";
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = "center";

    labels.forEach((label, i) => {
      const x = padding + (width / data.length) * i + barWidth / 2 + 5;
      const y = padding + height + 20;
      this.ctx!.fillText(label, x, y);
    });
  }
}

// =============================================================================
// Recommendation Web Component
// =============================================================================

class VantageRecommendation extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }

  static get observedAttributes(): string[] {
    return ["title", "message", "action-label", "type"];
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const title = this.getAttribute("title") || "Recommendation";
    const message = this.getAttribute("message") || "";
    const actionLabel = this.getAttribute("action-label") || "Take Action";
    const type = this.getAttribute("type") || "tooltip";

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          background: white;
          border-radius: 8px;
          padding: 16px 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-left: 4px solid #2196F3;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin-bottom: 12px;
        }

        .title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .message {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .action-btn {
          background: #2196F3;
          color: white;
        }

        .action-btn:hover {
          background: #1976D2;
        }

        .dismiss-btn {
          background: transparent;
          color: #666;
          border: 1px solid #ddd;
        }

        .dismiss-btn:hover {
          background: #f5f5f5;
        }
      </style>

      <div class="title">${this.escapeHtml(title)}</div>
      <div class="message">${this.escapeHtml(message)}</div>
      <div class="actions">
        <button class="action-btn">${this.escapeHtml(actionLabel)}</button>
        <button class="dismiss-btn">Dismiss</button>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const actionBtn = this.shadow.querySelector(".action-btn");
    const dismissBtn = this.shadow.querySelector(".dismiss-btn");

    if (actionBtn) {
      actionBtn.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("action"));
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("dismiss"));
        this.remove();
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// =============================================================================
// Register Custom Elements
// =============================================================================

export function registerVantageComponents(): void {
  if (!customElements.get("vantage-metric-card")) {
    customElements.define("vantage-metric-card", VantageMetricCard);
  }

  if (!customElements.get("vantage-banner")) {
    customElements.define("vantage-banner", VantageBanner);
  }

  if (!customElements.get("vantage-chart")) {
    customElements.define("vantage-chart", VantageChart);
  }

  if (!customElements.get("vantage-recommendation")) {
    customElements.define("vantage-recommendation", VantageRecommendation);
  }
}

// Auto-register on import
if (typeof window !== "undefined") {
  registerVantageComponents();
}

// =============================================================================
// Exports
// =============================================================================

export {
  VantageMetricCard,
  VantageBanner,
  VantageChart,
  VantageRecommendation,
  registerVantageComponents
};
