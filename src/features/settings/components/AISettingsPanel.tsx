import React, { useState } from 'react';
import { Button } from "../../../components/ui/button";
import { useAI } from '../../../contexts/AIContext';

export const AISettingsPanel: React.FC = () => {
  const { 
    isAIEnabled, 
    settings, 
    usageStats, 
    isApiKeyValid,
    enableAI, 
    disableAI, 
    updateSettings, 
    validateApiKey,
    resetUsageStats
  } = useAI();

  const [tempApiKey, setTempApiKey] = useState(settings.apiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const handleApiKeyValidation = async () => {
    if (!tempApiKey.trim()) {
      setValidationMessage('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationMessage('');

    try {
      const isValid = await validateApiKey(tempApiKey);
      if (isValid) {
        updateSettings({ apiKey: tempApiKey });
        setValidationMessage('API key is valid and saved!');
      } else {
        setValidationMessage('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setValidationMessage('Error validating API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* AI Enable/Disable */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <p className="text-pink-200 text-sm">Enable or disable AI-powered features</p>
          </div>
          <Button
            onClick={isAIEnabled ? disableAI : enableAI}
            variant={isAIEnabled ? "destructive" : "default"}
            size="default"
            className={isAIEnabled ? "bg-red-600 hover:bg-red-700" : "bg-pink-600 hover:bg-pink-700"}
          >
            {isAIEnabled ? 'Disable AI' : 'Enable AI'}
          </Button>
        </div>
        
        <div className={`transition-opacity ${isAIEnabled ? 'opacity-100' : 'opacity-50'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 rounded p-4">
              <div className="text-2xl font-bold">{usageStats.messagesCount}</div>
              <div className="text-sm text-pink-200">Messages Sent</div>
            </div>
            <div className="bg-white/5 rounded p-4">
              <div className="text-2xl font-bold">{usageStats.tokensUsed}</div>
              <div className="text-sm text-pink-200">Tokens Used</div>
            </div>
            <div className="bg-white/5 rounded p-4">
              <div className="text-2xl font-bold">{usageStats.sessionsCount}</div>
              <div className="text-sm text-pink-200">Chat Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      {isAIEnabled && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">OpenAI Configuration</h3>
          
          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenAI API Key
                <span className="text-pink-300 ml-1">
                  {isApiKeyValid ? '✓ Valid' : '⚠ Not validated'}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-pink-700 rounded text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <Button
                  onClick={handleApiKeyValidation}
                  disabled={isValidating || !tempApiKey.trim()}
                  variant="outline"
                  size="default"
                  className="border-pink-600 text-pink-300 hover:bg-pink-800"
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </Button>
              </div>
              {validationMessage && (
                <p className={`text-sm mt-2 ${
                  validationMessage.includes('valid') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validationMessage}
                </p>
              )}
              <p className="text-xs text-pink-300 mt-1">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">AI Model</label>
              <select
                value={settings.model}
                onChange={(e) => handleSettingChange('model', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-pink-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cost-effective)</option>
                <option value="gpt-4">GPT-4 (Most Capable)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Creativity Level: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-pink-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-pink-300 mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Response Length: {settings.maxTokens} tokens
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={settings.maxTokens}
                onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                className="w-full h-2 bg-pink-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-pink-300 mt-1">
                <span>Short</span>
                <span>Long</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      {isAIEnabled && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">AI Features</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Streaming Responses</div>
                <div className="text-sm text-pink-200">See responses as they're generated</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableStreaming}
                  onChange={(e) => handleSettingChange('enableStreaming', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Suggestions</div>
                <div className="text-sm text-pink-200">Get AI suggestions while typing todos</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSuggestions}
                  onChange={(e) => handleSettingChange('autoSuggestions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Context Awareness</div>
                <div className="text-sm text-pink-200">AI considers your existing todos for better suggestions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.contextAwareness}
                  onChange={(e) => handleSettingChange('contextAwareness', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Usage Management */}
      {isAIEnabled && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Usage Management</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Reset Usage Statistics</div>
              <div className="text-sm text-pink-200">Clear all usage data and chat history</div>
            </div>
            <Button
              onClick={resetUsageStats}
              variant="outline"
              size="default"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              Reset Stats
            </Button>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-blue-500/10 backdrop-blur rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">About AI Features</h3>
        <div className="text-sm text-blue-200 space-y-2">
          <p>• AI features require an OpenAI API key for full functionality</p>
          <p>• Without an API key, you'll get demo responses for testing</p>
          <p>• Your API key is stored locally and never shared</p>
          <p>• Usage costs are based on OpenAI's current pricing</p>
          <p>• All chat data is stored locally in your browser</p>
        </div>
      </div>
    </div>
  );
};