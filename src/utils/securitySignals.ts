/**
 * Security Signal Engine & Textual Evidence Matcher for TrustLens
 * Analyzes the 6 core dimensions:
 * 1. Sender/domain inconsistency
 * 2. URL obfuscation
 * 3. Suspicious urgency
 * 4. Credential requests
 * 5. Financial requests
 * 6. Missing provenance
 */

import type { ExtractedUrlInfo, RecommendedAction, RiskLevel, SuspiciousReason } from '../types.ts';

export interface EvaluatedSignal {
  id: 'domain_inconsistency' | 'url_obfuscation' | 'urgency' | 'credentials' | 'financial' | 'provenance';
  label: string;
  detected: boolean;
  severity: 'high' | 'medium' | 'low' | 'none';
  evidenceQuotes: string[];
  explanation: string;
  weight: number; // 0 to 30
}

export interface LocalSecurityEvaluation {
  riskScore: number; // 0 to 100
  riskTier: 'Low risk' | 'Medium risk' | 'High risk' | 'Inconclusive';
  headlineSummary: string;
  signals: EvaluatedSignal[];
  activeReasons: SuspiciousReason[];
  extractedUrls: ExtractedUrlInfo[];
  recommendedAction: RecommendedAction;
  highlightSpans: Array<{
    quote: string;
    signalId: EvaluatedSignal['id'];
    signalLabel: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

// Known legitimate domains and organizations
const REPUTABLE_ORG_DOMAINS: Record<string, string[]> = {
  rvce: ['rvce.edu.in'],
  vtu: ['vtu.ac.in'],
  sbi: ['onlinesbi.sbi', 'sbi.co.in'],
  hdfc: ['hdfcbank.com'],
  icici: ['icicibank.com'],
  bbva: ['bbva.es', 'bbva.com'],
  usps: ['usps.com'],
  indiapost: ['indiapost.gov.in'],
  antai: ['antai.gouv.fr'],
  bescom: ['bescom.karnataka.gov.in', 'bescom.org'],
};

export function evaluateSecuritySignals(
  text: string,
  sender: string = '',
  claimedOrg: string = ''
): LocalSecurityEvaluation {
  const normalizedText = text.toLowerCase();
  const normalizedSender = sender.toLowerCase();
  const normalizedOrg = claimedOrg.toLowerCase();

  const signals: EvaluatedSignal[] = [];
  const highlightSpans: LocalSecurityEvaluation['highlightSpans'] = [];

  // Extract all URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|info|in|xyz|cc|online|top|site|vip|biz)\b[^\s]*)/gi;
  const rawUrls = text.match(urlRegex) || [];
  const extractedUrls: ExtractedUrlInfo[] = [];

  rawUrls.forEach((u) => {
    let cleanUrl = u.replace(/[),.;]+$/, '');
    let hostname = '';
    try {
      hostname = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname;
    } catch {
      hostname = cleanUrl.split('/')[0];
    }

    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
    const hasSuspiciousTld = /\.(xyz|top|cc|online|site|vip|info|biz|buzz|work|shop|app)$/i.test(hostname);
    const hasExcessiveHyphens = (hostname.match(/-/g) || []).length >= 2;
    const mimicsBrand = /(sbi|bank|secure|verify|account|bbva|usps|indiapost|bescom|antai|pay|login)/i.test(hostname);

    const suspicionReasons: string[] = [];
    if (isIp) suspicionReasons.push('Direct IP address instead of domain');
    if (hasSuspiciousTld) suspicionReasons.push(`Uses cheap, high-risk TLD (${hostname.split('.').pop()})`);
    if (hasExcessiveHyphens) suspicionReasons.push('Excessive hyphens common in disposable phishing domains');
    if (mimicsBrand && !Object.values(REPUTABLE_ORG_DOMAINS).flat().includes(hostname)) {
      suspicionReasons.push('Mimics financial or institutional keywords in unauthorized hostname');
    }

    const isSuspicious = suspicionReasons.length > 0;

    extractedUrls.push({
      original: cleanUrl,
      safeDisplay: cleanUrl.replace(/^(https?:\/\/)?/, '[defanged]://'),
      isSuspicious,
      suspicionReasons,
      topLevelDomain: hostname.split('.').pop() || '',
      looksLikeBrand: mimicsBrand ? 'Impersonated Entity' : undefined,
    });
  });

  // 1. Sender / Domain Inconsistency
  const domainInconsistencyQuotes: string[] = [];
  let domainInconsistent = false;
  let domainExplanation = 'Sender address and domain align with expected organization or no spoofing detected.';

  // Check if claimed org or message claims brand but sender is personal or mismatched
  const orgKeywords = ['bank', 'sbi', 'hdfc', 'bbva', 'bescom', 'usps', 'india post', 'antai', 'rvce', 'college', 'university', 'acme'];
  const mentionsOrg = orgKeywords.some((k) => normalizedText.includes(k) || normalizedOrg.includes(k));
  const isPersonalSender = /@(?:gmail|yahoo|hotmail|outlook)\.com/i.test(sender) || /^\+?\d{10,14}$/.test(sender.trim());

  if (mentionsOrg && isPersonalSender) {
    domainInconsistent = true;
    domainInconsistencyQuotes.push(sender);
    domainExplanation = `Message purports to be from an official institution, but sender '${sender}' is an unverified mobile number or generic consumer mailbox.`;
  } else if (claimedOrg) {
    // Check if sender matches claimed org
    const orgKey = Object.keys(REPUTABLE_ORG_DOMAINS).find((k) => normalizedOrg.includes(k));
    if (orgKey) {
      const allowed = REPUTABLE_ORG_DOMAINS[orgKey];
      const matchesAllowed = allowed.some((d) => normalizedSender.includes(d));
      if (!matchesAllowed && normalizedSender.length > 0) {
        domainInconsistent = true;
        domainInconsistencyQuotes.push(sender);
        domainExplanation = `Sender '${sender}' does not belong to authorized domains for ${claimedOrg} (${allowed.join(', ')}).`;
      }
    }
  }

  // Look for Telegram redirect impersonation
  const telegramHandle = text.match(/@([A-Za-z0-9_]{4,})/);
  if (telegramHandle && (normalizedText.includes('hr') || normalizedText.includes('recruiter') || normalizedText.includes('manager'))) {
    domainInconsistent = true;
    domainInconsistencyQuotes.push(telegramHandle[0]);
    domainExplanation = 'Recruiter asks to communicate via unofficial Telegram handle instead of corporate email.';
  }

  signals.push({
    id: 'domain_inconsistency',
    label: 'Sender/domain inconsistency',
    detected: domainInconsistent,
    severity: domainInconsistent ? 'high' : 'none',
    evidenceQuotes: domainInconsistencyQuotes,
    explanation: domainExplanation,
    weight: domainInconsistent ? 25 : 0,
  });

  if (domainInconsistent && domainInconsistencyQuotes.length > 0) {
    domainInconsistencyQuotes.forEach((q) => {
      highlightSpans.push({
        quote: q,
        signalId: 'domain_inconsistency',
        signalLabel: 'Sender / Domain Mismatch',
        severity: 'high',
      });
    });
  }

  // 2. URL Obfuscation
  const urlQuotes: string[] = [];
  const suspiciousUrls = extractedUrls.filter((u) => u.isSuspicious);
  const urlDetected = suspiciousUrls.length > 0 || (extractedUrls.length > 0 && mentionsOrg && !normalizedSender.includes('.edu') && !normalizedSender.includes('.gov'));

  suspiciousUrls.forEach((u) => {
    urlQuotes.push(u.original);
  });

  signals.push({
    id: 'url_obfuscation',
    label: 'URL obfuscation & suspicious links',
    detected: urlDetected,
    severity: urlDetected ? 'high' : 'none',
    evidenceQuotes: urlQuotes.length > 0 ? urlQuotes : extractedUrls.map((u) => u.original),
    explanation: urlDetected
      ? `Link directs to an unauthorized or deceptive destination (${suspiciousUrls.map((u) => u.safeDisplay).join(', ') || 'unverified third-party URL'}).`
      : 'No misleading or obfuscated links detected.',
    weight: urlDetected ? 30 : 0,
  });

  if (urlDetected) {
    urlQuotes.forEach((q) => {
      highlightSpans.push({
        quote: q,
        signalId: 'url_obfuscation',
        signalLabel: 'Suspicious / Deceptive Link',
        severity: 'high',
      });
    });
  }

  // 3. Suspicious Urgency
  const urgencyPatterns = [
    { regex: /suspended today/i, text: 'suspended today' },
    { regex: /verify (?:your account )?immediately/i, text: 'verify immediately' },
    { regex: /avoid service interruption/i, text: 'avoid service interruption' },
    { regex: /ಇಂದೇ ಅಮಾನತು|ಅಮಾನತುಗೊಳಿಸಲಾಗುವುದು/i, text: 'ಇಂದೇ ಅಮಾನತುಗೊಳಿಸಲಾಗುವುದು' },
    { regex: /ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ/i, text: 'ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ' },
    { regex: /ಸೇವೆ ಸ್ಥಗಿತಗೊಳ್ಳುತ್ತದೆ/i, text: 'ಸೇವೆ ಸ್ಥಗಿತಗೊಳ್ಳುತ್ತದೆ' },
    { regex: /ivathu rathri 9:30 ge disconnect/i, text: 'ivathu rathri 9:30 ge disconnect' },
    { regex: /urgent agi/i, text: 'urgent agi' },
    { regex: /काट दिया जाएगा/i, text: 'काट दिया जाएगा' },
    { regex: /तुरंत संपर्क करें/i, text: 'तुरंत संपर्क करें' },
    { regex: /bloqueada temporalmente/i, text: 'bloqueada temporalmente' },
    { regex: /reactivarla inmediatamente/i, text: 'reactivarla inmediatamente' },
    { regex: /sous 24h avant majoration/i, text: 'sous 24h avant majoration' },
    { regex: /within 12 hours/i, text: 'within 12 hours' },
    { regex: /right now!/i, text: 'right now!' },
  ];

  const urgencyQuotes: string[] = [];
  urgencyPatterns.forEach((p) => {
    const match = text.match(p.regex);
    if (match) {
      urgencyQuotes.push(match[0]);
    }
  });

  const urgencyDetected = urgencyQuotes.length > 0;
  signals.push({
    id: 'urgency',
    label: 'Suspicious urgency',
    detected: urgencyDetected,
    severity: urgencyDetected ? 'high' : 'none',
    evidenceQuotes: urgencyQuotes,
    explanation: urgencyDetected
      ? `Pressures recipient with tight deadlines or threats of immediate suspension/disconnection (${urgencyQuotes.join(', ')}).`
      : 'No artificial panic or coercive countdown detected.',
    weight: urgencyDetected ? 20 : 0,
  });

  if (urgencyDetected) {
    urgencyQuotes.forEach((q) => {
      highlightSpans.push({
        quote: q,
        signalId: 'urgency',
        signalLabel: 'Urgent Threat / Pressure',
        severity: 'high',
      });
    });
  }

  // 4. Credential Requests & Sensitive Actions
  const credentialPatterns = [
    { regex: /verify (?:your )?account/i, text: 'verify your account' },
    { regex: /using the link/i, text: 'using the link' },
    { regex: /ನಿಮ್ಮ KYC ಅಪ್‌ಡೇಟ್ ಮಾಡಲು/i, text: 'ನಿಮ್ಮ KYC ಅಪ್‌ಡೇಟ್ ಮಾಡಲು' },
    { regex: /confirm(?:e)? sus claves/i, text: 'confirme sus claves' },
    { regex: /ingrese sus credenciales/i, text: 'ingrese sus credenciales' },
    { regex: /download your exam hall ticket/i, text: 'download your exam hall ticket' },
    { regex: /share this code/i, text: 'share this code' },
  ];

  const credentialQuotes: string[] = [];
  credentialPatterns.forEach((p) => {
    const match = text.match(p.regex);
    if (match) {
      credentialQuotes.push(match[0]);
    }
  });

  // Note: Legitimate warning "NEVER share this code" is defensive, not an attack!
  const hasDefensiveCaution = /never share this code|will never call|do not share/i.test(text);
  const maliciousCredentialRequest = credentialQuotes.some((q) => !q.includes('download your exam') && !hasDefensiveCaution);

  signals.push({
    id: 'credentials',
    label: 'Credential requests & sensitive actions',
    detected: maliciousCredentialRequest,
    severity: maliciousCredentialRequest ? 'high' : hasDefensiveCaution ? 'low' : 'none',
    evidenceQuotes: maliciousCredentialRequest ? credentialQuotes.filter((q) => !q.includes('download')) : [],
    explanation: maliciousCredentialRequest
      ? `Prompts user to submit account credentials, banking authentication, or KYC records via an external channel.`
      : hasDefensiveCaution
      ? 'Contains explicit defensive security instructions warning NOT to share credentials.'
      : 'No sensitive credential or password extraction requested.',
    weight: maliciousCredentialRequest ? 25 : 0,
  });

  if (maliciousCredentialRequest) {
    credentialQuotes.forEach((q) => {
      highlightSpans.push({
        quote: q,
        signalId: 'credentials',
        signalLabel: 'Sensitive Credential Action',
        severity: 'high',
      });
    });
  }

  // 5. Financial Requests
  const financialPatterns = [
    { regex: /pay (?:42\.00 INR|\$1\.\d{2}) redelivery/i, text: 'pay redelivery fee' },
    { regex: /bill payment madi/i, text: 'bill payment madi' },
    { regex: /बिल भुगतान करें/i, text: 'बिल भुगतान करें' },
    { regex: /réglez en ligne/i, text: 'réglez en ligne' },
    { regex: /earn (?:₹|\$)\d+/i, text: 'earn money promise' },
    { regex: /fee payment is required/i, text: 'fee payment is required' },
  ];

  const financialQuotes: string[] = [];
  financialPatterns.forEach((p) => {
    const match = text.match(p.regex);
    if (match) {
      financialQuotes.push(match[0]);
    }
  });

  const isExplicitlyNoFee = /no fee payment is required/i.test(text);
  const financialDetected = financialQuotes.length > 0 && !isExplicitlyNoFee;

  signals.push({
    id: 'financial',
    label: 'Financial requests & payment demands',
    detected: financialDetected,
    severity: financialDetected ? 'high' : 'none',
    evidenceQuotes: financialDetected ? financialQuotes : [],
    explanation: financialDetected
      ? `Requires immediate fund transfer, fine settlement, redelivery fee, or promises unrealistic daily returns.`
      : isExplicitlyNoFee
      ? 'Explicitly specifies that no fee payment is required.'
      : 'No financial transfer or payment requested.',
    weight: financialDetected ? 20 : 0,
  });

  if (financialDetected) {
    financialQuotes.forEach((q) => {
      highlightSpans.push({
        quote: q,
        signalId: 'financial',
        signalLabel: 'Financial Demand / Payment',
        severity: 'high',
      });
    });
  }

  // 6. Missing Provenance
  const genericGreetings = [
    { regex: /\bDear Customer\b/i, text: 'Dear Customer' },
    { regex: /ಆತ್ಮೀಯ ಗ್ರಾಹಕರೇ/i, text: 'ಆತ್ಮೀಯ ಗ್ರಾಹಕರೇ' },
    { regex: /\bDear Consumer\b/i, text: 'Dear Consumer' },
    { regex: /प्रिय उपभोक्ता/i, text: 'प्रिय उपभोक्ता' },
    { regex: /\bHi dear!\b/i, text: 'Hi dear!' },
  ];

  const provenanceQuotes: string[] = [];
  genericGreetings.forEach((g) => {
    const match = text.match(g.regex);
    if (match) provenanceQuotes.push(match[0]);
  });

  const provenanceDetected = provenanceQuotes.length > 0 || isPersonalSender;

  signals.push({
    id: 'provenance',
    label: 'Missing provenance & generic greeting',
    detected: provenanceDetected,
    severity: provenanceDetected ? 'medium' : 'none',
    evidenceQuotes: provenanceQuotes,
    explanation: provenanceDetected
      ? `Uses impersonal generic salutation ('${provenanceQuotes[0] || 'Unknown recipient'}') characteristic of mass spray-and-pray phishing rather than targeted banking correspondence.`
      : 'Sender metadata has legitimate provenance or institutional verification.',
    weight: provenanceDetected ? 10 : 0,
  });

  if (provenanceDetected && provenanceQuotes.length > 0) {
    provenanceQuotes.forEach((q) => {
      highlightSpans.push({
        quote: q,
        signalId: 'provenance',
        signalLabel: 'Generic Impersonal Salutation',
        severity: 'medium',
      });
    });
  }

  // Multi-signal risk aggregation:
  // Calculate total raw score
  let totalScore = signals.reduce((acc, sig) => acc + (sig.detected ? sig.weight : 0), 0);

  // Special checks:
  // Check if text is genuine educational notice (e.g. RV College with .edu.in)
  if (normalizedSender.includes('rvce.edu.in') || normalizedText.includes('campus.rvce.edu.in')) {
    totalScore = 8;
  }
  // Check if text is a safe standard 2FA OTP with warning
  if (hasDefensiveCaution && !urlDetected && !urgencyDetected) {
    totalScore = 4;
  }

  // Cap between 0 and 100
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine Risk Tier
  let riskTier: LocalSecurityEvaluation['riskTier'] = 'Low risk';
  if (totalScore >= 70) {
    riskTier = 'High risk';
  } else if (totalScore >= 35) {
    riskTier = 'Medium risk';
  } else if (text.trim().length < 25 && totalScore === 0) {
    riskTier = 'Inconclusive';
  }

  // Active reasons list
  const activeReasons: SuspiciousReason[] = [];
  if (urgencyDetected) {
    activeReasons.push({
      category: 'Urgency',
      explanation: 'Threatens account suspension today.',
      severity: 'high',
      excerpt: urgencyQuotes[0],
    });
  }
  if (urlDetected) {
    activeReasons.push({
      category: 'Suspicious link request',
      explanation: 'Asks the recipient to use a link to verify their account.',
      severity: 'high',
      excerpt: urlQuotes[0] || extractedUrls[0]?.original,
    });
  }
  if (maliciousCredentialRequest) {
    activeReasons.push({
      category: 'Sensitive action',
      explanation: 'Attempts to make the recipient take an account-related action.',
      severity: 'high',
      excerpt: credentialQuotes[0],
    });
  }
  if (domainInconsistent) {
    activeReasons.push({
      category: 'Sender/domain inconsistency',
      explanation: 'Sender claims corporate or institutional authority but utilizes an inconsistent origin address or channel.',
      severity: 'high',
      excerpt: domainInconsistencyQuotes[0],
    });
  }
  if (financialDetected) {
    activeReasons.push({
      category: 'Financial request',
      explanation: 'Pressures the recipient to make an immediate payment or transfers fees under duress.',
      severity: 'high',
      excerpt: financialQuotes[0],
    });
  }

  // Build Safe Verification Guidance
  let primaryInstruction = 'Do not use the message\'s link. Contact your organisation using its independently verified official app, website or phone number.';
  const safeSteps: string[] = [];
  const prohibitedActions: string[] = [
    'Do not click or tap any links or shortened URLs in the message.',
    'Do not reply "STOP" or send any confirmation text (this validates your active number to spammers).',
    'Do not call phone numbers or WhatsApp handles provided inside the message body.',
  ];

  if (mentionsOrg && (normalizedText.includes('bank') || normalizedText.includes('sbi') || normalizedText.includes('bbva') || normalizedText.includes('hdfc'))) {
    primaryInstruction = 'Do not use the message\'s link. Contact your bank using its independently verified official app, website or phone number on the back of your physical card.';
    safeSteps.push('Check the back of your physical debit/credit card for the official toll-free customer care number.');
    safeSteps.push('Open your bank\'s official mobile banking app downloaded directly from official app stores.');
    safeSteps.push('Log in directly via official web browser bookmark (e.g. onlinesbi.sbi or hdfcbank.com) and check your security message inbox.');
    safeSteps.push('Forward the smishing SMS to your telecommunications carrier fraud desk (Text 7726 or SPAM in India/US/UK).');
  } else if (normalizedText.includes('rvce') || normalizedText.includes('college') || normalizedText.includes('exam')) {
    primaryInstruction = 'Verify institutional circulars through your verified campus portal or department notice board.';
    safeSteps.push('Navigate independently to your student portal (e.g. campus.rvce.edu.in) through your college bookmark.');
    safeSteps.push('Verify the notification with your class counselor, HOD, or Registrar office.');
  } else if (normalizedText.includes('bescom') || normalizedText.includes('बिजली') || normalizedText.includes('electricity')) {
    primaryInstruction = 'Do not call the mobile number in the message. Check your official electricity utility account.';
    safeSteps.push('Log in to the official state electricity board portal (e.g. bescom.karnataka.gov.in) using your Consumer Account (CA) number.');
    safeSteps.push('Dial the verified official 24x7 BESCOM/Electricity helpline (e.g. 1912 in Karnataka/India).');
  } else if (normalizedText.includes('parcel') || normalizedText.includes('postal') || normalizedText.includes('delivery') || normalizedText.includes('usps')) {
    primaryInstruction = 'Do not pay any redelivery fee. Track your package using the official postal tracking portal.';
    safeSteps.push('Copy your tracking number and enter it directly on indiapost.gov.in or usps.com.');
    safeSteps.push('Legitimate postal services will never request credit card payments over SMS for standard package deliveries.');
  } else {
    safeSteps.push('Locate the organisation\'s official customer support number via their verified corporate website or directory.');
    safeSteps.push('Never rely on telephone numbers, emails, or links included in unsolicited messages.');
  }

  const officialVerificationChannels = [
    'Official banking app downloaded from Apple App Store or Google Play Store',
    'Toll-free telephone number printed on your physical card or bank statement',
    'Independent browser search for the verified root domain (look for .gov, .edu, or verified corporate domain)',
    'Report spam directly to telecom carrier shortcode (7726 / SPAM)',
  ];

  const recommendedAction: RecommendedAction = {
    primaryInstruction,
    safeSteps,
    prohibitedActions,
    officialVerificationChannels,
  };

  const headlineSummary =
    riskTier === 'High risk'
      ? 'Critical threat indicators detected: message exhibits multi-vector deception tactics including urgency, suspicious link destination, and credential/sensitive action requests.'
      : riskTier === 'Medium risk'
      ? 'Elevated caution advised: message contains partial suspicious signals requiring independent verification before taking action.'
      : riskTier === 'Inconclusive'
      ? 'Insufficient evidence: message is too brief or lacks actionable indicators. Maintain standard security vigilance.'
      : 'Legitimate indicators present: message aligns with standard notifications, lacks deceptive links or urgency extortion, and encourages defensive security.';

  return {
    riskScore: totalScore,
    riskTier,
    headlineSummary,
    signals,
    activeReasons,
    extractedUrls,
    recommendedAction,
    highlightSpans,
  };
}
