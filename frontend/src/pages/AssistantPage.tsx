import { useState, useRef, useEffect, useCallback } from 'react';
import { assistantApi } from '../services/assistantApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm">🏋️</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await assistantApi.sendMessage({ message: trimmed });
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClearHistory = useCallback(async () => {
    try {
      await assistantApi.clearHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Coach</h1>
          <p className="text-xs text-gray-500">AI fitness assistant</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        {messages.length === 0 && !isLoading ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏋️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Your Fitness Coach
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                I can help you plan workouts, create training sessions, and track your progress. Try asking me something!
              </p>
              <div className="space-y-2">
                {[
                  'Create a 3-day running plan for next week',
                  'What sessions do I have coming up?',
                  'Add a gym session for tomorrow',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 animate-fade-in ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🏋️</span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap break-words ${
                    message.role === 'user'
                      ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Error */}
            {error && (
              <div className="flex justify-center animate-fade-in">
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach..."
            rows={1}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-2xl
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
              bg-gray-50 resize-none transition-shadow disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`
              p-3 rounded-full transition-all duration-200 active:scale-95 flex-shrink-0
              ${input.trim() && !isLoading
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/25'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
