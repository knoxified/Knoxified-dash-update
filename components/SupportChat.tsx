'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, MessageCircle, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi, I'm here if you have questions about setting up your agent, automations, or your plan. What's on your mind?",
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text || "Could you rephrase that?" }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-slate-900 dark:bg-[#0b1220] border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center z-[9999] transition-transform hover:scale-105"
          style={{ boxShadow: '0 0 20px var(--accent-glow)' }}
        >
          <MessageCircle size={22} style={{ color: 'var(--accent)' }} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-5 w-[360px] h-[540px] max-w-[calc(100vw-20px)] max-h-[calc(100vh-110px)] rounded-2xl overflow-hidden bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-white/10 shadow-2xl z-[9998] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }}
              >
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Knoxified Support</div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-[#020617]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-slate-900 rounded-br-sm'
                      : 'bg-white dark:bg-[#0b1220] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-bl-sm'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: 'var(--accent)' } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-white/10 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask a question..."
                className="flex-1 bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1"
                style={{ ['--tw-ring-color' as any]: 'var(--accent)' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="shrink-0 w-9 h-9 rounded-full disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                style={!input.trim() || isSending ? undefined : { backgroundColor: 'var(--accent)' }}
              >
                <Send className="w-4 h-4 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
