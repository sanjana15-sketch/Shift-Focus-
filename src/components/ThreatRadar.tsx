import React, { useState } from 'react';
import { LiveThreatAlert } from '../types';
import { AlertTriangle, Radio, Shield, MapPin, Zap, RefreshCw } from 'lucide-react';

interface ThreatRadarProps {
  alerts: LiveThreatAlert[];
  onSimulateIncomingAlert: () => void;
}

export const ThreatRadar: React.FC<ThreatRadarProps> = ({
  alerts,
  onSimulateIncomingAlert,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Real-Time Scam & Smishing Radar
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active cellular and messaging threat campaigns broadcasted in real time across telecommunication nodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'critical'
                  ? 'bg-rose-950 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'warning'
                  ? 'bg-amber-950 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Warning
            </button>
          </div>

          <button
            type="button"
            onClick={onSimulateIncomingAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Incoming Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'critical';
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {alert.id}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {alert.timestamp}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white pt-1">
                    {alert.headline}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded tabular-nums">
                    {alert.blockedCount}+ blocks reported
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {alert.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Target: <strong className="text-slate-200">{alert.targetedSector}</strong></span>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regions: <span className="text-slate-200">{alert.activeInRegions.join(', ')}</span></span>
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span>Known IOC: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 border border-slate-800">{alert.iocSample}</code></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
