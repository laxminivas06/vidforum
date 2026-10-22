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

      const spokenText = ctx.initialMessage || (
        ctx.language === 'te-IN'
          ? 'నమస్కారం అండి! నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను.'
          : ctx.language === 'hi-IN'
          ? 'नमस्ते! मैं नारायण स्कूल से प्रिया बोल रही हूँ।'
          : 'Hello! This is Priya calling from Narayana High School.'
      );
      const safeSpokenText = spokenText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      let sayTag: string;
      if (ctx.language === 'te-IN') {
        // Twilio standard Google voice for Telugu (India)
        sayTag = `<Say voice="Google.te-IN-Standard-A" language="te-IN">${safeSpokenText}</Say>`;
      } else if (ctx.language === 'hi-IN') {
        sayTag = `<Say voice="Polly.Aditi" language="hi-IN">${safeSpokenText}</Say>`;
      } else {
        sayTag = `<Say voice="Polly.Aditi" language="en-IN">${safeSpokenText}</Say>`;
      }

      let twiml: string;
      if (ctx.streamUrl) {
        twiml = `<Response><Connect><Stream url="${ctx.streamUrl}"><Parameter name="institutionId" value="${ctx.institutionId || ''}" /><Parameter name="studentId" value="${ctx.studentId || ''}" /><Parameter name="studentName" value="${encodeURIComponent(ctx.studentName || '')}" /><Parameter name="guardianName" value="${encodeURIComponent(ctx.guardianName || '')}" /><Parameter name="phone" value="${normalized}" /><Parameter name="language" value="${ctx.language || 'te-IN'}" /><Parameter name="useCase" value="${ctx.useCase || 'event_notice'}" /></Stream></Connect><Pause length="2"/>${sayTag}</Response>`;
      } else {
        twiml = `<Response><Pause length="2"/>${sayTag}</Response>`;
      }

      const params = new URLSearchParams();
      params.append('From', env.TWILIO_PHONE_NUMBER);
      params.append('To', normalized);

      // Twilio Free Trial accounts strictly forbid inline 'Twiml' parameter on POST /Calls.json.
      // Twilio's official stateless twimlets.com/echo URL service serves the exact TwiML XML
      // and is fully supported on BOTH Trial and Production/Paid accounts.
      const echoUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(twiml)}`;
      params.append('Url', echoUrl);

      // Note: On Twilio Free Trial accounts, 'MachineDetection' causes Twilio to return HTTP 400 (error 0).
      // Only include it if AMD is requested and we know trial won't reject it.
      if (ctx.enableAmd) {
        params.append('MachineDetection', 'Enable');
        params.append('MachineDetectionTimeout', String(ctx.amdTimeoutSeconds || 5));
      }

      if (ctx.webhookUrl) {
        params.append('StatusCallback', ctx.webhookUrl);
        params.append('StatusCallbackEvent', 'completed');
        params.append('StatusCallbackEvent', 'busy');
        params.append('StatusCallbackEvent', 'no-answer');
        params.append('StatusCallbackEvent', 'failed');
      }

      console.log(`[TELEPHONY:TWILIO] Placing outbound call to ${masked}`);

      let res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      let bodyText = await res.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(bodyText);
      } catch (_) {}

      // If rejected due to disallowed parameters (e.g., MachineDetection on Trial accounts), auto-retry without AMD
      if (!res.ok && (parsedJson?.code === 0 || bodyText.toLowerCase().includes('trial accounts have limited parameter')) && params.has('MachineDetection')) {
        console.warn(`[TELEPHONY:TWILIO] Retrying call to ${masked} without MachineDetection for Trial account compatibility`);
        params.delete('MachineDetection');
        params.delete('MachineDetectionTimeout');
        res = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        bodyText = await res.text();
        try {
          parsedJson = JSON.parse(bodyText);
        } catch (_) {}
      }

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

      if (rawMsg.toLowerCase().includes('unverified') || rawMsg.toLowerCase().includes('verified recipient') || parsedJson?.code === 21216 || parsedJson?.code === 573003 || res.status === 422) {
        actionRequired = `Number ${masked} is not verified. On Twilio Trial accounts, outbound calls can ONLY be placed to Verified Caller IDs. Add and verify this number in Twilio Console (Phone Numbers > Manage > Verified Caller IDs) or upgrade your Twilio account.`;
      } else if (rawMsg.toLowerCase().includes('trial accounts have limited parameter') || parsedJson?.code === 0) {
        actionRequired = 'Twilio Trial account restrictions: Ensure the destination number is verified in Twilio Console and avoid unsupported trial parameters.';
      } else if (res.status === 401) {
        actionRequired = 'Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env.';
      } else if (rawMsg.toLowerCase().includes('geo-permission') || parsedJson?.code === 21215) {
        actionRequired = 'Enable Indian (+91) Geo Permissions in Twilio Voice Settings (Console > Voice > Settings > Geo Permissions).';
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
