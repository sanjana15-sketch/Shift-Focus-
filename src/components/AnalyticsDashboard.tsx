import React, { useEffect, useState } from 'react';
import { BarChart3, ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle, Layers } from 'lucide-react';

interface AnalyticsData {
  totalSignatures: number;
  totalCommunityReports: number;
  tierBreakdown: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    inconclusive: number;
  };
  topTargetedBrands: string[];
  activeAlertsCount: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch('/api/threats/stats')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error fetching stats:', err));
  }, []);

  if (!data) return null;

  const totalClassified =
    data.tierBreakdown.highRisk +
    data.tierBreakdown.mediumRisk +
    data.tierBreakdown.lowRisk +
    data.tierBreakdown.inconclusive;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Threat Intelligence & Risk Tier Distribution
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono tabular-nums">
          {totalClassified} Signatures Indexed
        </span>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* High Risk */}
        <div className="bg-slate-950/70 border border-rose-900/40 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> High Risk
            </span>
            <span className="font-mono tabular-nums">
              {Math.round((data.tierBreakdown.highRisk / totalClassified) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {data.tierBreakdown.highRisk}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: `${(data.tierBreakdown.highRisk / totalClassified) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Medium Risk */}
        <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk
            </span>
            <span className="font-mono tabular-nums">
              {Math.round((data.tierBreakdown.mediumRisk / totalClassified) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {data.tierBreakdown.mediumRisk}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${(data.tierBreakdown.mediumRisk / totalClassified) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Low Risk
            </span>
            <span className="font-mono tabular-nums">
              {Math.round((data.tierBreakdown.lowRisk / totalClassified) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {data.tierBreakdown.lowRisk}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${(data.tierBreakdown.lowRisk / totalClassified) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Inconclusive */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Inconclusive
            </span>
            <span className="font-mono tabular-nums">
              {Math.round((data.tierBreakdown.inconclusive / totalClassified) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {data.tierBreakdown.inconclusive}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-slate-600 h-full rounded-full"
              style={{ width: `${(data.tierBreakdown.inconclusive / totalClassified) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Targeted Brands & Sectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
        <span className="text-slate-400">Top Targeted Brands in Database:</span>
        <div className="flex flex-wrap gap-1.5">
          {data.topTargetedBrands.map((brand, i) => (
            <span key={i} className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-medium">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
