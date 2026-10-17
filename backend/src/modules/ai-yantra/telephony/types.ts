export interface CallContext {
  institutionId: string;
  studentId: string;
  studentName?: string;
  guardianId?: string;
  guardianName?: string;
  language: 'te-IN' | 'en-IN' | 'hi-IN' | string;
  useCase: string;
  campaignId?: string;
  streamUrl?: string;
  webhookUrl?: string;
  initialMessage?: string;
}

export interface CallResult {
  callSid: string;
  status: 'initiated' | 'queued' | 'carrier_rejected' | 'failed';
  provider: 'exotel' | 'twilio' | 'none';
  httpStatus?: number;
  rawResponse?: any;
  actionRequired?: string;
  errorMessage?: string;
  phone: string;
}

export interface TelephonyProvider {
  readonly name: 'exotel' | 'twilio' | 'none';
  placeCall(to: string, ctx: CallContext): Promise<CallResult>;
  checkHealth(): Promise<{ healthy: boolean; details: any }>;
}

export function normalizeE164(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

export function maskPhoneNumber(phone: string): string {
  const norm = normalizeE164(phone);
  if (norm.length <= 6) return norm;
  const start = norm.slice(0, 3);
  const end = norm.slice(-4);
  return `${start}XXXXXX${end}`;
}
