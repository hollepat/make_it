import { useState, useRef, useEffect, useCallback } from 'react';
import { useAssistant } from '../context/AssistantContext';

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

function NewChatIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className || 'w-4 h-4'}>
      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-message-in">
      <div className="w-8 h-8 rounded-full gradient-teal flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-600/20">
        <span className="text-sm">🏋️</span>
      </div>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center">
          <span
            className="w-2 h-2 bg-teal-500 rounded-full animate-dot-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-teal-400 rounded-full animate-dot-bounce"
            style={{ animationDelay: '200ms' }}
          />
          <span
            className="w-2 h-2 bg-teal-300 rounded-full animate-dot-bounce"
            style={{ animationDelay: '400ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { messages, isLoading, error, sendMessage, clearHistory } = useAssistant();
  const [input, setInput] = useState('');
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

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(trimmed);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-slate-950 overflow-hidden">
      {/* Header with gradient personality */}
      <div className="relative px-5 py-4 flex items-center justify-between flex-shrink-0 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 gradient-teal" />
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)',
          }}
        />
        {/* Bottom edge soft blend */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-teal-800/10" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xl">🏋️</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-white">Coach</h1>
              <SparkleIcon className="w-4 h-4 text-teal-200" />
            </div>
            <p className="text-xs text-teal-100/80 font-medium">AI fitness assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 active:scale-95"
            aria-label="Start new conversation"
            title="Start new conversation"
          >
            <NewChatIcon />
            <span className="text-xs font-medium">New</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        {messages.length === 0 && !isLoading ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-4 animate-fade-in">
              {/* Large avatar area with glow */}
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-teal-200/40 blur-xl" />
                <div className="relative w-20 h-20 rounded-full gradient-teal flex items-center justify-center shadow-lg shadow-teal-600/25">
                  <span className="text-4xl">🏋️</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">
                Your Fitness Coach
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
                Plan workouts, create training sessions, and track your progress.
                Ask me anything to get started.
              </p>
              <div className="space-y-3">
                {[
                  { text: 'Create a 3-day running plan for next week', icon: '🏃' },
                  { text: 'What sessions do I have coming up?', icon: '📅' },
                  { text: 'Add a gym session for tomorrow', icon: '💪' },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => {
                      setInput(suggestion.text);
                      textareaRef.current?.focus();
                    }}
                    className="animate-suggestion-hover w-full text-left px-4 py-3.5 bg-white dark:bg-slate-900 rounded-2xl text-sm text-gray-700 dark:text-slate-300 shadow-sm shadow-gray-200/50 dark:shadow-none flex items-center gap-3 group"
                  >
                    <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 text-base group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                      {suggestion.icon}
                    </span>
                    <span className="font-medium">{suggestion.text}</span>
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
                className={`flex items-start gap-2.5 animate-message-in ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full gradient-teal flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-600/20">
                    <span className="text-sm">🏋️</span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap break-words leading-relaxed ${
                    message.role === 'user'
                      ? 'gradient-user-bubble text-white rounded-2xl rounded-tr-sm shadow-md shadow-teal-600/15'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-2xl rounded-tl-sm shadow-sm'
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
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - frosted glass */}
      <div className="glass border-t border-gray-200/50 dark:border-slate-700/50 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-2.5">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach..."
              rows={1}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm rounded-2xl
                bg-white/70 dark:bg-slate-800 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700
                focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:focus:ring-teal-400/40 focus:border-teal-300 dark:focus:border-teal-400
                focus:bg-white dark:focus:bg-slate-800
                placeholder:text-gray-400 dark:placeholder:text-slate-400
                dark:text-slate-50
                resize-none transition-all duration-200 disabled:opacity-50
                shadow-sm"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`
              p-3 rounded-full transition-all duration-200 active:scale-90 flex-shrink-0
              ${input.trim() && !isLoading
                ? 'gradient-send-btn text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed shadow-none'
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
