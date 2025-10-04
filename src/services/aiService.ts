// AI Service for OpenAI integration
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIServiceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

class AIService {
  private config: AIServiceConfig;
  private baseURL = 'https://api.openai.com/v1';

  constructor(config: Partial<AIServiceConfig> = {}) {
    // FIX: Removed process.env - API key should be set via AIContext updateSettings
    this.config = {
      apiKey: config.apiKey || undefined, // Will be set from AIContext settings
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
    };
  }

  async sendMessage(
    messages: ChatMessage[],
    context?: {
      todoContext?: any[];
      userPreferences?: any;
      chatType?: 'general' | 'todo-suggestions' | 'productivity' | 'help';
    }
  ): Promise<ChatMessage> {
    if (!this.config.apiKey) {
      // Fallback to mock responses for demo
      return this.getMockResponse(messages[messages.length - 1], context);
    }

    try {
      const systemPrompt = this.generateSystemPrompt(context);
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: formattedMessages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: ChatCompletionResponse = await response.json();
      
      return {
        id: data.id,
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now(),
        tokens: data.usage.total_tokens,
      };
    } catch (error) {
      console.error('AI Service error:', error);
      // Fallback to mock response on error
      return this.getMockResponse(messages[messages.length - 1], context);
    }
  }

  async streamMessage(
    messages: ChatMessage[],
    context?: any,
    onChunk?: (chunk: string) => void
  ): Promise<ChatMessage> {
    if (!this.config.apiKey) {
      return this.getStreamingMockResponse(messages[messages.length - 1], context, onChunk);
    }

    try {
      const systemPrompt = this.generateSystemPrompt(context);
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: formattedMessages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk?.(content);
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }

      return {
        id: `stream-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Streaming AI Service error:', error);
      return this.getStreamingMockResponse(messages[messages.length - 1], context, onChunk);
    }
  }

  // Method to update API key (called from AIContext)
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  private generateSystemPrompt(context?: any): string {
    const basePrompt = `You are an AI assistant for a advanced todo management app. You help users with:
- Creating and organizing todos
- Productivity advice and time management
- Breaking down complex tasks
- Setting priorities and deadlines
- General task management strategies

Be helpful, concise, and practical. Focus on actionable advice.`;

    if (context?.todoContext) {
      const todoContext = `\n\nUser's current todos: ${JSON.stringify(context.todoContext, null, 2)}`;
      return basePrompt + todoContext;
    }

    if (context?.chatType === 'todo-suggestions') {
      return basePrompt + '\n\nFocus specifically on helping create and improve todo items.';
    }

    if (context?.chatType === 'productivity') {
      return basePrompt + '\n\nFocus on productivity tips, time management, and workflow optimization.';
    }

    return basePrompt;
  }

  private async getMockResponse(lastMessage: ChatMessage, context?: any): Promise<ChatMessage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = {
      general: [
        "I'd be happy to help you with your todos! What specific task would you like assistance with?",
        "Great question! Here are some suggestions for managing your tasks more effectively...",
        "Based on your todo list, I notice you could benefit from prioritizing your tasks. Let me help you with that.",
        "I can help you break down that complex task into smaller, manageable steps. Would you like me to do that?"
      ],
      'todo-suggestions': [
        "Here are some improved todo suggestions based on your input:\n\n1. Break it into smaller steps\n2. Add a specific deadline\n3. Include actionable verbs\n4. Consider the time required",
        "I can help you create SMART todos (Specific, Measurable, Achievable, Relevant, Time-bound). What task would you like to improve?",
        "Let me suggest some related tasks that might help you accomplish your goal more effectively..."
      ],
      productivity: [
        "Here are some productivity tips for managing your todos:\n\n1. Use the 2-minute rule\n2. Time-block your calendar\n3. Batch similar tasks\n4. Take regular breaks",
        "Consider using the Eisenhower Matrix to prioritize your tasks. I can help you categorize them!",
        "The Pomodoro Technique might be perfect for your workflow. Would you like me to explain how to implement it?"
      ]
    };

    const contextType = context?.chatType || 'general';
    const responseArray = responses[contextType as keyof typeof responses] || responses.general;
    const randomResponse = responseArray[Math.floor(Math.random() * responseArray.length)];

    return {
      id: `mock-${Date.now()}`,
      role: 'assistant',
      content: randomResponse,
      timestamp: Date.now(),
    };
  }

  private async getStreamingMockResponse(
    lastMessage: ChatMessage, 
    context?: any, 
    onChunk?: (chunk: string) => void
  ): Promise<ChatMessage> {
    const response = await this.getMockResponse(lastMessage, context);
    const words = response.content.split(' ');
    let fullContent = '';

    // Simulate streaming by sending words one by one
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      const chunk = word + ' ';
      fullContent += chunk;
      onChunk?.(chunk);
    }

    return {
      ...response,
      content: fullContent.trim(),
    };
  }

  generateTodoSuggestions(input: string): string[] {
    const suggestions = [
      `${input} - Set deadline for tomorrow`,
      `Break down: ${input} into smaller tasks`,
      `Research ${input} requirements and dependencies`,
      `Schedule time block for ${input}`,
      `Create checklist for ${input} completion`,
      `Review and prioritize ${input}`,
      `Gather resources needed for ${input}`,
    ];

    return suggestions
      .filter(() => Math.random() > 0.4) // Randomly select suggestions
      .slice(0, 3);
  }

  async analyzeProductivity(todos: any[]): Promise<string> {
    const completed = todos.filter(t => t.completed).length;
    const total = todos.length;
    const completionRate = total > 0 ? (completed / total * 100) : 0;

    await new Promise(resolve => setTimeout(resolve, 1000));

    return `Based on your ${total} todos with ${completed} completed (${completionRate.toFixed(1)}% completion rate):

${completionRate > 80 ? '🎉 Excellent productivity!' : completionRate > 60 ? '👍 Good progress!' : '💪 Room for improvement!'}

Recommendations:
• ${completionRate < 50 ? 'Focus on completing existing tasks before adding new ones' : 'Consider breaking down larger tasks'}
• ${todos.length > 20 ? 'You might have too many todos - try prioritizing' : 'Great manageable todo count'}
• Schedule specific time blocks for important tasks
• Use the 2-minute rule for quick tasks`;
  }
}

export const aiService = new AIService();
export type { ChatMessage };
export default AIService;