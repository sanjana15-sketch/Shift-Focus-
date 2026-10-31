import React, { useState } from 'react';
import { ThreatAnalysisResult } from '../types';
import { AlertCircle, CheckCircle, ShieldCheck, X } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ThreatAnalysisResult | null;
  sender: string;
  claimedOrg: string;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  analysis,
  sender,
  claimedOrg,
}) => {
  const [explanation, setExplanation] = useState('');
  const [senderDomain, setSenderDomain] = useState(sender);
  const [org, setOrg] = useState(claimedOrg);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  if (!isOpen || !analysis) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threatId: analysis.id,
          userExplanation: explanation,
          senderDomain,
          claimedOrg: org,
          originalRiskScore: analysis.riskScore,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setResponseMsg(data.message || 'Challenge feedback recorded.');
      }
    } catch (err) {
      console.error('Failed to submit challenge feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Challenge Classification (False Positive Review)
            </h3>
            <p className="text-xs text-slate-400">
              Submit independent verification details if you believe this is authentic
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 space-y-3 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Challenge Feedback Recorded</h4>
            <p className="text-xs text-emerald-300 leading-relaxed max-w-md mx-auto">
              {responseMsg}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Why the system flagged it */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Why TRUSTLENS issued this warning:</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                {analysis.reasons.map((r, i) => (
                  <li key={i}>
                    <strong className="text-white">{r.category}:</strong> {r.explanation}
                  </li>
                ))}
              </ul>
            </div>

            {/* Crucial requirement from prompt: The system does not blindly change verdict */}
            <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded border border-slate-800 leading-relaxed italic">
              <strong>Evaluation Policy:</strong> The system does not blindly change its verdict just because someone disagrees. Your submission provides domain and provenance metadata for statistical evaluation and model calibration.
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Claimed Organization</label>
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g. RV College of Engineering"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Authentic Domain / Sender</label>
                <input
                  type="text"
                  value={senderDomain}
                  onChange={(e) => setSenderDomain(e.target.value)}
                  placeholder="e.g. registrar@rvce.edu.in"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-300 font-medium">
                Why do you consider this communication legitimate?
              </label>
              <textarea
                rows={3}
                required
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the context (e.g. 'I specifically requested this password reset 2 minutes ago', or 'This matches the official SEE timetable circular on the campus board')..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !explanation.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Submitting Challenge...' : 'Submit Challenge for Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
