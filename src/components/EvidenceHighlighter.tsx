import React, { useState } from 'react';
import { SuspiciousReason } from '../types';
import { FileText, ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';

interface EvidenceHighlighterProps {
  text: string;
  reasons: SuspiciousReason[];
  highlightSpans?: Array<{
    quote: string;
    signalId: string;
    signalLabel: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export const EvidenceHighlighter: React.FC<EvidenceHighlighterProps> = ({
  text,
  reasons,
  highlightSpans = [],
}) => {
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  // Generate highlight items from reasons and spans
  const evidenceItems = reasons.filter((r) => r.excerpt && r.excerpt.trim().length > 0);

  // Highlight color helper
  const getSeverityStyle = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('urgency')) {
      return 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400 hover:bg-amber-500/30';
    }
    if (cat.includes('link') || cat.includes('url')) {
      return 'bg-orange-500/20 text-orange-200 border-b-2 border-orange-400 hover:bg-orange-500/30';
    }
    if (cat.includes('sensitive') || cat.includes('credential')) {
      return 'bg-rose-500/20 text-rose-200 border-b-2 border-rose-400 hover:bg-rose-500/30';
    }
    if (cat.includes('sender') || cat.includes('domain') || cat.includes('impersonat')) {
      return 'bg-purple-500/20 text-purple-200 border-b-2 border-purple-400 hover:bg-purple-500/30';
    }
    if (cat.includes('financial') || cat.includes('payment')) {
      return 'bg-red-500/20 text-red-200 border-b-2 border-red-400 hover:bg-red-500/30';
    }
    return 'bg-blue-500/20 text-blue-200 border-b-2 border-blue-400 hover:bg-blue-500/30';
  };

  // Render text with interactive highlights
  const renderHighlightedText = () => {
    if (!text) return null;

    // Collect all valid quotes to highlight
    const quotes = evidenceItems
      .map((e) => ({
        quote: e.excerpt || '',
        category: e.category,
        explanation: e.explanation,
      }))
      .filter((q) => q.quote && text.toLowerCase().includes(q.quote.toLowerCase()));

    if (quotes.length === 0) {
      return <span className="text-slate-300 font-sans">{text}</span>;
    }

    // Simple robust segmenter
    // Sort quotes by length descending to match longest phrases first
    quotes.sort((a, b) => b.quote.length - a.quote.length);

    let parts: Array<{ text: string; isHighlight: boolean; category?: string; quote?: string }> = [
      { text, isHighlight: false },
    ];

    quotes.forEach(({ quote, category }) => {
      const newParts: typeof parts = [];
      const quoteLower = quote.toLowerCase();

      parts.forEach((part) => {
        if (part.isHighlight) {
          newParts.push(part);
          return;
        }

        let remaining = part.text;
        let index = remaining.toLowerCase().indexOf(quoteLower);

        while (index !== -1) {
          if (index > 0) {
            newParts.push({ text: remaining.slice(0, index), isHighlight: false });
          }

          const matchedText = remaining.slice(index, index + quote.length);
          newParts.push({
            text: matchedText,
            isHighlight: true,
            category,
            quote,
          });

          remaining = remaining.slice(index + quote.length);
          index = remaining.toLowerCase().indexOf(quoteLower);
        }

        if (remaining.length > 0) {
          newParts.push({ text: remaining, isHighlight: false });
        }
      });

      parts = newParts;
    });

    return (
      <div className="leading-relaxed font-sans text-slate-100 text-sm">
        {parts.map((part, idx) => {
          if (part.isHighlight) {
            const isSelected = selectedQuote === part.quote;
            return (
              <mark
                key={idx}
                onClick={() => setSelectedQuote(part.quote || null)}
                className={`px-1 py-0.5 rounded cursor-pointer transition-all ${getSeverityStyle(
                  part.category || ''
                )} ${isSelected ? 'ring-2 ring-white font-semibold' : ''}`}
                title={`Security Signal: ${part.category}`}
              >
                {part.text}
              </mark>
            );
          }
          return <span key={idx}>{part.text}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Cited Textual Evidence
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Exact phrases triggering defensive security signals
        </span>
      </div>

      {/* Interactive Visual Message Box */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 font-sans text-sm shadow-inner">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Analyzed Message Stream</span>
          <span>Click highlighted phrases to inspect signal</span>
        </div>
        {renderHighlightedText()}
      </div>

      {/* Detailed Mapped Evidence Cards */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Evidence Mapping ({evidenceItems.length} Key Indicator{evidenceItems.length === 1 ? '' : 's'})
        </div>

        {evidenceItems.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No specific malicious textual citations identified in this message.</span>
          </div>
        ) : (
          evidenceItems.map((item, i) => {
            const isSelected = selectedQuote === item.excerpt;
            return (
              <div
                key={i}
                onClick={() => setSelectedQuote(item.excerpt || null)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/80 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-mono text-xs">“{item.excerpt}”</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-xs font-semibold text-amber-300">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                    Severity: {item.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 pl-1 border-l border-slate-700">
                  {item.explanation}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
