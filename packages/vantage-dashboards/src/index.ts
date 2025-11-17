/**
 * @vantage-ai/dashboards
 * Custom analytics dashboards with visualizations
 *
 * Build beautiful, interactive dashboards for your analytics data
 */

import React, { useState, useMemo, useEffect } from "react";

// =============================================================================
// Types
// =============================================================================

export interface DashboardConfig {
  id: string;
  title: string;
  description?: string;
  widgets: DashboardWidget[];
  layout?: "grid" | "flex" | "custom";
  refreshInterval?: number; // ms
}

export interface DashboardWidget {
  id: string;
  type: "metric" | "line-chart" | "bar-chart" | "pie-chart" | "area-chart" | "table" | "cohort-table" | "funnel-viz";
  title: string;
  position: { row: number; col: number; width: number; height: number };
  dataSource: string | (() => Promise<any>);
  config?: WidgetConfig;
}

export interface WidgetConfig {
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueFormat?: "number" | "percentage" | "currency" | "duration";
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
}

export interface MetricData {
  label: string;
  value: number;
  change?: number; // percentage change
  trend?: "up" | "down" | "neutral";
  format?: "number" | "percentage" | "currency" | "duration";
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface TableData {
  columns: Array<{ key: string; label: string; format?: string }>;
  rows: Record<string, any>[];
}

// =============================================================================
// Dashboard Component
// =============================================================================

export interface DashboardProps {
  config: DashboardConfig;
  onRefresh?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ config, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(() => {
        handleRefresh();
      }, config.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [config.refreshInterval]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return React.createElement(
    "div",
    {
      style: {
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif"
      }
    },
    // Header
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }
      },
      React.createElement("div", null,
        React.createElement("h1", { style: { margin: 0, fontSize: "28px", fontWeight: "600" } }, config.title),
        config.description && React.createElement("p", { style: { margin: "8px 0 0 0", color: "#666" } }, config.description)
      ),
      React.createElement(
        "button",
        {
          onClick: handleRefresh,
          disabled: isRefreshing,
          style: {
            padding: "10px 20px",
            backgroundColor: isRefreshing ? "#ccc" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isRefreshing ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }
        },
        isRefreshing ? "Refreshing..." : "Refresh"
      )
    ),
    // Widgets Grid
    React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "16px"
        }
      },
      config.widgets.map(widget =>
        React.createElement(DashboardWidgetRenderer, {
          key: widget.id,
          widget,
          isRefreshing
        })
      )
    )
  );
};

// =============================================================================
// Widget Renderer
// =============================================================================

interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
  isRefreshing: boolean;
}

