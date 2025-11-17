export * from "./Banner";
export * from "./types";

// v3.0 and earlier widgets
export { Banner } from "./components/Banner";
export { Tooltip } from "./components/Tooltip";
export { Checklist } from "./components/Checklist";
export { Modal } from "./components/Modal";
export { Toast } from "./components/Toast";
export { ProductTour } from "./components/ProductTour";

// v5.0 new widgets
export { Survey } from "./components/Survey";
export { FeedbackButton } from "./components/FeedbackButton";

import { Banner } from "./Banner";
import type { Recommendation } from "@vantage-ai/sdk";

export function createBannerRenderer() {
  return {
    show(rec: Recommendation) {
      const container = document.createElement("div");
      document.body.appendChild(container);

      import("react").then((React) => {
        import("react-dom/client").then((ReactDOM) => {
          const root = ReactDOM.createRoot(container);
          root.render(
            React.createElement(Banner, {
              title: rec.title,
              message: rec.message,
              severity: rec.severity,
              link: rec.link,
              onClose: () => {
                root.unmount();
                container.remove();
              }
            })
          );
        });
      });
    }
  };
}
