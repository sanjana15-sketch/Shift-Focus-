/**
 * Privacy-conscious PII Scrubber for TrustLens
 * Redacts personal identifiers before analysis or reporting to guarantee privacy.
 */

export interface RedactionToken {
  type: 'PHONE' | 'EMAIL' | 'CARD' | 'ACCOUNT' | 'NAME' | 'OTP' | 'NATIONAL_ID';
  placeholder: string;
  count: number;
}

export interface ScrubResult {
  sanitizedText: string;
  tokensRedacted: RedactionToken[];
  totalRedacted: number;
  originalText: string;
  piiDetected: boolean;
}

export function scrubPII(text: string): ScrubResult {
  let sanitized = text;
  const tokenCounts: Record<string, number> = {
    PHONE: 0,
    EMAIL: 0,
    CARD: 0,
    ACCOUNT: 0,
    NAME: 0,
    OTP: 0,
    NATIONAL_ID: 0,
  };

  // 1. Credit / Debit card numbers (13-19 digits, with spaces or hyphens)
  const cardRegex = /\b(?:\d{4}[ -]?){3}\d{1,4}\b/g;
  sanitized = sanitized.replace(cardRegex, () => {
    tokenCounts.CARD++;
    return `[REDACTED_CARD_NUMBER]`;
  });

  // 2. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  sanitized = sanitized.replace(emailRegex, () => {
    tokenCounts.EMAIL++;
    return `[REDACTED_EMAIL]`;
  });

  // 3. Phone numbers (International, Indian, US, UK formats)
  // Matches e.g. +91 9876543210, +1 (555) 019-2834, 9876543210, 555-0199
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}\b/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    // Avoid redacting short dates, years or amounts
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      tokenCounts.PHONE++;
      return `[REDACTED_PHONE]`;
    }
    return match;
  });

  // 4. One-Time Passwords / Verification Codes (e.g. "Your OTP is 894212" or "Code: 492041")
  const otpRegex = /\b(?:OTP|code|passcode|PIN|verification code)[:\s]+([0-9]{4,8})\b/gi;
  sanitized = sanitized.replace(otpRegex, (_match, code) => {
    tokenCounts.OTP++;
    return `OTP: [REDACTED_OTP_${code.length}DIGIT]`;
  });

  // 5. Bank Account / IBAN numbers
  const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;
  sanitized = sanitized.replace(ibanRegex, () => {
    tokenCounts.ACCOUNT++;
    return `[REDACTED_IBAN]`;
  });

  const acctRegex = /\b(?:account|acct|A\/C)\s*(?:no\.?|number|#)?[:\s]*(\d{6,16})\b/gi;
  sanitized = sanitized.replace(acctRegex, () => {
    tokenCounts.ACCOUNT++;
    return `account [REDACTED_ACCOUNT_NO]`;
  });

  // 6. Aadhaar / SSN / National IDs (e.g. XXXX-XXXX-XXXX or XXX-XX-XXXX)
  const nationalIdRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s\d{4}\s\d{4}\b/g;
  sanitized = sanitized.replace(nationalIdRegex, () => {
    tokenCounts.NATIONAL_ID++;
    return `[REDACTED_NATIONAL_ID]`;
  });

  // 7. Personal Names following formal salutations (e.g. "Dear John Doe,", "Hello Priya Sharma,")
  const nameSalutationRegex = /\b(?:Dear|Hello|Hi|Mr\.|Mrs\.|Ms\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?=,|\.|\s)/g;
  sanitized = sanitized.replace(nameSalutationRegex, (match, name) => {
    // Do not redact generic words like "Customer", "User", "Sir", "Madam", "Member"
    if (/customer|user|member|resident|citizen|patron|student|applicant|client/i.test(name)) {
      return match;
    }
    tokenCounts.NAME++;
    return match.replace(name, `[REDACTED_NAME]`);
  });

  const totalRedacted = Object.values(tokenCounts).reduce((a, b) => a + b, 0);

  const tokensRedacted: RedactionToken[] = Object.entries(tokenCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as RedactionToken['type'],
      placeholder: `[REDACTED_${type}]`,
      count,
    }));

  return {
    sanitizedText: sanitized,
    tokensRedacted,
    totalRedacted,
    originalText: text,
    piiDetected: totalRedacted > 0,
  };
}
