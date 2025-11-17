/**
 * Survey Widget - In-app user feedback collection
 */

import React, { useState } from "react";
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

export interface SurveyQuestion {
  id: string;
  type: "rating" | "nps" | "multiple-choice" | "text" | "yes-no";
  question: string;
  options?: string[]; // For multiple-choice
  required?: boolean;
  min?: number; // For rating (default: 1)
  max?: number; // For rating (default: 5)
}

export interface SurveyProps {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  onSubmit: (responses: Record<string, any>) => void;
  onClose?: () => void;
  position?: "center" | "bottom-right" | "bottom-left";
  showProgressBar?: boolean;
}

export const Survey: React.FC<SurveyProps> = ({
  title,
  description,
  questions,
  onSubmit,
  onClose,
  position = "center",
  showProgressBar = true
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleResponse = (value: any) => {
    setResponses((prev) => ({
      ...prev,
      [question.id]: value
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[question.id];
      return newErrors;
    });
  };

  const handleNext = () => {
    // Validate required
    if (question.required && !responses[question.id]) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: "This question is required"
      }));
      return;
    }

    if (isLastQuestion) {
      // Submit
      onSubmit(responses);
    } else {
      // Next question
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const renderQuestion = () => {
    switch (question.type) {
      case "rating":
        return (
          <RatingQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
            min={question.min || 1}
            max={question.max || 5}
          />
        );

      case "nps":
        return (
          <NPSQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );

      case "multiple-choice":
        return (
          <MultipleChoiceQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );

      case "text":
        return (
          <TextQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );

      case "yes-no":
        return (
          <YesNoQuestion
            question={question}
            value={responses[question.id]}
            onChange={handleResponse}
          />
        );

      default:
        return null;
    }
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    center: {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)"
    },
    "bottom-right": {
      bottom: "20px",
      right: "20px"
    },
    "bottom-left": {
      bottom: "20px",
      left: "20px"
    }
  };

  return (
    <>
      {/* Backdrop */}
      {position === "center" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9998
          }}
          onClick={onClose}
        />
      )}

      {/* Survey Card */}
      <div
        style={{
          position: "fixed",
          ...positionStyles[position],
          zIndex: 9999,
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          fontFamily: "Arial, sans-serif"
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h3
                style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600" }}
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(title) }}
              />
              {description && (
                <p
                  style={{ margin: 0, color: "#666", fontSize: "14px" }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(description) }}
                />
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                  padding: 0,
                  lineHeight: 1
                }}
                aria-label="Close survey"
              >
                ×
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {showProgressBar && (
            <div
              style={{
                marginTop: "16px",
                height: "4px",
                background: "#e0e0e0",
                borderRadius: "2px",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#4CAF50",
                  width: `${progress}%`,
                  transition: "width 0.3s"
                }}
              />
            </div>
          )}
        </div>

        {/* Question */}
        <div style={{ marginBottom: "24px" }}>
          {renderQuestion()}
          {errors[question.id] && (
            <p style={{ color: "#f44336", fontSize: "12px", marginTop: "8px" }}>
              {errors[question.id]}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            style={{
              padding: "10px 20px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: "white",
              cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
              opacity: currentQuestion === 0 ? 0.5 : 1,
              fontSize: "14px"
            }}
          >
            Previous
          </button>

          <div style={{ flex: 1, textAlign: "center", paddingTop: "10px", color: "#666", fontSize: "14px" }}>
            {currentQuestion + 1} of {questions.length}
          </div>

          <button
            onClick={handleNext}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: "#4CAF50",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {isLastQuestion ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
};

// Question Components

const RatingQuestion: React.FC<{
  question: SurveyQuestion;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}> = ({ question, value, onChange, min, max }) => {
  const stars = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <p style={{ marginBottom: "16px", fontWeight: "500" }}>{question.question}</p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {stars.map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            style={{
              width: "40px",
              height: "40px",
              border: "2px solid",
              borderColor: value >= star ? "#4CAF50" : "#ccc",
              borderRadius: "50%",
              background: value >= star ? "#4CAF50" : "white",
              color: value >= star ? "white" : "#666",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {star}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px", color: "#999" }}>
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
};

const NPSQuestion: React.FC<{
  question: SurveyQuestion;
  value: number;
  onChange: (value: number) => void;
}> = ({ question, value, onChange }) => {
  const scores = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div>
      <p style={{ marginBottom: "16px", fontWeight: "500" }}>{question.question}</p>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
        {scores.map((score) => {
          let color = "#f44336"; // Detractor (0-6)
          if (score >= 9) color = "#4CAF50"; // Promoter (9-10)
          else if (score >= 7) color = "#FF9800"; // Passive (7-8)

          return (
            <button
              key={score}
              onClick={() => onChange(score)}
              style={{
                width: "40px",
                height: "40px",
                border: "2px solid",
                borderColor: value === score ? color : "#ccc",
                borderRadius: "6px",
                background: value === score ? color : "white",
                color: value === score ? "white" : "#666",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {score}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px", color: "#999" }}>
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
};

const MultipleChoiceQuestion: React.FC<{
  question: SurveyQuestion;
  value: string;
  onChange: (value: string) => void;
}> = ({ question, value, onChange }) => (
  <div>
    <p style={{ marginBottom: "16px", fontWeight: "500" }}>{question.question}</p>
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {question.options?.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          style={{
            padding: "12px 16px",
            border: "2px solid",
            borderColor: value === option ? "#4CAF50" : "#ccc",
            borderRadius: "8px",
            background: value === option ? "#f1f8f4" : "white",
            textAlign: "left",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "2px solid",
                borderColor: value === option ? "#4CAF50" : "#ccc",
                background: value === option ? "#4CAF50" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {value === option && (
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />
              )}
            </div>
            <span>{option}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const TextQuestion: React.FC<{
  question: SurveyQuestion;
  value: string;
  onChange: (value: string) => void;
}> = ({ question, value, onChange }) => (
  <div>
    <label style={{ display: "block", marginBottom: "12px", fontWeight: "500" }}>
      {question.question}
    </label>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your response..."
      rows={4}
      style={{
        width: "100%",
        padding: "12px",
        border: "2px solid #ccc",
        borderRadius: "8px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        resize: "vertical",
        boxSizing: "border-box"
      }}
    />
  </div>
);

const YesNoQuestion: React.FC<{
  question: SurveyQuestion;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ question, value, onChange }) => (
  <div>
    <p style={{ marginBottom: "16px", fontWeight: "500" }}>{question.question}</p>
    <div style={{ display: "flex", gap: "12px" }}>
      <button
        onClick={() => onChange(true)}
        style={{
          flex: 1,
          padding: "16px",
          border: "2px solid",
          borderColor: value === true ? "#4CAF50" : "#ccc",
          borderRadius: "8px",
          background: value === true ? "#4CAF50" : "white",
          color: value === true ? "white" : "#666",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        style={{
          flex: 1,
          padding: "16px",
          border: "2px solid",
          borderColor: value === false ? "#f44336" : "#ccc",
          borderRadius: "8px",
          background: value === false ? "#f44336" : "white",
          color: value === false ? "white" : "#666",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
      >
        No
      </button>
    </div>
  </div>
);