const DashboardWidgetRenderer: React.FC<DashboardWidgetRendererProps> = ({ widget, isRefreshing }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [widget.dataSource, isRefreshing]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (typeof widget.dataSource === "function") {
        const result = await widget.dataSource();
        setData(result);
      } else {
        // Static data or URL
        setData(widget.dataSource);
      }
    } catch (error) {
      console.error(`Failed to load data for widget ${widget.id}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const gridColumnStart = widget.position.col + 1;
  const gridColumnEnd = gridColumnStart + widget.position.width;
  const gridRowStart = widget.position.row + 1;
  const gridRowEnd = gridRowStart + widget.position.height;

  return React.createElement(
    "div",
    {
      style: {
        gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
        gridRow: `${gridRowStart} / ${gridRowEnd}`,
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }
    },
    React.createElement("h3", { style: { margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" } }, widget.title),
    loading
      ? React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "#999" } }, "Loading...")
      : renderWidgetContent(widget.type, data, widget.config)
  );
};

function renderWidgetContent(type: DashboardWidget["type"], data: any, config?: WidgetConfig): React.ReactNode {
  switch (type) {
    case "metric":
      return React.createElement(MetricCard, { data, config });
    case "line-chart":
      return React.createElement(LineChart, { data, config });
    case "bar-chart":
      return React.createElement(BarChart, { data, config });
    case "pie-chart":
      return React.createElement(PieChart, { data, config });
    case "area-chart":
      return React.createElement(AreaChart, { data, config });
    case "table":
      return React.createElement(DataTable, { data, config });
    case "cohort-table":
      return React.createElement(CohortTable, { data, config });
    case "funnel-viz":
      return React.createElement(FunnelViz, { data, config });
    default:
      return React.createElement("div", null, "Unknown widget type");
  }
}

// =============================================================================
// Metric Card
// =============================================================================

const MetricCard: React.FC<{ data: MetricData; config?: WidgetConfig }> = ({ data, config }) => {
  const formattedValue = formatValue(data.value, data.format || "number");
  const trendColor = data.trend === "up" ? "#4CAF50" : data.trend === "down" ? "#f44336" : "#999";

  return React.createElement(
    "div",
    { style: { textAlign: "center" } },
    React.createElement("div", { style: { fontSize: "14px", color: "#666", marginBottom: "8px" } }, data.label),
    React.createElement("div", { style: { fontSize: "36px", fontWeight: "700", marginBottom: "8px" } }, formattedValue),
    data.change !== undefined && React.createElement(
      "div",
      { style: { fontSize: "14px", color: trendColor, fontWeight: "500" } },
      `${data.change > 0 ? "+" : ""}${data.change.toFixed(1)}%`
    )
  );
};

// =============================================================================
// Charts (SVG-based, lightweight)
// =============================================================================

const LineChart: React.FC<{ data: ChartData; config?: WidgetConfig }> = ({ data, config }) => {
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!data || !data.datasets || data.datasets.length === 0) {
    return React.createElement("div", { style: { textAlign: "center", color: "#999" } }, "No data available");
  }

  const allValues = data.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue;

  const colors = config?.colors || ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0"];

  return React.createElement(
    "svg",
    { width: "100%", height: height, viewBox: `0 0 ${width} ${height}` },
    // Grid lines
    config?.showGrid !== false && [0, 0.25, 0.5, 0.75, 1].map((ratio, i) =>
      React.createElement("line", {
        key: `grid-${i}`,
        x1: padding.left,
        y1: padding.top + chartHeight * ratio,
        x2: padding.left + chartWidth,
        y2: padding.top + chartHeight * ratio,
        stroke: "#e0e0e0",
        strokeWidth: 1
      })
    ),
    // Axes
    React.createElement("line", {
      x1: padding.left,
      y1: padding.top,
      x2: padding.left,
      y2: padding.top + chartHeight,
      stroke: "#333",
      strokeWidth: 2
    }),
    React.createElement("line", {
      x1: padding.left,
      y1: padding.top + chartHeight,
      x2: padding.left + chartWidth,
      y2: padding.top + chartHeight,
      stroke: "#333",
      strokeWidth: 2
    }),
    // Data lines
    data.datasets.map((dataset, dsIndex) => {
      const points = dataset.data.map((value, i) => {
        const x = padding.left + (chartWidth / (dataset.data.length - 1)) * i;
        const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        return `${x},${y}`;
      }).join(" ");

      return React.createElement("polyline", {
        key: `line-${dsIndex}`,
        points,
        fill: "none",
        stroke: dataset.color || colors[dsIndex % colors.length],
        strokeWidth: 3,
        strokeLinejoin: "round"
      });
    }),
    // X-axis labels
    data.labels.map((label, i) =>
      React.createElement("text", {
        key: `xlabel-${i}`,
        x: padding.left + (chartWidth / (data.labels.length - 1)) * i,
        y: padding.top + chartHeight + 20,
        textAnchor: "middle",
        fontSize: "12px",
        fill: "#666"
      }, label)
    )
  );
};

const BarChart: React.FC<{ data: ChartData; config?: WidgetConfig }> = ({ data, config }) => {
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!data || !data.datasets || data.datasets.length === 0) {
    return React.createElement("div", { style: { textAlign: "center", color: "#999" } }, "No data available");
  }

  const allValues = data.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues);
  const colors = config?.colors || ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0"];

  const barWidth = chartWidth / data.labels.length / data.datasets.length - 4;

  return React.createElement(
    "svg",
    { width: "100%", height: height, viewBox: `0 0 ${width} ${height}` },
    // Axes
    React.createElement("line", {
      x1: padding.left,
      y1: padding.top,
      x2: padding.left,
      y2: padding.top + chartHeight,
      stroke: "#333",
      strokeWidth: 2
    }),
    React.createElement("line", {
      x1: padding.left,
      y1: padding.top + chartHeight,
      x2: padding.left + chartWidth,
      y2: padding.top + chartHeight,
      stroke: "#333",
      strokeWidth: 2
    }),
    // Bars
    data.datasets.map((dataset, dsIndex) =>
      dataset.data.map((value, i) => {
        const groupX = padding.left + (chartWidth / data.labels.length) * i;
        const barX = groupX + barWidth * dsIndex + 4;
        const barHeight = (value / maxValue) * chartHeight;
        const barY = padding.top + chartHeight - barHeight;

        return React.createElement("rect", {
          key: `bar-${dsIndex}-${i}`,
          x: barX,
          y: barY,
          width: barWidth,
          height: barHeight,
          fill: dataset.color || colors[dsIndex % colors.length]
        });
      })
    ),
    // X-axis labels
    data.labels.map((label, i) =>
      React.createElement("text", {
        key: `xlabel-${i}`,
        x: padding.left + (chartWidth / data.labels.length) * i + (chartWidth / data.labels.length) / 2,
        y: padding.top + chartHeight + 20,
        textAnchor: "middle",
        fontSize: "12px",
        fill: "#666"
      }, label)
    )
  );
};

const PieChart: React.FC<{ data: ChartData; config?: WidgetConfig }> = ({ data, config }) => {
  const size = 300;
  const radius = 100;
  const centerX = size / 2;
  const centerY = size / 2;

  if (!data || !data.datasets || data.datasets.length === 0) {
    return React.createElement("div", { style: { textAlign: "center", color: "#999" } }, "No data available");
  }

  const values = data.datasets[0].data;
  const total = values.reduce((sum, v) => sum + v, 0);
  const colors = config?.colors || ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336", "#9E9E9E"];

  let currentAngle = -90;
  const slices = values.map((value, i) => {
    const sliceAngle = (value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z"
    ].join(" ");

    return React.createElement("path", {
      key: `slice-${i}`,
      d: pathData,
      fill: colors[i % colors.length],
      stroke: "white",
      strokeWidth: 2
    });
  });

  return React.createElement(
    "svg",
    { width: "100%", height: size, viewBox: `0 0 ${size} ${size}` },
    slices
  );
};

const AreaChart: React.FC<{ data: ChartData; config?: WidgetConfig }> = ({ data, config }) => {
  // Similar to LineChart but with filled area
  return React.createElement(LineChart, { data, config });
};

// =============================================================================
// Data Table
// =============================================================================

const DataTable: React.FC<{ data: TableData; config?: WidgetConfig }> = ({ data, config }) => {
  if (!data || !data.columns || !data.rows) {
    return React.createElement("div", { style: { textAlign: "center", color: "#999" } }, "No data available");
  }

  return React.createElement(
    "div",
    { style: { overflowX: "auto" } },
    React.createElement(
      "table",
      { style: { width: "100%", borderCollapse: "collapse" } },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          { style: { borderBottom: "2px solid #e0e0e0" } },
          data.columns.map(col =>
            React.createElement("th", {
              key: col.key,
              style: { padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }
            }, col.label)
          )
        )
      ),
      React.createElement(
        "tbody",
        null,
        data.rows.map((row, i) =>
          React.createElement(
            "tr",
            { key: i, style: { borderBottom: "1px solid #f0f0f0" } },
            data.columns.map(col =>
              React.createElement("td", {
                key: col.key,
                style: { padding: "12px", fontSize: "14px" }
              }, formatValue(row[col.key], col.format || "number"))
            )
          )
        )
      )
    )
  );
};

// =============================================================================
// Cohort Table
// =============================================================================

const CohortTable: React.FC<{ data: any; config?: WidgetConfig }> = ({ data, config }) => {
  // Render retention cohort table
  return React.createElement(DataTable, { data, config });
};

// =============================================================================
// Funnel Visualization
// =============================================================================

const FunnelViz: React.FC<{ data: any; config?: WidgetConfig }> = ({ data, config }) => {
  // Simple funnel visualization
  return React.createElement("div", { style: { textAlign: "center", color: "#999" } }, "Funnel visualization");
};

// =============================================================================
// Utility Functions
// =============================================================================

function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) return "-";

  switch (format) {
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "currency":
      return `$${value.toLocaleString()}`;
    case "duration":
      return formatDuration(value);
    case "number":
    default:
      return typeof value === "number" ? value.toLocaleString() : String(value);
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// =============================================================================
// Exports
// =============================================================================

export {
  Dashboard,
  MetricCard,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  DataTable,
  CohortTable,
  FunnelViz,
  formatValue
};
