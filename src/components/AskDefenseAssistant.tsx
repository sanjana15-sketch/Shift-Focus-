import React, { useState } from 'react';
import { MessageSquare, Send, ShieldCheck, HelpCircle } from 'lucide-react';

interface AskDefenseAssistantProps {
  messageContext: string;
  riskScore: number;
}

export const AskDefenseAssistant: React.FC<AskDefenseAssistantProps> = ({
  messageContext,
  riskScore,
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: 'I am your TrustLens Defensive Advisor. Ask me anything about this message, damage control steps if you clicked a link, or how to block and report senders safely.',
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const suggestedQuestions = [
    'What should I do if I already clicked the link?',
    'Is it safe to text STOP to unsubscribe?',
    'How do I report this number to my phone carrier?',
  ];

  const handleSend = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim() || isAsking) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/chat-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          messageContext,
          riskScore,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: data.answer || 'Contact your institution directly through official phone numbers.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'If you clicked a link, immediately change your passwords from a clean device and call your bank’s official fraud number on the back of your card.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Ask Defensive Advisor
          </h3>
        </div>
        <span className="text-xs text-slate-400">Interactive Incident & Damage Control Guidance</span>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-1.5">
        {suggestedQuestions.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(sq)}
            className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer text-left"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5 max-h-60 overflow-y-auto text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1 text-slate-400">
                {m.sender === 'user' ? 'You' : 'TRUSTLENS Defensive Advisor'}
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {isAsking && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-lg p-2.5 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Formulating defensive response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question (e.g. 'What if I entered my password?')..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
