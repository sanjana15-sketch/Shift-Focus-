import React from 'react';
import { RecommendedAction, ExtractedUrlInfo } from '../types';
import { ShieldCheck, XCircle, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';

interface VerificationGuideProps {
  action: RecommendedAction;
  extractedUrls?: ExtractedUrlInfo[];
}

export const VerificationGuide: React.FC<VerificationGuideProps> = ({
  action,
  extractedUrls = [],
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Recommended Action & Safe Verification
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Defensive protocols to verify authentic communications without risking compromise
          </p>
        </div>
      </div>

      {/* Primary Decisive Instruction (from user prompt) */}
      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4">
        <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold mb-1">
          Primary Defensive Directive
        </div>
        <p className="text-sm font-semibold text-white leading-relaxed">
          {action.primaryInstruction}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Safe Steps */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            How to Safely Verify Independently
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {action.safeSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-mono text-emerald-400 text-xs mt-0.5">•</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prohibited Actions (What NOT to do) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-rose-400" />
            Prohibited Actions (Do Not Engage)
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {action.prohibitedActions.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-mono text-rose-400 text-xs mt-0.5">✕</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Safe URL Inspector (Defanged Links) */}
      {extractedUrls.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Safe Link Inspector (Defanged for Safety)
            </span>
            <span className="text-[11px] text-slate-400">Never opened automatically</span>
          </div>

          <div className="space-y-2">
            {extractedUrls.map((url, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60 truncate max-w-lg">
                    {url.safeDisplay}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[11px] uppercase self-start sm:self-auto ${
                    url.isSuspicious
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {url.isSuspicious ? 'High Risk Destination' : 'Standard URL'}
                  </span>
                </div>

                {url.suspicionReasons.length > 0 && (
                  <div className="text-[11px] text-slate-400 pl-2 border-l border-rose-500/40 space-y-0.5">
                    {url.suspicionReasons.map((r, ri) => (
                      <p key={ri}>• {r}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
