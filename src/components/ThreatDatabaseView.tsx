import React, { useState, useEffect } from 'react';
import { ReportedThreat } from '../types';
import { Database, Search, Download, ShieldCheck, Hash, ExternalLink, Filter } from 'lucide-react';

interface ThreatDatabaseViewProps {
  onOpenReportModal: () => void;
}

export const ThreatDatabaseView: React.FC<ThreatDatabaseViewProps> = ({
  onOpenReportModal,
}) => {
  const [threats, setThreats] = useState<ReportedThreat[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vectorFilter, setVectorFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchThreats = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/threats', window.location.origin);
      if (categoryFilter !== 'all') url.searchParams.set('category', categoryFilter);
      if (vectorFilter !== 'all') url.searchParams.set('vector', vectorFilter);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setThreats(data.data);
      }
    } catch (err) {
      console.error('Failed to load threats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, [categoryFilter, vectorFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchThreats();
  };

  const handleExport = () => {
    window.open('/api/threats/export', '_blank');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Secure Threat Reporting Database
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Decentralized community repository of cryptographically hashed, zero-PII scam signatures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            title="Download STIX 2.1 Threat Intel Feed"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Intel (JSON)</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
          >
            Report New Threat
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search campaigns, brands, or indicators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Threat Categories</option>
          <option value="bank">Banking & Account Suspension</option>
          <option value="kyc">KYC & Identity Verification</option>
          <option value="utility">Utility & Electricity Extortion</option>
          <option value="delivery">Parcel Delivery Fees</option>
          <option value="fine">Government & Traffic Fines</option>
        </select>

        <select
          value={vectorFilter}
          onChange={(e) => setVectorFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Message Vectors</option>
          <option value="sms">SMS / Smishing</option>
          <option value="email">Email Phishing</option>
          <option value="chat">WhatsApp / Direct Message</option>
        </select>
      </form>

      {/* Threats Table / List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading verified threat repository...</div>
        ) : threats.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
            No threats matching your search criteria.
          </div>
        ) : (
          threats.map((threat) => (
            <div
              key={threat.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {threat.id}
                  </span>
                  <h4 className="text-sm font-bold text-white">{threat.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-800 text-slate-300 uppercase">
                    Vector: {threat.vector}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-rose-950/60 border border-rose-800/40 text-rose-300 font-bold tabular-nums">
                    Score: {threat.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Anonymized Message Snippet */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded p-2.5 font-mono text-xs text-slate-300 leading-relaxed">
                “{threat.anonymizedSnippet}”
              </div>

              {/* Indicators & Cryptographic Signature */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-slate-400 font-medium">Indicators:</span>
                  {threat.indicators.map((ind, idx) => (
                    <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 text-[11px]">
                      {ind}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span title={threat.signatureHash}>SHA256: {threat.signatureHash.slice(0, 16)}...</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-emerald-400 font-semibold">{threat.reportsCount} Reports</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
