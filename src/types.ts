export type MessageType = 'sms' | 'email' | 'chat' | 'vishing' | 'qr';

export type RiskLevel = 'Safe' | 'Low risk' | 'Medium risk' | 'Moderate risk' | 'High risk' | 'Critical risk' | 'Inconclusive';

export interface SuspiciousReason {
  category: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
  excerpt?: string;
}

export interface ExtractedUrlInfo {
  original: string;
  safeDisplay: string;
  isSuspicious: boolean;
  suspicionReasons: string[];
  topLevelDomain: string;
  looksLikeBrand?: string;
}

export interface RecommendedAction {
  primaryInstruction: string;
  safeSteps: string[];
  prohibitedActions: string[];
  officialVerificationChannels: string[];
}

export interface PrivacyMetrics {
  piiTokensRedacted: number;
  redactedTypes: string[];
  sanitizedMessage: string;
  originalLength: number;
  hashSignature: string;
}

export interface ThreatAnalysisResult {
  id: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  headlineSummary: string;
  isSynthetic: boolean;
  messageType: MessageType;
  detectedLanguage: string;
  reasons: SuspiciousReason[];
  recommendedAction: RecommendedAction;
  extractedUrls: ExtractedUrlInfo[];
  privacyMetrics: PrivacyMetrics;
  analyzedAt: string;
  threatSignatureHash: string;
}

export interface ReportedThreat {
  id: string;
  title: string;
  category: string;
  targetedBrand: string;
  vector: MessageType;
  language: string;
  riskScore: number;
  riskLevel: RiskLevel;
  signatureHash: string;
  anonymizedSnippet: string;
  indicators: string[];
  reportedAt: string;
  reportsCount: number;
  status: 'Active Campaign' | 'Investigating' | 'Neutralized';
  region: string;
}

export interface LiveThreatAlert {
  id: string;
  headline: string;
  severity: 'critical' | 'warning' | 'info';
  vector: MessageType;
  targetedSector: string;
  description: string;
  timestamp: string;
  activeInRegions: string[];
  iocSample: string;
  blockedCount: number;
}

export interface SyntheticExample {
  id: string;
  label: string;
  type: MessageType;
  language: string;
  languageName: string;
  category: string;
  sender: string;
  text: string;
  isScam: boolean;
  expectedScoreRange: [number, number];
  tags: string[];
}
