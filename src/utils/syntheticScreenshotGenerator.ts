/**
 * Synthetic Smartphone Screenshot Generator
 * Generates realistic mobile SMS / WhatsApp screenshot images on an in-memory Canvas
 * for instant one-click testing of multimodal vision analysis.
 */

export interface ScreenshotPreset {
  id: string;
  name: string;
  sender: string;
  body: string;
  platform: 'sms' | 'whatsapp';
}

export const SCREENSHOT_PRESETS: ScreenshotPreset[] = [
  {
    id: 'sc-bank-suspension',
    name: 'Acme Bank Suspension SMS',
    sender: '+1 (800) 555-0199',
    body: 'Dear Customer, your bank account will be suspended today. Verify your account immediately using the link below to avoid service interruption. https://secure-bank-verify-acct.net/login',
    platform: 'sms',
  },
  {
    id: 'sc-kannada-sbi',
    name: 'Kannada SBI KYC Alert',
    sender: '+91 94821 55902',
    body: 'ಆತ್ಮೀಯ ಗ್ರಾಹಕರೇ, ನಿಮ್ಮ SBI ಬ್ಯಾಂಕ್ ಖಾತೆಯನ್ನು ಇಂದೇ ಅಮಾನತುಗೊಳಿಸಲಾಗುವುದು. ನಿಮ್ಮ KYC ಅಪ್‌ಡೇಟ್ ಮಾಡಲು ಈ ಕೆಳಗಿನ ಲಿಂಕ್ ಬಳಸಿ: https://sbi-kyc-verify-portal.in',
    platform: 'sms',
  },
  {
    id: 'sc-whatsapp-job',
    name: 'WhatsApp Remote Work Scam',
    sender: 'Sarah HR (+1 917 642-8812)',
    body: 'Hello! I am Sarah from HR Global Talent. We reviewed your LinkedIn profile. Earn ₹3,000 to ₹8,000 daily rating travel bookings. Contact Telegram @GlobalHR_Director to claim ₹500 bonus!',
    platform: 'whatsapp',
  },
  {
    id: 'sc-legit-2fa',
    name: 'Legitimate Bank 2FA Code',
    sender: 'HDFC-SEC',
    body: '729410 is your authentication passcode for transaction of INR 1,450.00 at Swiggy. Valid for 5 mins. NEVER share this code with anyone, including bank officials.',
    platform: 'sms',
  },
];

export function generateSyntheticScreenshot(preset: ScreenshotPreset): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    const isWhatsApp = preset.platform === 'whatsapp';

    // 1. Phone background
    ctx.fillStyle = isWhatsApp ? '#0b141a' : '#0a0d14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Status Bar (Top)
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('9:41', 24, 28);

    // Battery / Signal symbols
    ctx.fillRect(canvas.width - 45, 18, 22, 11);
    ctx.strokeRect(canvas.width - 46, 17, 24, 13);
    ctx.fillRect(canvas.width - 22, 21, 2, 5);

    // 3. Navigation / Header Bar
    ctx.fillStyle = isWhatsApp ? '#1f2c34' : '#111827';
    ctx.fillRect(0, 42, canvas.width, 68);
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.lineTo(canvas.width, 110);
    ctx.stroke();

    // Back chevron
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(28, 70);
    ctx.lineTo(20, 76);
    ctx.lineTo(28, 82);
    ctx.stroke();

    // Avatar
    ctx.fillStyle = isWhatsApp ? '#00a884' : '#334155';
    ctx.beginPath();
    ctx.arc(54, 76, 18, 0, Math.PI * 2);
    ctx.fill();

    // Sender Name / Number
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(preset.sender, 82, 73);

    // Subtext (e.g. "Text Message · SMS" or "online")
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(isWhatsApp ? 'WhatsApp Business Account' : 'SMS / MMS Service', 82, 92);

    // 4. Timestamp pill in chat
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 50, 135, 100, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Today 10:24 AM', canvas.width / 2, 151);
    ctx.textAlign = 'left';

    // 5. Incoming Message Bubble
    const bubbleX = 20;
    const bubbleY = 175;
    const bubbleWidth = 340;
    const padding = 16;

    // Word wrap calculation
    ctx.font = '14px system-ui, sans-serif';
    const words = preset.body.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > bubbleWidth - padding * 2) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);

    const bubbleHeight = lines.length * 22 + padding * 2 + 18;

    // Draw Bubble background
    ctx.fillStyle = isWhatsApp ? '#202c33' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 14);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = isWhatsApp ? '#2a3942' : '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw message text lines
    ctx.fillStyle = '#f1f5f9';
    lines.forEach((line, i) => {
      // Highlight URL in blue
      if (line.includes('http')) {
        ctx.fillStyle = '#38bdf8';
      } else {
        ctx.fillStyle = '#f1f5f9';
      }
      ctx.fillText(line, bubbleX + padding, bubbleY + padding + 14 + i * 22);
    });

    // Bubble delivery timestamp
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('10:24 AM', bubbleX + bubbleWidth - 62, bubbleY + bubbleHeight - 8);

    // 6. Bottom Input Bar Mockup
    ctx.fillStyle = isWhatsApp ? '#1f2c34' : '#0f172a';
    ctx.fillRect(0, canvas.height - 65, canvas.width, 65);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(20, canvas.height - 52, canvas.width - 80, 38, 19);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Text Message', 36, canvas.height - 28);

    // Send button circle
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(canvas.width - 34, canvas.height - 33, 18, 0, Math.PI * 2);
    ctx.fill();

    resolve(canvas.toDataURL('image/png'));
  });
}
