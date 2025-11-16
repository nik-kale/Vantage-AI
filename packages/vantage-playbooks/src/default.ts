import type { Playbook } from "@vantage-ai/sdk";

const defaultPlaybooks: Playbook[] = [
  {
    id: "rage-click-form",
    description:
      "User is clicking repeatedly and likely stuck on a broken form.",
    match: {
      categories: ["friction"],
      minScore: 0.4,
      routePattern: "checkout|payment"
    },
    recommendation: {
      id: "checkout-help",
      title: "Having trouble completing this step?",
      message:
        "We noticed repeated attempts. Double-check your details, and if the issue persists, try refreshing or contact support.",
      severity: "info",
      link: "/help/checkout",
      widget: "banner"
    }
  }
];

export default defaultPlaybooks;
