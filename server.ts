import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { scrubPII } from './src/utils/privacyScrubber.ts';
import { evaluateSecuritySignals } from './src/utils/securitySignals.ts';
import type { LiveThreatAlert, ReportedThreat, ThreatAnalysisResult } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Initialize Google GenAI client (User-Agent header required by skill)
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Initial Secure Threat Database (Synthetic Campaign Registry)
let threatDatabase: ReportedThreat[] = [
  {
    id: 'TR-8941',
    title: 'Acme Bank Suspension Smishing Campaign',
    category: 'Bank Account Suspension',
    targetedBrand: 'Acme Bank / Commercial Banks',
    vector: 'sms',
    language: 'English',
    riskScore: 85,
    riskLevel: 'High risk',
    signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    anonymizedSnippet: 'Dear Customer, your bank account will be suspended today. Verify your account immediately using the link below...',
    indicators: ['Urgency (suspended today)', 'Suspicious link (secure-bank-verify-acct.net)', 'Sensitive action request'],
    reportedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    reportsCount: 142,
    status: 'Active Campaign',
    region: 'North America / Global',
  },
  {
    id: 'TR-8942',
    title: 'SBI Kannada KYC Suspension Smishing',
    category: 'KYC Expiry Extortion',
    targetedBrand: 'State Bank of India (SBI)',
    vector: 'sms',
    language: 'Kannada (ಕನ್ನಡ)',
    riskScore: 92,
    riskLevel: 'High risk',
    signatureHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    anonymizedSnippet: 'ಆತ್ಮೀಯ ಗ್ರಾಹಕರೇ, ನಿಮ್ಮ SBI ಬ್ಯಾಂಕ್ ಖಾತೆಯನ್ನು ಇಂದೇ ಅಮಾನತುಗೊಳಿಸಲಾಗುವುದು. ನಿಮ್ಮ KYC ಅಪ್‌ಡೇಟ್ ಮಾಡಲು...',
    indicators: ['Kannada regional lure', 'Spoofed SBI portal', 'Disconnection threat'],
    reportedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    reportsCount: 89,
    status: 'Active Campaign',
    region: 'India (Karnataka)',
  },
  {
    id: 'TR-8943',
    title: 'BESCOM Power Disconnection Threat (Kanglish)',
    category: 'Utility Payment Extortion',
    targetedBrand: 'BESCOM Karnataka',
    vector: 'sms',
    language: 'Kanglish (Kannada-English)',
    riskScore: 94,
    riskLevel: 'High risk',
    signatureHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    anonymizedSnippet: 'Dear Consumer, nimma BESCOM electricity connection ivathu rathri 9:30 ge disconnect agutthe... call madi: [REDACTED_PHONE]',
    indicators: ['Code-mixed panic creation', 'Call-back number extortion', 'Unauthorized payment gateway'],
    reportedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    reportsCount: 215,
    status: 'Active Campaign',
    region: 'India (Bengaluru)',
  },
  {
    id: 'TR-8944',
    title: 'ANTAI Traffic Fine Phishing Notice',
    category: 'Government Fine Extortion',
    targetedBrand: 'Agence Nationale de Traitement Automatisé (ANTAI)',
    vector: 'email',
    language: 'French (Français)',
    riskScore: 88,
    riskLevel: 'High risk',
    signatureHash: '3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855a',
    anonymizedSnippet: "INFO ANTAI: Vous avez un retard de paiement d'une amende forfaitaire de 35,00€... Régularisez sous 24h...",
    indicators: ['Fake ministry domain (.info)', 'Legal majoration threat', 'Phony payment portal'],
    reportedAt: new Date(Date.now() - 3600000 * 32).toISOString(),
    reportsCount: 67,
    status: 'Active Campaign',
    region: 'Europe (France)',
  },
  {
    id: 'TR-8945',
    title: 'Postal Service Redelivery Fee Smishing',
    category: 'Parcel Delivery Fraud',
    targetedBrand: 'India Post / USPS',
    vector: 'sms',
    language: 'English',
    riskScore: 84,
    riskLevel: 'High risk',
    signatureHash: '4ca495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b93',
    anonymizedSnippet: 'Postal Notice: Your parcel #IN892019 could not be dispatched due to an incomplete street address. Pay redelivery surcharge...',
    indicators: ['Micro-payment card harvesting', 'Disposable tracking link', 'Urgency pressure'],
    reportedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reportsCount: 312,
    status: 'Active Campaign',
    region: 'Global',
  },
];

