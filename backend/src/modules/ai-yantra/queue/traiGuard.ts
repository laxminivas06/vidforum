/**
 * TRAI / DoT Regulatory Calling Window Guard
 * Enforces the strict 08:00 AM – 08:00 PM IST calling boundary.
 * Automatically triggers auto-pause at 07:58 PM IST to prevent in-flight calls
 * from violating the hard 08:00 PM cutoff.
 * Automatically schedules resume at 08:00 AM IST next morning.
 */

export interface TraiWindowStatus {
  isOpen: boolean;
  isNearingCutoff: boolean;
  currentIstTime: string;
  hours: number;
  minutes: number;
  nextWindowStart: string;
  reason?: string;
}

/**
 * Returns current Indian Standard Time (Asia/Kolkata) Date object
 */
export function getNowInIst(): Date {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

/**
 * Checks whether current time is within 08:00 AM - 08:00 PM IST (TRAI compliance)
 */
export function isInsideTraiWindow(): boolean {
  const ist = getNowInIst();
  const hours = ist.getHours();

  // 08:00 AM <= current time < 20:00 (08:00 PM)
  if (hours < 8) return false;
  if (hours >= 20) return false;
  return true;
}

/**
 * Checks if we are within 2 minutes of the 08:00 PM IST hard cutoff (19:58 - 20:00 IST).
 * Active campaigns should pause here so active dials don't cross into 08:01 PM.
 */
export function isNearingCutoff(): boolean {
  const ist = getNowInIst();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();

  return hours === 19 && minutes >= 58;
}

/**
 * Full diagnostic status for UI and Queue workers
 */
export function getTraiWindowStatus(): TraiWindowStatus {
  const ist = getNowInIst();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const isOpen = isInsideTraiWindow();
  const nearing = isNearingCutoff();

  const timeStr = ist.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  let nextWindowStart = '08:00 AM IST';
  if (!isOpen || nearing) {
    if (hours >= 20 || nearing) {
      nextWindowStart = 'Tomorrow at 08:00 AM IST';
    } else {
      nextWindowStart = 'Today at 08:00 AM IST';
    }
  }

  let reason: string | undefined;
  if (nearing) {
    reason = 'Approaching 08:00 PM IST cutoff (19:58 IST). Campaign queues are auto-pausing.';
  } else if (!isOpen) {
    reason = 'Outside TRAI calling hours (08:00 AM – 08:00 PM IST). Automated outbound calls are prohibited by DoT.';
  }

  return {
    isOpen: isOpen && !nearing,
    isNearingCutoff: nearing,
    currentIstTime: `${timeStr} IST`,
    hours,
    minutes,
    nextWindowStart,
    reason,
  };
}

/**
 * Calculates milliseconds until 08:00 AM IST opens next
 */
export function getMsUntilNextWindowOpen(): number {
  const ist = getNowInIst();
  const target = new Date(ist.getTime());

  if (ist.getHours() >= 20 || (ist.getHours() === 19 && ist.getMinutes() >= 58)) {
    // Tomorrow at 8 AM
    target.setDate(target.getDate() + 1);
  }
  target.setHours(8, 0, 0, 0);

  return Math.max(1000, target.getTime() - ist.getTime());
}

/**
 * Active TRAI Compliance Monitor:
 * Checks every 30 seconds. At 19:58 IST, calls onAutoPause().
 * At 08:00 AM IST, calls onAutoResume().
 */
export function startTraiComplianceMonitor(callbacks: {
  onAutoPause: () => void | Promise<void>;
  onAutoResume: () => void | Promise<void>;
}) {
  let wasPausedByTrai = false;

  const check = async () => {
    const ist = getNowInIst();
    const hours = ist.getHours();
    const minutes = ist.getMinutes();

    // 19:58 IST auto-pause
    if (hours === 19 && minutes >= 58 && !wasPausedByTrai) {
      console.warn('[TRAI GUARD] 07:58 PM IST reached. Executing mandatory regulatory auto-pause on active calling queues.');
      wasPausedByTrai = true;
      try {
        await callbacks.onAutoPause();
      } catch (err: any) {
        console.error('[TRAI GUARD ERROR onAutoPause]', err.message);
      }
    }

    // 08:00 AM IST auto-resume
    if (hours === 8 && minutes === 0 && wasPausedByTrai) {
      console.log('[TRAI GUARD] 08:00 AM IST reached. Permitted calling window open. Resuming active queues.');
      wasPausedByTrai = false;
      try {
        await callbacks.onAutoResume();
      } catch (err: any) {
        console.error('[TRAI GUARD ERROR onAutoResume]', err.message);
      }
    }
  };

  // Run initial check and register interval
  check().catch(() => {});
  const timer = setInterval(check, 30000);
  return () => clearInterval(timer);
}
