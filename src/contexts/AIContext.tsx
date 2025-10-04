import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiService, ChatMessage } from '../services/aiService';

interface AISettings {
  apiKey?: string;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  temperature: number;
  maxTokens: number;
  enableStreaming: boolean;
  autoSuggestions: boolean;
  contextAwareness: boolean;
}

interface AIUsageStats {
  messagesCount: number;
  tokensUsed: number;
  sessionsCount: number;
  lastUsed?: number;
}

interface AIContextType {
  isAIEnabled: boolean;
  settings: AISettings;
  usageStats: AIUsageStats;
  isApiKeyValid: boolean;
  enableAI: () => void;
  disableAI: () => void;
  updateSettings: (newSettings: Partial<AISettings>) => void;
  validateApiKey: (apiKey: string) => Promise<boolean>;
  generateTodoSuggestions: (input: string) => Promise<string[]>;
  analyzeProductivity: (todos: any[]) => Promise<string>;
  resetUsageStats: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AISettings = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 500,
  enableStreaming: true,
  autoSuggestions: true,
  contextAwareness: true,
};

const DEFAULT_USAGE_STATS: AIUsageStats = {
  messagesCount: 0,
  tokensUsed: 0,
  sessionsCount: 0,
};

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(true);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [usageStats, setUsageStats] = useState<AIUsageStats>(DEFAULT_USAGE_STATS);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-settings');
    const savedStats = localStorage.getItem('ai-usage-stats');
    const savedEnabled = localStorage.getItem('ai-enabled');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    }

    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setUsageStats({ ...DEFAULT_USAGE_STATS, ...parsed });
      } catch (error) {
        console.error('Error loading AI usage stats:', error);
      }
    }

    if (savedEnabled !== null) {
      setIsAIEnabled(savedEnabled === 'true');
    }

    // Check if API key is available and valid on startup
    checkApiKeyOnStartup();
  }, []);

  // Save settings and stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ai-usage-stats', JSON.stringify(usageStats));
  }, [usageStats]);

  useEffect(() => {
    localStorage.setItem('ai-enabled', isAIEnabled.toString());
  }, [isAIEnabled]);

  const checkApiKeyOnStartup = async () => {
    const apiKey = settings.apiKey || process.env.REACT_APP_OPENAI_API_KEY;
    if (apiKey) {
      const isValid = await validateApiKey(apiKey);
      setIsApiKeyValid(isValid);
      if (!isValid) {
        console.warn('OpenAI API key is invalid. AI features will use mock responses.');
      }
    } else {
      console.info('No OpenAI API key found. AI features will use mock responses for demo.');
      setIsApiKeyValid(false);
    }
  };

  const enableAI = () => {
    setIsAIEnabled(true);
  };

  const disableAI = () => {
    setIsAIEnabled(false);
  };

  const updateSettings = (newSettings: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // If API key is updated, validate it
    if (newSettings.apiKey) {
      validateApiKey(newSettings.apiKey);
    }
  };

  const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey || apiKey.trim() === '') {
      setIsApiKeyValid(false);
      return false;
    }

    try {
      // Test the API key with a minimal request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const isValid = response.ok;
      setIsApiKeyValid(isValid);
      return isValid;
    } catch (error) {
      console.error('API key validation error:', error);
      setIsApiKeyValid(false);
      return false;
    }
  };

  const generateTodoSuggestions = async (input: string): Promise<string[]> => {
    if (!isAIEnabled || !input.trim()) {
      return [];
    }

    try {
      // Use the AI service to generate suggestions
      const suggestions = aiService.generateTodoSuggestions(input);
      
      // Update usage stats
      setUsageStats(prev => ({
        ...prev,
        messagesCount: prev.messagesCount + 1,
        lastUsed: Date.now(),
      }));

      return suggestions;
    } catch (error) {
      console.error('Error generating todo suggestions:', error);
      return [];
    }
  };

  const analyzeProductivity = async (todos: any[]): Promise<string> => {
    if (!isAIEnabled) {
      return 'AI analysis is disabled. Enable AI features in settings to get productivity insights.';
    }

    try {
      const analysis = await aiService.analyzeProductivity(todos);
      
      // Update usage stats
      setUsageStats(prev => ({
        ...prev,
        messagesCount: prev.messagesCount + 1,
        lastUsed: Date.now(),
      }));

      return analysis;
    } catch (error) {
      console.error('Error analyzing productivity:', error);
      return 'Unable to analyze productivity at this time. Please try again later.';
    }
  };

  const resetUsageStats = () => {
    setUsageStats(DEFAULT_USAGE_STATS);
  };

  const value: AIContextType = {
    isAIEnabled,
    settings,
    usageStats,
    isApiKeyValid,
    enableAI,
    disableAI,
    updateSettings,
    validateApiKey,
    generateTodoSuggestions,
    analyzeProductivity,
    resetUsageStats,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

// Hook for getting AI suggestions with debouncing
export const useAISuggestions = (input: string, delay: number = 500) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { generateTodoSuggestions, isAIEnabled } = useAI();

  useEffect(() => {
    if (!isAIEnabled || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    const timeoutId = setTimeout(async () => {
      try {
        const newSuggestions = await generateTodoSuggestions(input);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [input, delay, generateTodoSuggestions, isAIEnabled]);

  return { suggestions, isLoading };
};

export default AIProvider;