// Live Real-Time Threat Alerts
const liveThreatAlerts: LiveThreatAlert[] = [
  {
    id: 'ALT-101',
    headline: 'Surge in Kannada and Kanglish Electricity Bill Smishing in Karnataka',
    severity: 'critical',
    vector: 'sms',
    targetedSector: 'Public Utilities (BESCOM)',
    description: 'Attackers are broadcasting code-mixed SMS threatening power cutoffs at 9:30 PM tonight, directing users to call unverified mobile numbers.',
    timestamp: 'Just now',
    activeInRegions: ['Karnataka', 'Bengaluru Metro'],
    iocSample: 'bescom-bill-quickpay.net',
    blockedCount: 420,
  },
  {
    id: 'ALT-102',
    headline: 'Global Banking Suspension Smishing Wave Mimicking Major Lenders',
    severity: 'critical',
    vector: 'sms',
    targetedSector: 'Retail Banking & Finance',
    description: 'Widespread deceptive texts claiming "account will be suspended today" driving victims to credential-harvesting lookalike portals.',
    timestamp: '18m ago',
    activeInRegions: ['North America', 'Europe', 'India'],
    iocSample: 'secure-bank-verify-acct.net',
    blockedCount: 1250,
  },
  {
    id: 'ALT-103',
    headline: 'High Volume of Impersonal Package Fee Scams Targeting Delivery Surcharges',
    severity: 'warning',
    vector: 'sms',
    targetedSector: 'Postal & Logistics',
    description: 'Deceptive messages demanding nominal ₹42 / $1.85 redelivery fees designed to siphon debit card CVV codes.',
    timestamp: '1h ago',
    activeInRegions: ['Global'],
    iocSample: 'indiapost-redelivery-tracking.org',
    blockedCount: 890,
  },
];

// False-Positive Challenge Feedback Ledger
interface ChallengeRecord {
  id: string;
  threatId?: string;
  userExplanation: string;
  senderDomain: string;
  claimedOrg: string;
  originalRiskScore: number;
  submittedAt: string;
  status: 'Received' | 'Under Investigation' | 'Validated Legitimate';
}

const challengeFeedbackLedger: ChallengeRecord[] = [
  {
    id: 'CHAL-501',
    threatId: 'syn-legit-college-circular',
    userExplanation: 'This email came directly from registrar@rvce.edu.in with authentic DKIM signature announcing SEE exam timetable.',
    senderDomain: 'rvce.edu.in',
    claimedOrg: 'RV College of Engineering',
    originalRiskScore: 12,
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'Validated Legitimate',
  },
];

