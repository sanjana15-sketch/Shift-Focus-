import React from 'react';
import { ShieldCheck, AlertTriangle, Database, BookOpen, Lock } from 'lucide-react';

interface HeaderProps {
  activeTab: 'analyzer' | 'synthetic' | 'radar' | 'database' | 'privacy';
  onSelectTab: (tab: 'analyzer' | 'synthetic' | 'radar' | 'database' | 'privacy') => void;
  onOpenReportModal: () => void;
  activeAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenReportModal,
  activeAlertsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <button
              onClick={() => onSelectTab('analyzer')}
              className="text-left cursor-pointer focus:outline-none"
            >
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                TRUSTLENS
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('analyzer')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'analyzer'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Defensive Analyzer
            </button>
            <button
              onClick={() => onSelectTab('synthetic')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'synthetic'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Synthetic Library
            </button>
            <button
              onClick={() => onSelectTab('radar')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Radar</span>
              {activeAlertsCount > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded">
                  {activeAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('database')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Secure Database
            </button>
            <button
              onClick={() => onSelectTab('privacy')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Privacy Shield
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors rounded-lg whitespace-nowrap shadow-sm shadow-emerald-950/40 cursor-pointer"
            >
              Report Threat
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
