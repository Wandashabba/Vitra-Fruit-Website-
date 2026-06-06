import React, { useState, useRef, useEffect, useCallback } from 'react';

const OPENING_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm Vitra, your product assistant 👋 Ask me anything about our products, shipping, or orders.",
};

const WA_LINK = 'https://wa.me/27679414223';

function ChatBubbleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width="26"
      height="26"
    >
      <path
        d="M12 3C7.03 3 3 6.69 3 11.2c0 2.3 1.04 4.37 2.72 5.88L4.5 21l4.18-1.55A9.8 9.8 0 0012 19.4c4.97 0 9-3.69 9-8.2C21 6.69 16.97 3 12 3z"
        fill="currentColor"
      />
    </svg>
  );
}

function DotsLoader() {
  return (
    <span className="chatbot-dots" aria-label="Loading response">
      <span />
      <span />
      <span />
    </span>
  );
}

function WhatsAppButton() {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="chatbot-wa-btn"
      aria-label="Continue conversation on WhatsApp"
    >
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="16" height="16">
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
          fill="currentColor"
        />
      </svg>
      Chat on WhatsApp
    </a>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([OPENING_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input after animation
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const shouldShowWA = useCallback((content) => {
    return (
      hasError ||
      /whatsapp/i.test(content) ||
      /0679414223/.test(content) ||
      /wa\.me/i.test(content)
    );
  }, [hasError]);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setHasError(false);

    // Placeholder for streaming bot response
    const botPlaceholder = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, botPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send only user/assistant turns (not the opening message system-side)
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]' || payload === '[ERROR]') break;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: accumulated };
                return next;
              });
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }

      if (!accumulated) {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setHasError(true);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: "Sorry, I'm having trouble right now. Please try again or reach out via WhatsApp.",
        };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show last 20 messages
  const visibleMessages = messages.slice(-20);

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          className="chatbot-window"
          role="dialog"
          aria-modal="true"
          aria-label="Vitra product assistant chat"
          ref={chatWindowRef}
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar" aria-hidden="true">V</span>
              <div>
                <p className="chatbot-title">Vitra Assistant</p>
                <p className="chatbot-subtitle">VitraFruits Product Help</p>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" aria-live="polite" aria-atomic="false">
            {visibleMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLast = idx === visibleMessages.length - 1;
              const showWA =
                msg.role === 'assistant' &&
                isLast &&
                !isLoading &&
                shouldShowWA(msg.content);

              return (
                <div
                  key={idx}
                  className={`chatbot-msg-row ${isUser ? 'chatbot-msg-row--user' : 'chatbot-msg-row--bot'}`}
                >
                  <div
                    className={`chatbot-bubble ${isUser ? 'chatbot-bubble--user' : 'chatbot-bubble--bot'}`}
                  >
                    {isLast && isLoading && msg.content === '' ? (
                      <DotsLoader />
                    ) : (
                      msg.content
                    )}
                  </div>
                  {showWA && <WhatsAppButton />}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-row">
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Ask about products, shipping…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Type your message"
              disabled={isLoading}
              maxLength={500}
            />
            <button
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
                <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close product assistant chat' : 'Open product assistant chat'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="22" height="22">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <ChatBubbleIcon />
        )}
      </button>
    </>
  );
}
