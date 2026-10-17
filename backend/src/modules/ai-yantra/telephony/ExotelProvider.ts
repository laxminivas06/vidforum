import { TelephonyProvider, CallContext, CallResult, normalizeE164, maskPhoneNumber } from './types';
import { env } from '../../../config/env';

export class ExotelProvider implements TelephonyProvider {
  readonly name = 'exotel' as const;

  async placeCall(to: string, ctx: CallContext): Promise<CallResult> {
    const normalized = normalizeE164(to);
    const masked = maskPhoneNumber(normalized);

    if (!env.EXOTEL_API_KEY || !env.EXOTEL_API_TOKEN || !env.EXOTEL_ACCOUNT_SID) {
      return {
        callSid: `exo_unconfigured_${Date.now()}`,
        status: 'failed',
        provider: 'exotel',
        phone: masked,
        errorMessage: 'Exotel credentials missing (EXOTEL_API_KEY, EXOTEL_API_TOKEN, or EXOTEL_ACCOUNT_SID).',
        actionRequired: 'Provide EXOTEL_API_KEY and EXOTEL_API_TOKEN in backend/.env',
      };
    }

    try {
      const auth = Buffer.from(`${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}`).toString('base64');
      const exotelUrl = `https://${env.EXOTEL_SUBDOMAIN}/v1/Accounts/${env.EXOTEL_ACCOUNT_SID}/Calls/connect.json`;

      const params = new URLSearchParams();
      params.append('From', env.EXOTEL_CALLER_ID || '+918047123456');
      // Exotel expects destination in 0XXXXXXXXXX or 91XXXXXXXXXX format
      params.append('To', normalized.replace(/^\+/, ''));
      params.append('CallerId', env.EXOTEL_CALLER_ID || '+918047123456');

      if (ctx.webhookUrl) {
        params.append('StatusCallback', ctx.webhookUrl);
        params.append('StatusCallbackEvents[0]', 'terminal');
      }

      console.log(`[TELEPHONY:EXOTEL] Placing outbound call to ${masked}`);

      const res = await fetch(exotelUrl, {
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
        const callSid = parsedJson?.Call?.Sid || `exo_${Date.now()}`;
        return {
          callSid,
          status: 'initiated',
          provider: 'exotel',
          httpStatus: res.status,
          rawResponse: parsedJson,
          phone: masked,
        };
      }

      const rawMsg = parsedJson?.RestException?.Message || bodyText;
      let actionRequired = 'Check Exotel dashboard for account requirements.';

      if (res.status === 403 || rawMsg.toLowerCase().includes('kyc')) {
        actionRequired = 'Complete institutional KYC compliance on your Exotel Portal (my.exotel.com). Outbound calling is blocked by Indian DoT until KYC is approved.';
      } else if (res.status === 401) {
        actionRequired = 'Verify EXOTEL_API_KEY and EXOTEL_API_TOKEN in backend/.env.';
      }

      return {
        callSid: `exo_err_${Date.now()}`,
        status: 'carrier_rejected',
        provider: 'exotel',
        httpStatus: res.status,
        errorMessage: `Exotel Error (${res.status}): ${rawMsg}`,
        actionRequired,
        rawResponse: parsedJson,
        phone: masked,
      };
    } catch (err: any) {
      return {
        callSid: `exo_exc_${Date.now()}`,
        status: 'failed',
        provider: 'exotel',
        errorMessage: err.message || 'Exotel network connection failed',
        actionRequired: 'Check network connectivity to api.exotel.com',
        phone: masked,
      };
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; details: any }> {
    if (!env.EXOTEL_API_KEY || !env.EXOTEL_API_TOKEN || !env.EXOTEL_ACCOUNT_SID) {
      return { healthy: false, details: { configured: false } };
    }
    try {
      const auth = Buffer.from(`${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}`).toString('base64');
      const res = await fetch(`https://${env.EXOTEL_SUBDOMAIN}/v1/Accounts/${env.EXOTEL_ACCOUNT_SID}.json`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      if (!res.ok) {
        return { healthy: false, details: { httpStatus: res.status, error: await res.text() } };
      }
      const data: any = await res.json();
      return {
        healthy: data?.Account?.Status === 'active',
        details: {
          accountStatus: data?.Account?.Status,
          kycStatus: data?.Account?.KycStatus,
          type: data?.Account?.Type,
        },
      };
    } catch (err: any) {
      return { healthy: false, details: { error: err.message } };
    }
  }
}