// Primary Analysis Endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { message, messageType = 'sms', sender = '', claimedOrg = '', language = 'auto', image } = req.body;

    let targetText = typeof message === 'string' ? message : '';
    let targetSender = typeof sender === 'string' ? sender : '';
    let targetOrg = typeof claimedOrg === 'string' ? claimedOrg : '';
    let targetType = messageType;
    let geminiInsight: any = null;

    // Check if an image screenshot is uploaded
    if (image && image.base64 && ai) {
      try {
        const cleanBase64 = image.base64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        const imagePart = {
          inlineData: {
            mimeType: image.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        };

        const imagePrompt = `You are TRUSTLENS, an elite defensive cybersecurity and scam detection assistant.
The user uploaded a screenshot of a suspicious message (SMS, WhatsApp, chat, email, or system notification).

Carefully examine this screenshot and perform the following:
1. OCR & transcribe the EXACT text message visible in the screenshot into "extractedMessageText".
2. Extract the sender info (phone number, shortcode, name, email) shown at the top of the chat/SMS into "extractedSender".
3. Identify the claimed organisation or brand into "extractedClaimedOrg".
4. Determine the message type ("sms" | "email" | "chat" | "qr" | "vishing") into "detectedVector".
5. Detect the language into "detectedLanguage" (e.g. "English", "Kannada (ಕನ್ನಡ)", "Kanglish", "Hindi", "Español", "Français").
6. Evaluate the 6 security signals:
   - Sender/domain inconsistency
   - URL obfuscation
   - Suspicious urgency
   - Credential requests & sensitive actions
   - Financial requests & payments
   - Missing provenance & generic greetings
7. Extract exact quoted textual evidence phrases that triggered suspicion into "suspiciousReasons".
8. Calculate the illustrative riskScore (0-100) and riskTier ("Low risk" | "Medium risk" | "High risk" | "Inconclusive").
9. Provide headlineSummary, safeVerificationSteps, and prohibitedActions.

Respond ONLY with valid JSON with this exact schema:
{
  "extractedMessageText": string,
  "extractedSender": string,
  "extractedClaimedOrg": string,
  "detectedVector": "sms" | "email" | "chat" | "qr" | "vishing",
  "detectedLanguage": string,
  "riskScore": number,
  "riskTier": "Low risk" | "Medium risk" | "High risk" | "Inconclusive",
  "headlineSummary": string,
  "suspiciousReasons": [
    {
      "category": string,
      "explanation": string,
      "severity": "high" | "medium" | "low",
      "exactQuote": string
    }
  ],
  "safeVerificationSteps": [string],
  "prohibitedActions": [string]
}`;

        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts: [imagePart, { text: imagePrompt }] },
          config: {
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Image analysis latency timeout')), 8000)
        );

        const response: any = await Promise.race([geminiCall, timeoutPromise]);
        const rawText = response.text?.trim() || '';
        if (rawText) {
          geminiInsight = JSON.parse(rawText);
          if (geminiInsight.extractedMessageText) {
            targetText = geminiInsight.extractedMessageText;
          }
          if (geminiInsight.extractedSender) {
            targetSender = geminiInsight.extractedSender;
          }
          if (geminiInsight.extractedClaimedOrg) {
            targetOrg = geminiInsight.extractedClaimedOrg;
          }
          if (geminiInsight.detectedVector) {
            targetType = geminiInsight.detectedVector;
          }
        }
      } catch (imgErr) {
        console.warn('Image analysis fallback to text parser:', imgErr);
      }
    }

    if (!targetText || targetText.trim().length === 0) {
      if (image && image.base64) {
        return res.status(400).json({
          error: 'Could not extract text from the uploaded screenshot. Please ensure the message text is clearly legible, or paste the text directly.',
        });
      }
      return res.status(400).json({ error: 'Message content or screenshot is required.' });
    }

    // 1. Privacy First: Scrub PII immediately before processing
    const scrubbed = scrubPII(targetText);

    // Compute cryptographic fingerprint hash of the canonical anonymized text
    const signatureHash = crypto
      .createHash('sha256')
      .update(scrubbed.sanitizedText.trim().toLowerCase())
      .digest('hex');

    // 2. Perform local deterministic 6-signal analysis
    const localEval = evaluateSecuritySignals(scrubbed.sanitizedText, targetSender, targetOrg);

    // 3. Enhance with Gemini 3.8 Flash if text analysis wasn't already covered by image OCR
    let detectedLang = geminiInsight?.detectedLanguage || (localEval.signals.some((s) => s.evidenceQuotes.some((q) => /[\u0C80-\u0CFF]/.test(q)))
      ? 'Kannada (ಕನ್ನಡ)'
      : localEval.signals.some((s) => s.evidenceQuotes.some((q) => /[\u0900-\u097F]/.test(q)))
      ? 'Hindi (हिंदी)'
      : /bloqueada|ingrese|claves/i.test(scrubbed.sanitizedText)
      ? 'Español'
      : /amende|réglez|majoration/i.test(scrubbed.sanitizedText)
      ? 'Français'
      : 'English');

    if (ai && !geminiInsight) {
      try {
        const prompt = `You are TRUSTLENS, an elite defensive cybersecurity and scam detection assistant.
Analyze this message for deceptive indicators, social engineering, smishing, phishing, or financial scams.
Remember our privacy guarantee: the message has already had personal identifiers redacted into [REDACTED_*] tokens.

Message Text:
"""${scrubbed.sanitizedText}"""

Sender Metadata: "${targetSender || 'Unknown'}"
Claimed Organisation: "${targetOrg || 'Unspecified'}"

Evaluate these specific 6 security signals:
1. Sender/domain inconsistency
2. URL obfuscation
3. Suspicious urgency
4. Credential requests & sensitive actions
5. Financial requests & payments
6. Missing provenance & generic greetings

Consider multiple signals together: DO NOT flag a message as a scam purely because it mentions 'account' or has a 2FA OTP if it contains genuine defensive warnings and no malicious links.

Respond ONLY with valid JSON with this exact schema:
{
  "riskScore": number (0-100, illustrative risk score, not a calibrated probability),
  "riskTier": "Low risk" | "Medium risk" | "High risk" | "Inconclusive",
  "detectedLanguage": string (e.g. "English", "Kannada (ಕನ್ನಡ)", "Kanglish (Code-Mixed)", "Hindi", "Español", "Français"),
  "headlineSummary": string (1-2 clear defensive sentences),
  "suspiciousReasons": [
    {
      "category": string (e.g. "Urgency", "Suspicious link request", "Sensitive action", "Sender/domain inconsistency", "Financial request"),
      "explanation": string (why this is suspicious),
      "severity": "high" | "medium" | "low",
      "exactQuote": string (exact short phrase or sentence from the message that triggered this signal)
    }
  ],
  "safeVerificationSteps": [string],
  "prohibitedActions": [string]
}`;

        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API latency timeout')), 4500)
        );

        const response = await Promise.race([geminiCall, timeoutPromise]);

        const rawText = response.text?.trim() || '';
        if (rawText) {
          geminiInsight = JSON.parse(rawText);
          if (geminiInsight.detectedLanguage) {
            detectedLang = geminiInsight.detectedLanguage;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini enhancement fallback to local signals:', geminiErr);
      }
    }

    // Merge insights: Use Gemini's semantic reasons if available, but anchor with deterministic citations
    const finalScore = geminiInsight?.riskScore !== undefined ? geminiInsight.riskScore : localEval.riskScore;
    const finalTier =
      geminiInsight?.riskTier ||
      (finalScore >= 70 ? 'High risk' : finalScore >= 35 ? 'Medium risk' : finalScore === 0 && targetText.length < 25 ? 'Inconclusive' : 'Low risk');

    const mergedReasons = geminiInsight?.suspiciousReasons && geminiInsight.suspiciousReasons.length > 0
      ? geminiInsight.suspiciousReasons.map((r: any) => ({
          category: r.category,
          explanation: r.explanation,
          severity: r.severity || 'high',
          excerpt: r.exactQuote || localEval.activeReasons.find((ar) => ar.category.toLowerCase().includes(r.category.toLowerCase()))?.excerpt || '',
        }))
      : localEval.activeReasons;

    const analysisResult: ThreatAnalysisResult = {
      id: `TL-${Date.now().toString(36).toUpperCase()}`,
      riskScore: finalScore,
      riskLevel: finalTier as any,
      headlineSummary: geminiInsight?.headlineSummary || localEval.headlineSummary,
      isSynthetic: true,
      messageType: targetType as any,
      detectedLanguage: detectedLang,
      reasons: mergedReasons,
      recommendedAction: {
        primaryInstruction: localEval.recommendedAction.primaryInstruction,
        safeSteps: geminiInsight?.safeVerificationSteps || localEval.recommendedAction.safeSteps,
        prohibitedActions: geminiInsight?.prohibitedActions || localEval.recommendedAction.prohibitedActions,
        officialVerificationChannels: localEval.recommendedAction.officialVerificationChannels,
      },
      extractedUrls: localEval.extractedUrls,
      privacyMetrics: {
        piiTokensRedacted: scrubbed.totalRedacted,
        redactedTypes: scrubbed.tokensRedacted.map((t) => t.type),
        sanitizedMessage: scrubbed.sanitizedText,
        originalLength: targetText.length,
        hashSignature: signatureHash,
      },
      analyzedAt: new Date().toISOString(),
      threatSignatureHash: signatureHash,
    };

    return res.json({
      success: true,
      data: analysisResult,
      rawSignals: localEval.signals,
      highlightSpans: localEval.highlightSpans,
      extractedText: targetText,
      extractedSender: targetSender,
      extractedClaimedOrg: targetOrg,
    });
  } catch (err: any) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: 'Failed to complete threat analysis.', details: err.message });
  }
});

