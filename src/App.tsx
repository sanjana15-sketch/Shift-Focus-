import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MessageInput } from './components/MessageInput';
import { RiskScoreCard } from './components/RiskScoreCard';
import { EvidenceHighlighter } from './components/EvidenceHighlighter';
import { SignalsBreakdown } from './components/SignalsBreakdown';
import { VerificationGuide } from './components/VerificationGuide';
import { AskDefenseAssistant } from './components/AskDefenseAssistant';
import { ThreatRadar } from './components/ThreatRadar';
import { ThreatDatabaseView } from './components/ThreatDatabaseView';
import { SyntheticLibraryView } from './components/SyntheticLibraryView';
import { PrivacyShieldExplainer } from './components/PrivacyShieldExplainer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ChallengeModal } from './components/ChallengeModal';
import { ReportThreatModal } from './components/ReportThreatModal';
import { LiveThreatAlert, MessageType, SyntheticExample, ThreatAnalysisResult } from './types';
import { SYNTHETIC_EXAMPLES } from './data/syntheticLibrary';
import { ShieldCheck, AlertTriangle, Bell, Zap, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'synthetic' | 'radar' | 'database' | 'privacy'>('analyzer');

  // Input states
  const [message, setMessage] = useState<string>(SYNTHETIC_EXAMPLES[0].text);
  const [messageType, setMessageType] = useState<MessageType>('sms');
  const [sender, setSender] = useState<string>(SYNTHETIC_EXAMPLES[0].sender);
  const [claimedOrg, setClaimedOrg] = useState<string>('Acme Bank');
  const [language, setLanguage] = useState<string>('en');
  const [inputMode, setInputMode] = useState<'text' | 'screenshot'>('text');
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // Analysis state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ThreatAnalysisResult | null>(null);
  const [rawSignals, setRawSignals] = useState<any[]>([]);
  const [highlightSpans, setHighlightSpans] = useState<any[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Modals state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Alerts state
  const [alerts, setAlerts] = useState<LiveThreatAlert[]>([]);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Load initial alerts from backend
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Run initial analysis with the prompt's default example
    runAnalysis(SYNTHETIC_EXAMPLES[0].text, 'sms', SYNTHETIC_EXAMPLES[0].sender, 'Acme Bank', 'en', null, 'text');
  }, []);

  const runAnalysis = async (
    msgText = message,
    mType = messageType,
    sdr = sender,
    cOrg = claimedOrg,
    lang = language,
    img = uploadedImage,
    mode = inputMode
  ) => {
    if (mode === 'text' && !msgText.trim()) return;
    if (mode === 'screenshot' && !img && !msgText.trim()) return;

    setIsLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          messageType: mType,
          sender: sdr,
          claimedOrg: cOrg,
          language: lang,
          image: mode === 'screenshot' ? img : undefined,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult(resData.data);
        setRawSignals(resData.rawSignals || []);
        setHighlightSpans(resData.highlightSpans || []);
        if (resData.extractedText) {
          setMessage(resData.extractedText);
        }
        if (resData.extractedSender && (!sdr || sdr.startsWith('+1 (800) 555-0199'))) {
          setSender(resData.extractedSender);
        }
        if (resData.extractedClaimedOrg && (!cOrg || cOrg === 'Acme Bank')) {
          setClaimedOrg(resData.extractedClaimedOrg);
        }
      } else {
        setAnalysisError(resData.error || 'Failed to complete analysis.');
      }
    } catch (err: any) {
      setAnalysisError('Network communication error during threat analysis.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSynthetic = (ex: SyntheticExample) => {
    setInputMode('text');
    setUploadedImage(null);
    setMessage(ex.text);
    setMessageType(ex.type);
    setSender(ex.sender);
    setLanguage(ex.language);
    const org = ex.sender.includes('[Claimed:')
      ? ex.sender.split('[Claimed:')[1].replace(']', '').trim()
      : ex.sender.includes('[')
      ? ex.sender.split('[')[1].replace(']', '').trim()
      : '';
    setClaimedOrg(org);
    setActiveTab('analyzer');
    runAnalysis(ex.text, ex.type, ex.sender, org, ex.language, null, 'text');
  };

  // Simulate an incoming live cellular alert broadcast
  const handleSimulateIncomingAlert = () => {
    const newAlert: LiveThreatAlert = {
      id: `ALT-${Math.floor(104 + Math.random() * 50)}`,
      headline: 'Active Kannada KYC Phishing Wave Targeting State Bank Customers',
      severity: 'critical',
      vector: 'sms',
      targetedSector: 'Retail Banking (SBI)',
      description: 'Incoming wave of deceptive SMS in Kannada threatening account freeze within 2 hours. Telemetry node intercepted 180+ bursts.',
      timestamp: 'Just now',
      activeInRegions: ['Karnataka', 'Hubballi', 'Bengaluru'],
      iocSample: 'sbi-kyc-verify-portal.in',
      blockedCount: 180,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveNotification(`New Critical Threat Alert: ${newAlert.headline}`);
    setTimeout(() => {
      setActiveNotification(null);
    }, 7000);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        activeAlertsCount={alerts.length}
      />

      {/* Real-time alert toast notification if triggered */}
      {activeNotification && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 text-rose-200 px-4 py-2.5 text-xs flex items-center justify-between sticky top-16 z-30 backdrop-blur-md animate-in slide-in-from-top">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <Bell className="w-4 h-4 text-rose-400" />
              <span className="font-semibold">{activeNotification}</span>
            </div>
            <button
              onClick={() => {
                setActiveTab('radar');
                setActiveNotification(null);
              }}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded transition-colors"
            >
              View Radar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>DEFENSIVE SCAM DETECTION</span>
            <span aria-hidden="true">·</span>
            <span>EXPLAINABLE SECURITY SIGNALS</span>
            <span aria-hidden="true">·</span>
            <span>ZERO-PII PRIVACY SHIELD</span>
          </div>
          <h1
            className="tracking-tight"
            style={{
              backgroundColor: '#090808',
              borderColor: '#fcf9f9',
              color: '#decfcf',
              fontFamily: 'system-ui',
              fontWeight: 'bold',
              lineHeight: '44px',
              fontSize: '31px',
            }}
          >
            TRUSTLENS Digital Safety Guardian
          </h1>
          <p
            className="text-slate-400 max-w-3xl"
            style={{
              fontSize: '15px',
              lineHeight: '20.75px',
            }}
          >
            Detects suspicious SMS, email, and messaging scams, cites the exact textual evidence triggering warnings, guides safe verification, and provides real-time community threat alerts.
          </p>
        </div>

        {/* Tab 1: Defensive Analyzer (Primary View) */}
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
            {/* Input Component */}
            <MessageInput
              message={message}
              onChangeMessage={setMessage}
              messageType={messageType}
              onChangeMessageType={setMessageType}
              sender={sender}
              onChangeSender={setSender}
              claimedOrg={claimedOrg}
              onChangeClaimedOrg={setClaimedOrg}
              language={language}
              onChangeLanguage={setLanguage}
              onAnalyze={() => runAnalysis()}
              isLoading={isLoading}
              onSelectSyntheticExample={handleSelectSynthetic}
              uploadedImage={uploadedImage}
              onUploadImage={setUploadedImage}
              inputMode={inputMode}
              onChangeInputMode={setInputMode}
            />

            {/* Error Message if any */}
            {analysisError && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Live Analysis Output */}
            {analysisResult && (
              <div className="space-y-6">
                {/* 1. Risk Score Card with required Disclaimers */}
                <RiskScoreCard
                  analysis={analysisResult}
                  onOpenChallengeModal={() => setIsChallengeModalOpen(true)}
                  onReportThreat={() => setIsReportModalOpen(true)}
                />

                {/* 2. Crucial Feature: Cited Textual Evidence & Highlights */}
                <EvidenceHighlighter
                  text={analysisResult.privacyMetrics.sanitizedMessage || message}
                  reasons={analysisResult.reasons}
                  highlightSpans={highlightSpans}
                />

                {/* 3. Why is this suspicious? & 6 Core Signals Matrix */}
                <SignalsBreakdown
                  reasons={analysisResult.reasons}
                  rawSignals={rawSignals}
                />

                {/* 4. Recommended Action & Safe Verification Guide */}
                <VerificationGuide
                  action={analysisResult.recommendedAction}
                  extractedUrls={analysisResult.extractedUrls}
                />

                {/* 5. Interactive Defensive Advisor Q&A */}
                <AskDefenseAssistant
                  messageContext={analysisResult.privacyMetrics.sanitizedMessage}
                  riskScore={analysisResult.riskScore}
                />

                {/* 6. Embedded Analytics Breakdown */}
                <AnalyticsDashboard />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Synthetic Demonstration Library */}
        {activeTab === 'synthetic' && (
          <SyntheticLibraryView onSelectExample={handleSelectSynthetic} />
        )}

        {/* Tab 3: Real-Time Radar */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            <ThreatRadar
              alerts={alerts}
              onSimulateIncomingAlert={handleSimulateIncomingAlert}
            />
            <AnalyticsDashboard />
          </div>
        )}

        {/* Tab 4: Secure Threat Database */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <ThreatDatabaseView onOpenReportModal={() => setIsReportModalOpen(true)} />
            <AnalyticsDashboard />
          </div>
        )}

        {/* Tab 5: Privacy Shield Explainer */}
        {activeTab === 'privacy' && <PrivacyShieldExplainer />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#060910] py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">TRUSTLENS Defensive Intelligence</span>
            <span>·</span>
            <span>Privacy-conscious scam detection & incident response</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Synthetic Demonstration Benchmarks</span>
            <span>·</span>
            <span>Zero-PII Storage</span>
            <span>·</span>
            <span>6-Signal Security Model</span>
          </div>
        </div>
      </footer>

      {/* Challenge False Positive Modal */}
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        analysis={analysisResult}
        sender={sender}
        claimedOrg={claimedOrg}
      />

      {/* Report Threat to Database Modal */}
      <ReportThreatModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialMessage={message}
        initialSender={sender}
        initialOrg={claimedOrg}
      />
    </div>
  );
}
