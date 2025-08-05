import { useState, useEffect } from 'react';

const PROMPT_HISTORY_KEY = 'prompt-cast-history';
const MAX_HISTORY_SIZE = 10;

export function usePromptHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const savedHistory = window.localStorage.getItem(PROMPT_HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      // Ignore if localStorage is not available or invalid data
    }
  }, []);

  const addToHistory = (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setHistory((currentHistory) => {
      // Remove the prompt if it already exists to avoid duplicates
      const filtered = currentHistory.filter((item) => item !== trimmedPrompt);

      // Add new prompt to the beginning
      const newHistory = [trimmedPrompt, ...filtered].slice(
        0,
        MAX_HISTORY_SIZE,
      );

      // Save to localStorage
      try {
        window.localStorage.setItem(
          PROMPT_HISTORY_KEY,
          JSON.stringify(newHistory),
        );
      } catch {
        // Ignore if localStorage is not available
      }

      return newHistory;
    });
  };

  const getLastPrompt = (): string | null => {
    return history.length > 0 ? history[0] : null;
  };

  return {
    addToHistory,
    getLastPrompt,
  };
}
