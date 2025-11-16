import React, { useEffect } from "react";
import { initVantage } from "@vantage-ai/sdk";
import defaultPlaybooks from "@vantage-ai/playbooks";
import { createBannerRenderer } from "@vantage-ai/widgets";
import { submitOrder } from "./mockApi";

const App: React.FC = () => {
  useEffect(() => {
    const bannerRenderer = createBannerRenderer();

    const vantage = initVantage({
      mode: "lite",
      playbooks: defaultPlaybooks,
      onTrigger: (rec) => {
        bannerRenderer.show(rec);
      }
    });

    vantage.start();
  }, []);

  const handleSubmit = async () => {
    const res = await submitOrder();
    if (!res.ok) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = "Payment failed. Please check your details.";
      document.getElementById("errors")?.appendChild(errorDiv);
    }
  };

  return (
    <div style={{ padding: "32px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Vantage AI – Demo Checkout</h1>
      <p>Try submitting a few times to trigger the guidance banner.</p>

      <div style={{ marginTop: "24px" }}>
        <label>
          Card number:
          <input style={{ marginLeft: "8px" }} />
        </label>
      </div>

      <div id="errors" style={{ marginTop: "12px", color: "#dc2626" }} />

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "16px",
          padding: "8px 16px",
          borderRadius: "6px",
          background: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Submit Order
      </button>
    </div>
  );
};

export default App;