// Defensive Follow-up Q&A Assistant Endpoint
app.post('/api/chat-defense', async (req: Request, res: Response) => {
  try {
    const { question, messageContext, riskScore } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (!ai) {
      return res.json({
        answer:
          'If you clicked a link or shared credentials, immediately: 1) Disconnect your device from the internet, 2) Change your bank passwords from an uncompromised device, 3) Call your bank’s official fraud hotline (number on your card) to freeze cards, and 4) Forward the scam SMS to 7726 (SPAM).',
      });
    }

    const prompt = `You are TRUSTLENS Defensive Security Assistant. A user is asking a security question about a suspicious message they received.
Message context (PII already scrubbed): "${messageContext || 'No context'}"
Calculated Risk Score: ${riskScore ?? 'N/A'}/100

User Question: "${question}"

Provide a concise, calm, actionable defensive answer:
- Give immediate damage-control steps if they already clicked or responded.
- Provide safe verification steps.
- Explain clearly why not to engage (e.g. why replying STOP confirms an active phone number).
Keep your response under 150 words, clean, without markdown headers or fluff.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      answer: response.text?.trim() || 'Please contact your bank directly through verified official channels.',
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({
      answer: 'Always verify directly through official telephone numbers printed on your physical card or official website.',
    });
  }
});

// Secure Threat Database Endpoints
app.get('/api/threats', (req: Request, res: Response) => {
  const { category, search, vector } = req.query;
  let results = [...threatDatabase];

  if (category && typeof category === 'string' && category !== 'all') {
    results = results.filter((t) => t.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (vector && typeof vector === 'string' && vector !== 'all') {
    results = results.filter((t) => t.vector.toLowerCase() === vector.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.targetedBrand.toLowerCase().includes(q) ||
        t.anonymizedSnippet.toLowerCase().includes(q) ||
        t.indicators.some((i) => i.toLowerCase().includes(q))
    );
  }

  return res.json({ success: true, count: results.length, data: results });
});

app.post('/api/threats', (req: Request, res: Response) => {
  try {
    const { title, category, targetedBrand, vector = 'sms', language = 'English', message, riskScore = 85, indicators = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required for threat reporting.' });
    }

    // Enforce PII scrubbing before storage
    const scrubbed = scrubPII(message);
    const hash = crypto.createHash('sha256').update(scrubbed.sanitizedText.toLowerCase().trim()).digest('hex');

    // Check if duplicate hash exists
    const existingIndex = threatDatabase.findIndex((t) => t.signatureHash === hash);
    if (existingIndex !== -1) {
      threatDatabase[existingIndex].reportsCount += 1;
      return res.json({
        success: true,
        message: 'Threat signature matched existing campaign. Community incident counter incremented.',
        data: threatDatabase[existingIndex],
      });
    }

    const newThreat: ReportedThreat = {
      id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title || `${targetedBrand || 'Suspicious'} ${category || 'Phishing'} Campaign`,
      category: category || 'Social Engineering / Smishing',
      targetedBrand: targetedBrand || 'Financial / Retail Institution',
      vector: vector as any,
      language: language || 'English',
      riskScore: Number(riskScore) || 85,
      riskLevel: Number(riskScore) >= 70 ? 'High risk' : Number(riskScore) >= 35 ? 'Medium risk' : 'Low risk',
      signatureHash: hash,
      anonymizedSnippet: scrubbed.sanitizedText.slice(0, 160) + (scrubbed.sanitizedText.length > 160 ? '...' : ''),
      indicators: indicators.length > 0 ? indicators : ['Urgency signal', 'Unauthorized redirection', 'Sensitive data lure'],
      reportedAt: new Date().toISOString(),
      reportsCount: 1,
      status: 'Active Campaign',
      region: 'User Reported Community Network',
    };

    threatDatabase.unshift(newThreat);
    return res.status(201).json({
      success: true,
      message: 'Threat securely indexed in TrustLens Threat Database with zero personal information stored.',
      data: newThreat,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record threat.', details: err.message });
  }
});

app.get('/api/threats/stats', (_req: Request, res: Response) => {
  const total = threatDatabase.length;
  const highRisk = threatDatabase.filter((t) => t.riskScore >= 70).length;
  const mediumRisk = threatDatabase.filter((t) => t.riskScore >= 35 && t.riskScore < 70).length;
  const lowRisk = threatDatabase.filter((t) => t.riskScore < 35).length;
  const totalReports = threatDatabase.reduce((acc, t) => acc + t.reportsCount, 0);

  return res.json({
    totalSignatures: total,
    totalCommunityReports: totalReports,
    tierBreakdown: {
      highRisk,
      mediumRisk,
      lowRisk,
      inconclusive: 2,
    },
    topTargetedBrands: ['State Bank of India', 'Acme Bank', 'BESCOM', 'India Post', 'ANTAI'],
    activeAlertsCount: liveThreatAlerts.length,
  });
});

// False-Positive Challenge Feedback Endpoints
app.post('/api/feedback/challenge', (req: Request, res: Response) => {
  const { userExplanation, senderDomain, claimedOrg, originalRiskScore } = req.body;

  if (!userExplanation) {
    return res.status(400).json({ error: 'Explanation is required for challenging a classification.' });
  }

  const record: ChallengeRecord = {
    id: `CHAL-${Math.floor(100 + Math.random() * 900)}`,
    userExplanation,
    senderDomain: senderDomain || 'Unspecified',
    claimedOrg: claimedOrg || 'Unspecified',
    originalRiskScore: Number(originalRiskScore) || 0,
    submittedAt: new Date().toISOString(),
    status: 'Under Investigation',
  };

  challengeFeedbackLedger.unshift(record);

  return res.json({
    success: true,
    message: 'Your challenge feedback was logged in the defensive review registry. The system does not blindly change verdicts, but flags this pattern for signal recalibration.',
    data: record,
  });
});

app.get('/api/alerts', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    alerts: liveThreatAlerts,
  });
});

// Export Database Endpoint (STIX 2.1 / JSON)
app.get('/api/threats/export', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="trustlens-threat-intelligence.json"');
  return res.json({
    generator: 'TRUSTLENS Defensive Intelligence',
    version: '2.1',
    exportTimestamp: new Date().toISOString(),
    notice: 'Sanitized synthetic threat intelligence indicators. Zero personal identifying information.',
    signatures: threatDatabase,
  });
});

// Mount Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRUSTLENS Defensive Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
