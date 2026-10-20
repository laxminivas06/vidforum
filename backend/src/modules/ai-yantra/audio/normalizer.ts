/**
 * Spoken Number, Currency & Unicode Script Purity Normalizer
 * Converts raw numbers, fractions, and currencies into natural spoken phrasing,
 * and validates that no English/Latin characters leak into pure Telugu/Hindi synthesis.
 */

export interface PurityCheckResult {
  valid: boolean;
  leakedChars: string[];
  reason?: string;
}

/**
 * Validates that text strictly conforms to the expected script for the target language.
 */
export function validateScriptPurity(text: string, language: string): PurityCheckResult {
  if (!text || !text.trim()) return { valid: true, leakedChars: [] };

  if (language === 'te-IN') {
    // In pure Telugu mode, Latin characters are forbidden
    const latinMatches = text.match(/[a-zA-Z]/g) || [];
    if (latinMatches.length > 0) {
      const uniqueLeaks = Array.from(new Set(latinMatches)).slice(0, 10);
      return {
        valid: false,
        leakedChars: uniqueLeaks,
        reason: `Text contains ${latinMatches.length} English/Latin characters (${uniqueLeaks.join(', ')}) in pure Telugu mode.`,
      };
    }
  }

  if (language === 'hi-IN') {
    // In pure Hindi mode, Latin characters are forbidden
    const latinMatches = text.match(/[a-zA-Z]/g) || [];
    if (latinMatches.length > 0) {
      const uniqueLeaks = Array.from(new Set(latinMatches)).slice(0, 10);
      return {
        valid: false,
        leakedChars: uniqueLeaks,
        reason: `Text contains ${latinMatches.length} Latin characters in pure Hindi mode.`,
      };
    }
  }

  return { valid: true, leakedChars: [] };
}

/**
 * Normalizes numbers, fractions, percentages, and currencies into natural spoken text.
 */
export function normalizeSpokenText(text: string, language: string): string {
  if (!text) return '';
  let out = text;

  if (language === 'te-IN') {
    // 1. Currency: ₹12,500 or Rs. 12500 -> రూపాయలు
    out = out.replace(/(?:₹|Rs\.?\s*)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, (_, num) => {
      const cleanNum = num.replace(/,/g, '');
      return `${cleanNum} రూపాయలు`;
    });

    // 2. Marks Fraction: 88/100 marks or 88/100 -> వందకి 88 మార్కులు
    out = out.replace(/(\d+)\s*\/\s*100(?:\s*marks)?/gi, (_, marks) => {
      return `వందకి ${marks} మార్కులు`;
    });

    // 3. Generic fraction: 88/90 -> 90 కి 88
    out = out.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, denom) => {
      return `${denom} కి ${num}`;
    });

    // 4. Percentage: 92% or 92 % -> 92 శాతం
    out = out.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, pct) => {
      return `${pct} శాతం`;
    });

    // 5. Clean up Latin words and single letter grades for smooth phonetics
    out = out.replace(/\bmarks\b/gi, 'మార్కులు');
    out = out.replace(/\bgrade\s*A\b/gi, 'గ్రేడ్ ఎ');
    out = out.replace(/\bgrade\s*B\b/gi, 'గ్రేడ్ బి');
    out = out.replace(/\bgrade\s*C\b/gi, 'గ్రేడ్ సి');
    out = out.replace(/\bgrade\s*D\b/gi, 'గ్రేడ్ డి');
    out = out.replace(/\bgrade\b/gi, 'గ్రేడ్');
    out = out.replace(/\bscience\b/gi, 'సైన్స్');
    out = out.replace(/\bmaths?\b/gi, 'గణితం');
    out = out.replace(/\bfee\b/gi, 'ఫీజు');
    out = out.replace(/\bA\b/g, 'ఎ');
    out = out.replace(/\bB\b/g, 'బి');
    out = out.replace(/\bC\b/g, 'సి');
    out = out.replace(/\bD\b/g, 'డి');
    out = out.replace(/మార్కులు\s+మార్కులు/g, 'మార్కులు');
  } else if (language === 'hi-IN') {
    // Currency
    out = out.replace(/(?:₹|Rs\.?\s*)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, (_, num) => {
      const cleanNum = num.replace(/,/g, '');
      return `${cleanNum} रुपये`;
    });

    // Fraction: 88/100 -> 100 में से 88 अंक
    out = out.replace(/(\d+)\s*\/\s*100/g, (_, marks) => {
      return `100 में से ${marks} अंक`;
    });

    // Percentage: 92% -> 92 प्रतिशत
    out = out.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, pct) => {
      return `${pct} प्रतिशत`;
    });

    out = out.replace(/\bmarks\b/gi, 'अंक');
    out = out.replace(/\bgrade\b/gi, 'ग्रेड');
  } else {
    // English
    out = out.replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, (_, num) => {
      return `${num} rupees`;
    });
    out = out.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, denom) => {
      return `${num} out of ${denom}`;
    });
    out = out.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, pct) => {
      return `${pct} percent`;
    });
  }

  return out;
}
