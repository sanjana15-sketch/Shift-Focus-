import React, { useState, useMemo, useRef } from 'react';
import { MessageType, SyntheticExample } from '../types';
import { SYNTHETIC_EXAMPLES } from '../data/syntheticLibrary';
import { scrubPII } from '../utils/privacyScrubber';
import { SCREENSHOT_PRESETS, generateSyntheticScreenshot } from '../utils/syntheticScreenshotGenerator';
import { Shield, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2, Upload, Image as ImageIcon, X, FileText, Camera } from 'lucide-react';

interface MessageInputProps {
  message: string;
  onChangeMessage: (val: string) => void;
  messageType: MessageType;
  onChangeMessageType: (type: MessageType) => void;
  sender: string;
  onChangeSender: (sender: string) => void;
  claimedOrg: string;
  onChangeClaimedOrg: (org: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onSelectSyntheticExample: (ex: SyntheticExample) => void;
  uploadedImage: { base64: string; mimeType: string } | null;
  onUploadImage: (img: { base64: string; mimeType: string } | null) => void;
  inputMode: 'text' | 'screenshot';
  onChangeInputMode: (mode: 'text' | 'screenshot') => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  onChangeMessage,
  messageType,
  onChangeMessageType,
  sender,
  onChangeSender,
  claimedOrg,
  onChangeClaimedOrg,
  language,
  onChangeLanguage,
  onAnalyze,
  isLoading,
  onSelectSyntheticExample,
  uploadedImage,
  onUploadImage,
  inputMode,
  onChangeInputMode,
}) => {
  const [showPrivacyPreview, setShowPrivacyPreview] = useState(false);
  const [isGeneratingPreset, setIsGeneratingPreset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live PII scrub inspection
  const scrubResult = useMemo(() => {
    return scrubPII(message);
  }, [message]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadImage({
          base64: reader.result,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUploadImage({
            base64: reader.result,
            mimeType: file.type || 'image/jpeg',
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Click-to-Test Synthetic Screenshot
  const handleLoadPresetScreenshot = async (preset: typeof SCREENSHOT_PRESETS[0]) => {
    setIsGeneratingPreset(true);
    try {
      const base64Url = await generateSyntheticScreenshot(preset);
      onUploadImage({
        base64: base64Url,
        mimeType: 'image/png',
      });
      // Also pre-fill expected sender if helpful
      onChangeSender(preset.sender);
    } catch (err) {
      console.error('Failed to generate synthetic screenshot:', err);
    } finally {
      setIsGeneratingPreset(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      {/* Header and Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Defensive Message & Screenshot Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyses social engineering, obfuscated URLs, and coercive signals without collecting personal information.
          </p>
        </div>

        {/* Input Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeInputMode('text')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              inputMode === 'text'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeInputMode('screenshot')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              inputMode === 'screenshot'
                ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-700/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Screenshot</span>
            {uploadedImage && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Screenshot Upload Mode */}
      {inputMode === 'screenshot' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              Upload SMS, WhatsApp, or Email Screenshot
            </span>
            <span className="text-slate-400 text-[11px]">
              Supports PNG, JPG, WEBP · Multimodal OCR & Vision Signal Extraction
            </span>
          </div>

          {/* Drag & Drop Upload Container */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 transition-all text-center relative ${
              uploadedImage
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {uploadedImage ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="relative group">
                  <img
                    src={uploadedImage.base64}
                    alt="Uploaded Message Screenshot"
                    className="max-h-56 max-w-xs object-contain rounded-lg border border-slate-700 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUploadImage(null)}
                    className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                    title="Remove Screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-left space-y-2 max-w-sm">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Screenshot Ready for Multimodal Analysis
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    TRUSTLENS will OCR the visual message, extract sender phone/name, defang URLs, and cross-evaluate the 6 defensive security signals.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      onClick={() => onUploadImage(null)}
                      className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer space-y-3 py-3"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Click to browse or drag and drop a screenshot here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload a phone screen grab of an SMS smishing attempt, WhatsApp message, or email notification
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Click-to-Test Synthetic Screenshot Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Don't have a screenshot handy? Click a synthetic phone screen to test:
              </span>
              {isGeneratingPreset && (
                <span className="text-[11px] text-emerald-400 font-mono animate-pulse">
                  Generating canvas screenshot...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SCREENSHOT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isGeneratingPreset}
                  onClick={() => handleLoadPresetScreenshot(preset)}
                  className="text-xs p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all text-left flex flex-col gap-1 cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate text-[11px]">{preset.name}</span>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400">
                      {preset.platform}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{preset.sender}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Synthetic Library Quick Picker (when in text mode) */}
      {inputMode === 'text' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Synthetic Demonstration Examples (Click to Test):
            </span>
            <span className="text-[11px] text-slate-400">English · Kannada · Kanglish · College · Bank</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SYNTHETIC_EXAMPLES.slice(0, 5).map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelectSyntheticExample(ex)}
                className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 rounded-md transition-all text-left flex items-center gap-1.5 cursor-pointer"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ex.isScam ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                <span className="font-medium truncate max-w-[200px]">{ex.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onSelectSyntheticExample(SYNTHETIC_EXAMPLES[5])}
              className="text-xs px-2.5 py-1 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Legit 2FA Control</span>
            </button>
          </div>
        </div>
      )}

      {/* Metadata Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Message Type</label>
          <select
            value={messageType}
            onChange={(e) => onChangeMessageType(e.target.value as MessageType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="sms">SMS / Text Message</option>
            <option value="email">Email</option>
            <option value="chat">WhatsApp / Telegram / DM</option>
            <option value="qr">QR / Voicemail Transcript</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="auto">Auto-Detect</option>
            <option value="en">English</option>
            <option value="kn">Kannada (ಕನ್ನಡ)</option>
            <option value="kn-en">Kanglish (Code-Mixed)</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Claimed Organisation</label>
          <input
            type="text"
            placeholder="e.g. Acme Bank, SBI, RV College"
            value={claimedOrg}
            onChange={(e) => onChangeClaimedOrg(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Sender Address / Number</label>
          <input
            type="text"
            placeholder="e.g. +1 (800) 555-0199 or email"
            value={sender}
            onChange={(e) => onChangeSender(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Message Textarea (in text mode or for screenshot transcription review) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="text-slate-300 font-medium">
            {inputMode === 'screenshot' ? 'Message Text (OCR Transcribed from Screenshot or Manual)' : 'Message Body'}
          </label>
          <div className="flex items-center gap-2">
            {/* Privacy Shield toggle button */}
            <button
              type="button"
              onClick={() => setShowPrivacyPreview(!showPrivacyPreview)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3 h-3" />
              <span>{scrubResult.totalRedacted > 0 ? `${scrubResult.totalRedacted} PII Masked` : 'Privacy Shield Active'}</span>
              {showPrivacyPreview ? <EyeOff className="w-3 h-3 ml-0.5" /> : <Eye className="w-3 h-3 ml-0.5" />}
            </button>
            <span className="text-slate-400 font-mono text-[11px]">{message.length} chars</span>
          </div>
        </div>

        <textarea
          rows={3}
          value={message}
          onChange={(e) => onChangeMessage(e.target.value)}
          placeholder={
            inputMode === 'screenshot'
              ? 'When you click "Analyse Screenshot", the extracted text will appear here automatically...'
              : 'Paste SMS, email text, WhatsApp message, or security notification here...'
          }
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
        />
      </div>

      {/* Privacy Preview Card (when toggled) */}
      {showPrivacyPreview && (
        <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Privacy Shield Pre-flight Inspection
            </span>
            <span className="text-slate-400">Zero raw PII transmitted or stored</span>
          </div>
          <div className="bg-slate-900/90 rounded p-2.5 font-mono text-[12px] text-slate-300 whitespace-pre-wrap leading-relaxed">
            {scrubResult.sanitizedText || '(Empty message)'}
          </div>
          {scrubResult.tokensRedacted.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-slate-400">Redacted Tokens:</span>
              {scrubResult.tokensRedacted.map((tok) => (
                <span key={tok.type} className="bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded font-mono text-[11px]">
                  {tok.placeholder} × {tok.count}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-[11px]">
              No sensitive phone numbers, credit cards, or account numbers detected in the current message.
            </p>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>
            {inputMode === 'screenshot'
              ? 'Multimodal vision model reads screenshot, scrubs detected PII, and runs 6-signal scam analysis.'
              : 'Evaluates 6 defensive signals: urgency, domain mismatch, obfuscated URLs, credentials, financial & provenance.'}
          </span>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading || (inputMode === 'text' && !message.trim()) || (inputMode === 'screenshot' && !uploadedImage && !message.trim())}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              <span>{inputMode === 'screenshot' ? 'Scanning Screenshot & Evaluating...' : 'Analysing Security Signals...'}</span>
            </>
          ) : (
            <>
              {inputMode === 'screenshot' ? <Camera className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              <span>{inputMode === 'screenshot' ? 'Scan & Analyse Screenshot' : 'Analyse Message with TRUSTLENS'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
