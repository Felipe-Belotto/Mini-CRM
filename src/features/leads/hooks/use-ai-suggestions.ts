"use client";

import { useState } from "react";
import { AI_SUGGESTIONS } from "../lib/message-utils";

export function useAISuggestions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSuggestions = () => {
    setIsGenerating(true);
    setShowSuggestions(false);

    setTimeout(() => {
      setIsGenerating(false);
      setShowSuggestions(true);
    }, 1500);
  };

  return {
    isGenerating,
    showSuggestions,
    suggestions: AI_SUGGESTIONS,
    generateSuggestions,
  };
}
