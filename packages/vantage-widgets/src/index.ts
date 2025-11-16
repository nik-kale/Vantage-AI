export * from "./Banner";
export * from "./types";

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
