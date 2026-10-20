/**
 * Meta WhatsApp Cloud API Integration
 * Sends post-call digital receipts (summary & UPI payment link for answered calls;
 * polite missed-call notices for busy / no-answer calls).
 */

import { env } from '../../../config/env';
import { normalizeE164, maskPhoneNumber } from '../telephony';

export interface WhatsAppSendOptions {
  toPhone: string;
  guardianName: string;
  studentName: string;
  useCase: string;
  callOutcome: 'completed' | 'no_answer' | 'busy' | 'interrupted' | 'failed';
  durationSeconds?: number;
  marksSummary?: string;
  feeAmountDue?: string;
  upiPaymentLink?: string;
  language?: string;
}

export interface WhatsAppSendResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Formulates the localized WhatsApp message body based on call outcome and use-case
 */
export function buildWhatsAppMessageBody(options: WhatsAppSendOptions): string {
  const lang = options.language || 'te-IN';
  const guardian = options.guardianName || 'తల్లిదండ్రులు';
  const student = options.studentName || 'మీ విద్యార్థి';

  // 1. Post-Call Summary for Completed Calls
  if (options.callOutcome === 'completed') {
    if (options.useCase === 'fee_reminder') {
      const amount = options.feeAmountDue || '₹12,500';
      const upiLink = options.upiPaymentLink || `upi://pay?pa=schoolfees@okaxis&pn=NarayanaSchool&am=${amount.replace(/[^0-9]/g, '')}&cu=INR`;
      if (lang === 'te-IN') {
        return `నమస్కారం ${guardian} గారు,\n\nనారాయణ పాఠశాల నుండి ఫోన్ కాల్ మాట్లాడినందుకు ధన్యవాదాలు. మీ విద్యార్థి ${student} కి సంబంధించి రెండవ విడత ట్యూషన్ ఫీజు బకాయి వివరాలు:\n\n*బకాయి మొత్తం:* ${amount}\n*గడువు తేదీ:* నవంబర్ 15, 2026\n\nసులభంగా ఆన్‌లైన్ ద్వారా చెల్లించడానికి క్రింది అధికారిక UPI లింక్‌ను ఉపయోగించండి:\n${upiLink}\n\nభవదీయులు,\nనారాయణ పాఠశాల యాజమాన్యం`;
      }
      return `Dear ${guardian},\n\nThank you for speaking with Narayana High School. Here is the fee summary for ${student}:\n\n*Amount Due:* ${amount}\n*Due Date:* November 15, 2026\n\nPay securely via official UPI:\n${upiLink}\n\nWarm regards,\nNarayana High School`;
    }

    if (options.useCase === 'exam_announcement') {
      const summary = options.marksSummary || 'గణితం: 94/100 (A), జనరల్ సైన్స్: 88/100 (A)';
      if (lang === 'te-IN') {
        return `నమస్కారం ${guardian} గారు,\n\nమీ విద్యార్థి ${student} త్రైమాసిక పరీక్షా ఫలితాల వివరాలు:\n\n*ఫలితాలు:* ${summary}\n\nవిద్యార్థి సమగ్ర ప్రోగ్రెస్ రిపోర్ట్ కార్డ్ కోసం పాఠశాల పేరెంట్ పోర్టల్‌ను సందర్శించండి.\n\nభవదీయులు,\nనారాయణ పాఠశాల`;
      }
      return `Dear ${guardian},\n\nHere are the academic exam results for ${student}:\n\n*Results:* ${summary}\n\nVisit the parent portal to download the detailed report card.\n\nWarm regards,\nNarayana High School`;
    }

    if (options.useCase === 'attendance_alert') {
      if (lang === 'te-IN') {
        return `నమస్కారం ${guardian} గారు,\n\nమీ విద్యార్థి ${student} ఈ రోజు ఉదయం పాఠశాల ప్రార్థన సమయానికి హాజరుకాలేదు. విద్యార్థి సెలవులో ఉన్నారా అని ధృవీకరించడానికి దయచేసి పాఠశాల కార్యాలయానికి తెలియజేయగలరు.\n\nభవదీయులు,\nనారాయణ పాఠశాల హాజరు విభాగం`;
      }
      return `Dear ${guardian},\n\nYour student ${student} was marked absent during morning assembly today. Please contact the school office to confirm leave.\n\nWarm regards,\nNarayana High School`;
    }

    // Default Event Notice
    if (lang === 'te-IN') {
      return `నమస్కారం ${guardian} గారు,\n\nరాబోయే శనివారం మన నారాయణ పాఠశాలలో నిర్వహించబడుతున్న వార్షిక క్రీడా దినోత్సవానికి మీరు మరియు మీ కుటుంబ సభ్యులు సాదరంగా ఆహ్వానితులు.\n\nభవదీయులు,\nనారాయణ పాఠశాల యాజమాన్యం`;
    }
    return `Dear ${guardian},\n\nYou are cordially invited to the Annual Sports Day celebrations this Saturday at Narayana High School.\n\nWarm regards,\nNarayana High School`;
  }

  // 2. Polite Missed-Call Notice (No Answer / Busy / Interrupted)
  if (lang === 'te-IN') {
    return `నమస్కారం ${guardian} గారు,\n\nనారాయణ పాఠశాల నుండి మేము మీ విద్యార్థి ${student} కి సంబంధించి ముఖ్యమైన సమాచారం తెలియజేయడానికి కాల్ చేశాము, కానీ మీతో మాట్లాడటం వీలుపడలేదు.\n\nమరిన్ని వివరాలకు లేదా మీ సందేహాలకు మీరు పాఠశాల కార్యాలయాన్ని సంప్రదించవచ్చు లేదా ఈ సందేశానికి సమాధానం ఇవ్వవచ్చు.\n\nభవదీయులు,\nనారాయణ పాఠశాల`;
  }

  return `Dear ${guardian},\n\nWe tried calling you from Narayana High School regarding your student ${student}, but were unable to reach you.\n\nPlease feel free to reply to this message or contact the school office for any queries.\n\nWarm regards,\nNarayana High School`;
}

/**
 * Sends a message via Meta WhatsApp Cloud API
 */
export async function sendMetaWhatsAppMessage(options: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
  const token = env.META_WHATSAPP_TOKEN || env.WHATSAPP_API_TOKEN;
  const phoneId = env.META_PHONE_NUMBER_ID || env.WHATSAPP_PHONE_NUMBER_ID;

  const to = normalizeE164(options.toPhone).replace(/^\+/, '');
  const masked = maskPhoneNumber(options.toPhone);

  if (!token || !phoneId) {
    console.log(`[WHATSAPP MOCK] Credentials not configured. Simulating WhatsApp to ${masked} for student ${options.studentName}`);
    return { sent: true, messageId: `wamid_sim_${Date.now()}` };
  }

  const bodyText = buildWhatsAppMessageBody(options);

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: bodyText,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[WHATSAPP ERROR ${res.status}] to ${masked}:`, errText);
      return { sent: false, error: `Meta Cloud API (${res.status}): ${errText}` };
    }

    const data: any = await res.json();
    const messageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
    console.log(`[WHATSAPP SENT] Message delivered to ${masked}. Message ID: ${messageId}`);
    return { sent: true, messageId };
  } catch (err: any) {
    console.error(`[WHATSAPP EXCEPTION] to ${masked}:`, err.message);
    return { sent: false, error: err.message };
  }
}
