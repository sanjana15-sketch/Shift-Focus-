import React from 'react';
import { SuspiciousReason } from '../types';
import { AlertCircle, Clock, Link2, KeyRound, Globe, DollarSign, UserX, CheckCircle } from 'lucide-react';

interface SignalsBreakdownProps {
  reasons: SuspiciousReason[];
  rawSignals?: Array<{
    id: string;
    label: string;
    detected: boolean;
    severity: string;
    weight: number;
    explanation: string;
  }>;
}

export const SignalsBreakdown: React.FC<SignalsBreakdownProps> = ({
  reasons,
  rawSignals = [],
}) => {
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('urgency')) return <Clock className="w-4 h-4 text-amber-400" />;
    if (cat.includes('link') || cat.includes('url')) return <Link2 className="w-4 h-4 text-orange-400" />;
    if (cat.includes('sensitive') || cat.includes('credential')) return <KeyRound className="w-4 h-4 text-rose-400" />;
    if (cat.includes('domain') || cat.includes('sender') || cat.includes('impersonat')) return <Globe className="w-4 h-4 text-purple-400" />;
    if (cat.includes('financial') || cat.includes('payment')) return <DollarSign className="w-4 h-4 text-red-400" />;
    return <UserX className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Why is this suspicious?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of detected social engineering tactics and deceptive patterns
          </p>
        </div>
      </div>

      {/* Primary Reasons List formatted as in prompt specification */}
      <div className="space-y-3">
        {reasons.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">No Suspicious Threat Signals Detected</p>
              <p className="text-xs text-slate-400 mt-0.5">
                The message does not employ coercive urgency, phishing links, or credential-harvesting triggers.
              </p>
            </div>
          </div>
        ) : (
          reasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  {getCategoryIcon(reason.category)}
                  <span>{reason.category}</span>
                </div>
                {reason.severity && (
                  <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded ${
                    reason.severity === 'high'
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {reason.severity} severity
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 pl-6 leading-relaxed">
                {reason.explanation}
              </p>

              {reason.excerpt && (
                <div className="pl-6 pt-1">
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Cited trigger: “{reason.excerpt}”
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 6 Core Security Signal Matrix */}
      {rawSignals.length > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
            Security Signals Evaluated Matrix
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {rawSignals.map((sig) => (
              <div
                key={sig.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  sig.detected
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${sig.detected ? 'bg-rose-400' : 'bg-slate-600'}`}></span>
                  <span className="font-medium truncate">{sig.label}</span>
                </div>
                <span className="font-mono text-[11px] uppercase">
                  {sig.detected ? 'Flagged' : 'Clear'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
