import React, { useState, useEffect } from "react";
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  showSkip?: boolean;
}

export interface ProductTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  steps,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(true);

  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;

    const element = document.querySelector(step.target);
    if (!element) {
      console.warn(`ProductTour: Element not found: ${step.target}`);
      return;
    }

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 350;
    const tooltipHeight = 200;

    let top = rect.top;
    let left = rect.left;

    switch (step.position || "bottom") {
      case "top":
        top = rect.top - tooltipHeight - 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 20;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 20;
        break;
    }

    setPosition({ top, left });

    // Highlight element
    element.setAttribute("data-tour-highlight", "true");
    element.setAttribute("style", element.getAttribute("style") + "; outline: 3px solid #3b82f6; outline-offset: 4px; position: relative; z-index: 9998;");

    return () => {
      element.removeAttribute("data-tour-highlight");
      element.removeAttribute("style");
    };
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || !step) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 9997
        }}
      />

      {/* Tour tooltip */}
      <div
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: "350px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              {step.title}
            </h3>
            {step.showSkip !== false && (
              <button
                onClick={handleSkip}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Skip tour
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          style={{ padding: "20px", color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(step.content) }}
        />

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            background: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {currentStep + 1} of {steps.length}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Previous
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#3b82f6",
                color: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500
              }}
            >
              {currentStep < steps.length - 1 ? "Next" : "Finish"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
