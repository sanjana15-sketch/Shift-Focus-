import React from 'react';
import { SyntheticExample } from '../types';
import { SYNTHETIC_EXAMPLES } from '../data/syntheticLibrary';
import { BookOpen, ArrowRight, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface SyntheticLibraryViewProps {
  onSelectExample: (ex: SyntheticExample) => void;
}

export const SyntheticLibraryView: React.FC<SyntheticLibraryViewProps> = ({
  onSelectExample,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Synthetic Demonstration Library
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Curated benchmark test cases spanning multiple languages, message formats, smishing attacks, and legitimate negative controls
          </p>
        </div>

        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
          {SYNTHETIC_EXAMPLES.length} Benchmark Test Cases
        </span>
      </div>

      {/* Grid of Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {SYNTHETIC_EXAMPLES.map((ex) => {
          return (
            <div
              key={ex.id}
              onClick={() => onSelectExample(ex)}
              className="bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-4 space-y-3 cursor-pointer transition-all hover:bg-slate-950 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ex.isScam ? (
                    <span className="text-[11px] font-mono uppercase bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Expected: Scam
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Expected: Legitimate
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    {ex.languageName}
                  </span>
                </div>

                <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-semibold">
                  Test This <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {ex.label}
                </h4>
                <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  Sender: {ex.sender}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded p-2.5 font-sans text-xs text-slate-300 line-clamp-2 leading-relaxed">
                “{ex.text}”
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {ex.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
