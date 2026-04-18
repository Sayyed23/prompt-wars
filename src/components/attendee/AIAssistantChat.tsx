'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Trash2, Cpu, Sparkles, AlertCircle } from 'lucide-react';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages.slice(-5) })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to communicate with AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (!reader) throw new Error('Failed to initialize stream reader');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantContent;
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error('Failed to parse stream chunk:', e);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 md:p-8">
      <div className="glass-panel quantum-card-glow kinetic-border flex flex-col h-[600px] overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-stealth-100/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-md border border-primary/30">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] animate-pulse">Sentinel_Uplink</p>
              <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5 text-white">
                Venue Intelligence <Sparkles className="h-3 w-3 text-secondary" />
              </h2>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 text-stealth-300 hover:text-critical transition-colors"
            title="Clear Analysis"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-stealth-200"
          role="log"
          aria-label="Chat Message History"
          aria-live="polite"
          aria-relevant="additions text"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50"
              >
                <Cpu className="h-12 w-12 text-stealth-300" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting Uplink</p>
                  <p className="text-xs max-w-[200px]">Ask about densities, wait times, or navigate to points of interest.</p>
                </div>
              </motion.div>
            )}
            
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "shrink-0 p-1.5 rounded-sm h-8 w-8 flex items-center justify-center border",
                  msg.role === 'user' ? "bg-stealth-200 border-white/10" : "bg-primary/10 border-primary/20"
                )} aria-hidden="true">
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                </div>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-xl text-sm leading-relaxed shadow-lg transition-all",
                  msg.role === 'user' 
                    ? "bg-primary/20 border border-primary/30 text-white rounded-tr-none text-right" 
                    : "glass-panel bg-white/5 border border-white/10 rounded-tl-none text-left"
                )}>
                  <span className="sr-only">{msg.role === 'user' ? 'You said:' : 'Assistant says:'}</span>
                  {msg.content || (isTyping && i === messages.length - 1 && (
                    <div className="flex items-center gap-2 py-1" aria-label="Processing logic...">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-150" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-300" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {error && (
            <div className="p-3 bg-critical/10 border border-critical/30 rounded-sm flex items-center gap-3 text-critical animate-shake" role="alert">
              <AlertCircle className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase">{error}</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-stealth-100/30 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query venue status..."
              aria-label="Ask the venue assistant"
              className="flex-1 bg-stealth-200/50 border border-white/10 p-2.5 text-xs font-bold font-mono tracking-tight focus:border-primary outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              aria-label="Send message"
              className="bg-primary hover:bg-white text-background p-2.5 transition-colors disabled:opacity-50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[8px] text-stealth-300 uppercase font-black tracking-widest text-center opacity-50">
            End-to-End Encrypted | Gemini Pro 1.5 Interface
          </p>
        </div>
      </div>
    </div>
  );
}
