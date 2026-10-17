import { TelephonyProvider, CallContext, CallResult, normalizeE164, maskPhoneNumber } from './types';
import { env } from '../../../config/env';

export class TwilioProvider implements TelephonyProvider {
  readonly name = 'twilio' as const;

  async placeCall(to: string, ctx: CallContext): Promise<CallResult> {
    const normalized = normalizeE164(to);
    const masked = maskPhoneNumber(normalized);

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      return {
        callSid: `twi_unconfigured_${Date.now()}`,
        status: 'failed',
        provider: 'twilio',
        phone: masked,
        errorMessage: 'Twilio credentials missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER).',
        actionRequired: 'Provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in backend/.env',
      };
    }

    try {
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Calls.json`;

      let twiml: string;
      if (ctx.streamUrl) {
        twiml = `<Response><Connect><Stream url="${ctx.streamUrl}"><Parameter name="institutionId" value="${ctx.institutionId}" /><Parameter name="studentId" value="${ctx.studentId}" /><Parameter name="language" value="${ctx.language}" /><Parameter name="useCase" value="${ctx.useCase}" /></Stream></Connect></Response>`;
      } else {
        const spokenText = ctx.initialMessage || (
          ctx.language === 'te-IN'
            ? 'నమస్కారం అండి! నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను.'
            : ctx.language === 'hi-IN'
            ? 'नमस्ते! मैं नारायण स्कूल से प्रिया बोल रही हूँ।'
            : 'Hello! This is Priya calling from Narayana High School.'
        );
        const pollyLang = ctx.language === 'te-IN' ? 'te-IN' : ctx.language === 'hi-IN' ? 'hi-IN' : 'en-IN';
        twiml = `<Response><Say voice="Polly.Aditi" language="${pollyLang}">${spokenText}</Say></Response>`;
      }

      const params = new URLSearchParams();
      params.append('From', env.TWILIO_PHONE_NUMBER);
      params.append('To', normalized);
      params.append('Twiml', twiml);

      if (ctx.webhookUrl) {
        params.append('StatusCallback', ctx.webhookUrl);
        params.append('StatusCallbackEvent', 'completed');
        params.append('StatusCallbackEvent', 'busy');
        params.append('StatusCallbackEvent', 'no-answer');
        params.append('StatusCallbackEvent', 'failed');
      }

      console.log(`[TELEPHONY:TWILIO] Placing outbound call to ${masked}`);

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const bodyText = await res.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(bodyText);
      } catch (_) {}

      if (res.ok) {
        const callSid = parsedJson?.sid || `twi_${Date.now()}`;
        return {
          callSid,
          status: 'initiated',
          provider: 'twilio',
          httpStatus: res.status,
          rawResponse: parsedJson,
          phone: masked,
        };
      }

      const rawMsg = parsedJson?.message || bodyText;
      let actionRequired = 'Verify Twilio console for outbound authorization.';

      if (rawMsg.toLowerCase().includes('unverified') || parsedJson?.code === 21216) {
        actionRequired = `Number ${masked} is not verified. On Twilio Trial accounts, you must verify the destination number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified or upgrade to paid.`;
      } else if (res.status === 401) {
        actionRequired = 'Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env.';
      } else if (rawMsg.toLowerCase().includes('geo-permission') || parsedJson?.code === 21215) {
        actionRequired = 'Enable Indian (+91) Geo Permissions in Twilio Voice Settings.';
      }

      return {
        callSid: `twi_err_${Date.now()}`,
        status: 'carrier_rejected',
        provider: 'twilio',
        httpStatus: res.status,
        errorMessage: `Twilio Error (${res.status}): ${rawMsg}`,
        actionRequired,
        rawResponse: parsedJson,
        phone: masked,
      };
    } catch (err: any) {
      return {
        callSid: `twi_exc_${Date.now()}`,
        status: 'failed',
        provider: 'twilio',
        errorMessage: err.message || 'Twilio network request failed',
        actionRequired: 'Check network connectivity to api.twilio.com',
        phone: masked,
      };
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; details: any }> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      return { healthy: false, details: { configured: false } };
    }
    try {
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}.json`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      if (!res.ok) {
        return { healthy: false, details: { httpStatus: res.status, error: await res.text() } };
      }
      const data: any = await res.json();
      return {
        healthy: data?.status === 'active',
        details: {
          accountStatus: data?.status,
          friendlyName: data?.friendly_name,
          type: data?.type,
        },
      };
    } catch (err: any) {
      return { healthy: false, details: { error: err.message } };
    }
  }
}
