import React from 'react';
import { ThreatAnalysisResult } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle, Info } from 'lucide-react';

interface RiskScoreCardProps {
  analysis: ThreatAnalysisResult;
  onOpenChallengeModal: () => void;
  onReportThreat: () => void;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  analysis,
  onOpenChallengeModal,
  onReportThreat,
}) => {
  const { riskScore, riskLevel, headlineSummary, detectedLanguage, isSynthetic } = analysis;

  // Visual styles per tier
  const getTierBadgeStyle = () => {
    switch (riskLevel) {
      case 'High risk':
      case 'Critical risk':
        return {
          container: 'bg-rose-950/40 border-rose-500/40 text-rose-300',
          badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          scoreColor: 'text-rose-400',
          barColor: 'bg-rose-500',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        };
      case 'Moderate risk':
        return {
          container: 'bg-amber-950/40 border-amber-500/40 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          scoreColor: 'text-amber-400',
          barColor: 'bg-amber-500',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case 'Low risk':
      case 'Safe':
        return {
          container: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          scoreColor: 'text-emerald-400',
          barColor: 'bg-emerald-500',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        };
      default:
        return {
          container: 'bg-slate-900 border-slate-700 text-slate-300',
          badge: 'bg-slate-800 text-slate-400 border border-slate-700',
          scoreColor: 'text-slate-400',
          barColor: 'bg-slate-600',
          icon: <HelpCircle className="w-5 h-5 text-slate-400" />,
        };
    }
  };

  const style = getTierBadgeStyle();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      {/* Header with Title and Classification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            Defensive Security Assessment
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            TRUSTLENS analysis
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {detectedLanguage && (
            <span className="text-xs px-2.5 py-1 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-md font-medium">
              Language: {detectedLanguage}
            </span>
          )}
          <div className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 ${style.badge}`}>
            {style.icon}
            <span>{riskLevel}</span>
          </div>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
        {/* Left: Big Score */}
        <div className="flex flex-col items-start justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-extrabold tracking-tight font-mono tabular-nums ${style.scoreColor}`}>
              {riskScore}
            </span>
            <span className="text-lg font-semibold text-slate-400 font-mono">/100</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${style.barColor}`}
              style={{ width: `${riskScore}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400 italic mt-2">
            Illustrative risk score, not a real calibrated probability.
          </p>
        </div>

        {/* Center: Headline Summary */}
        <div className="md:col-span-2 space-y-2">
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {headlineSummary}
          </p>
          {isSynthetic && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300/80 bg-amber-950/20 px-2.5 py-1 rounded border border-amber-800/30">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Illustrative synthetic message, not an actual bank message.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer: Challenge false positive or Report threat */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800/80">
        <button
          type="button"
          onClick={onOpenChallengeModal}
          className="text-slate-400 hover:text-slate-200 underline decoration-slate-600 hover:decoration-slate-400 underline-offset-4 cursor-pointer transition-colors"
        >
          I think this message is legitimate (Challenge false positive)
        </button>

        <button
          type="button"
          onClick={onReportThreat}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md transition-all cursor-pointer font-medium"
        >
          Index in Secure Threat Database
        </button>
      </div>
    </div>
  );
};
