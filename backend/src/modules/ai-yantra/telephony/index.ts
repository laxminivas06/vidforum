import { TelephonyProvider } from './types';
import { ExotelProvider } from './ExotelProvider';
import { TwilioProvider } from './TwilioProvider';
import { env } from '../../../config/env';

export * from './types';
export * from './ExotelProvider';
export * from './TwilioProvider';

export function getTelephonyProvider(preferred?: string): TelephonyProvider {
  const mode = preferred || process.env.TELEPHONY_PROVIDER || 'auto';

  if (mode === 'twilio') {
    return new TwilioProvider();
  }

  if (mode === 'exotel') {
    return new ExotelProvider();
  }

  // Auto mode: prioritize Twilio if configured, else Exotel
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    return new TwilioProvider();
  }

  return new ExotelProvider();
}
