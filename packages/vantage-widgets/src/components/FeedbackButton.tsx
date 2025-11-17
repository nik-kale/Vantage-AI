/**
 * Feedback Button - Floating button for easy feedback access
 */

import React, { useState } from "react";
import { Survey, SurveyQuestion } from "./Survey";

export interface FeedbackButtonProps {
  position?: "bottom-right" | "bottom-left" | "right" | "left";
  label?: string;
  icon?: string;
  color?: string;
  onSubmit: (feedback: { rating: number; category: string; message: string }) => void;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  position = "bottom-right",
  label = "Feedback",
  icon = "💬",
  color = "#4CAF50",
  onSubmit
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const feedbackQuestions: SurveyQuestion[] = [
    {
      id: "rating",
      type: "rating",
      question: "How would you rate your experience?",
      required: true,
      min: 1,
      max: 5
    },
    {
      id: "category",
      type: "multiple-choice",
      question: "What is your feedback about?",
      options: [
        "Bug or technical issue",
        "Feature request",
        "User experience",
        "Performance",
        "Documentation",
        "Other"
      ],
      required: true
    },
    {
      id: "message",
      type: "text",
      question: "Tell us more (optional)",
      required: false
    }
  ];

  const handleSubmit = (responses: Record<string, any>) => {
    onSubmit({
      rating: responses.rating,
      category: responses.category,
      message: responses.message || ""
    });
    setIsOpen(false);
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-right": {
      bottom: "20px",
      right: "20px"
    },
    "bottom-left": {
      bottom: "20px",
      left: "20px"
    },
    right: {
      right: "20px",
      top: "50%",
      transform: "translateY(-50%)"
    },
    left: {
      left: "20px",
      top: "50%",
      transform: "translateY(-50%)"
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          ...positionStyles[position],
          zIndex: 9997,
          background: color,
          color: "white",
          border: "none",
          borderRadius: "50px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.3s",
          fontFamily: "Arial, sans-serif"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
      >
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span>{label}</span>
      </button>

      {/* Survey Modal */}
      {isOpen && (
        <Survey
          title="We'd love your feedback!"
          description="Help us improve your experience"
          questions={feedbackQuestions}
          onSubmit={handleSubmit}
          onClose={() => setIsOpen(false)}
          position="center"
        />
      )}
    </>
  );
};
