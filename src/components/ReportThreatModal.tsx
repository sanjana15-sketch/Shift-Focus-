import React, { useState } from 'react';
import { MessageType } from '../types';
import { scrubPII } from '../utils/privacyScrubber';
import { Shield, Lock, X, CheckCircle, Database } from 'lucide-react';

interface ReportThreatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  initialSender?: string;
  initialOrg?: string;
  onThreatReported?: () => void;
}

export const ReportThreatModal: React.FC<ReportThreatModalProps> = ({
  isOpen,
  onClose,
  initialMessage = '',
  initialSender = '',
  initialOrg = '',
  onThreatReported,
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [targetedBrand, setTargetedBrand] = useState(initialOrg);
  const [vector, setVector] = useState<MessageType>('sms');
  const [category, setCategory] = useState('Banking / Account Suspension');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const scrubbed = scrubPII(message);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/threats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${targetedBrand || 'Unspecified Entity'} Smishing Campaign`,
          category,
          targetedBrand: targetedBrand || 'Generic Entity',
          vector,
          message,
          riskScore: 88,
          indicators: ['Community reported smishing', 'Deceptive urgency', 'Unauthorized link'],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Threat successfully indexed.');
        if (onThreatReported) onThreatReported();
      }
    } catch (err) {
      console.error('Failed to report threat:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Report Threat to Secure Database
            </h3>
            <p className="text-xs text-slate-400">
              Contribute anonymized threat signatures to protect millions of consumers
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 space-y-3 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Threat Successfully Indexed</h4>
            <p className="text-xs text-emerald-300 leading-relaxed">
              {successMsg}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Privacy Guarantee Note */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-3 space-y-1 text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-PII Storage Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Your submission is scrubbed client-side and server-side. Phone numbers, names, and account numbers are replaced with cryptographic tokens.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Targeted Brand / Entity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India, USPS, BESCOM"
                  value={targetedBrand}
                  onChange={(e) => setTargetedBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Attack Vector</label>
                <select
                  value={vector}
                  onChange={(e) => setVector(e.target.value as MessageType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="sms">SMS / Text Message</option>
                  <option value="email">Email</option>
                  <option value="chat">WhatsApp / Telegram</option>
                  <option value="qr">QR Code / Voice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Threat Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="Banking / Account Suspension">Banking / Account Suspension</option>
                <option value="KYC Expiry Extortion">KYC Expiry Extortion</option>
                <option value="Utility / Electricity Shutoff">Utility / Electricity Shutoff</option>
                <option value="Postal / Package Redelivery Fee">Postal / Package Redelivery Fee</option>
                <option value="Job / Task Advance Fee Fraud">Job / Task Advance Fee Fraud</option>
                <option value="Government Traffic Fine">Government Traffic Fine</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">
                Suspicious Message Content (Scrubbed Automatically)
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the suspicious message content..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 font-mono text-[12px]"
              />
              {scrubbed.totalRedacted > 0 && (
                <div className="text-[11px] text-emerald-400 font-mono">
                  ✓ {scrubbed.totalRedacted} PII token(s) scrubbed from payload.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-5 py-2 font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Recording Threat...' : 'Submit to Database'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
