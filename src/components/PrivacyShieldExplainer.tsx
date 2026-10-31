import React from 'react';
import { Lock, ShieldCheck, EyeOff, Key, Database, Cpu } from 'lucide-react';

export const PrivacyShieldExplainer: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Privacy-Conscious Defensive Architecture
          </h3>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded font-mono">
          Zero-PII Compliance
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
        TRUSTLENS is engineered on the principle that defensive security must never become a surveillance apparatus. Consumers frequently receive scam messages containing their personal names, truncated account numbers, phone numbers, or residential addresses. Here is how TRUSTLENS guarantees user privacy:
      </p>

      {/* 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <EyeOff className="w-4 h-4 text-emerald-400" />
            1. Client-Side PII Tokenization
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Before any text is sent to the defensive engine, an on-device regex sanitizer detects phone numbers, 16-digit payment card numbers, IBAN/account numbers, personal recipient names, and one-time verification passcodes, replacing them with cryptographic tokens like <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">[REDACTED_PHONE]</code> and <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">[REDACTED_CARD_NUMBER]</code>.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-blue-400" />
            2. Ephemeral In-Memory Inference
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Message analysis runs ephemerally in RAM. Raw input texts are never committed to persistent databases or training logs. Once the risk score, security indicators, and evidence quotes are calculated, the in-flight buffer is discarded immediately.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <Key className="w-4 h-4 text-purple-400" />
            3. Cryptographic Signature Hashing
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When a user chooses to submit an active scam to the Threat Database, the platform generates a one-way SHA-256 hash of the canonicalized scam pattern. This allows community detection of mass smishing waves without storing who received them.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            4. Zero Automated Action Execution
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Per cybersecurity defensive mandates, TRUSTLENS never automatically navigates to links, never clicks buttons, and never sends automated SMS replies (like "STOP", which confirms to attackers that a phone number is active). Users retain complete control.
          </p>
        </div>
      </div>
    </div>
  );
};
