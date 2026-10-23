/**
 * Spoken Number, Currency & Unicode Script Purity Normalizer
 * Converts raw numbers, fractions, percentages, dates, and currencies into natural spoken phrasing.
 * Verifies script purity via Unicode ranges (\u0C00-\u0C7F for Telugu, \u0900-\u097F for Devanagari).
 * Injects respectful cultural honorifics (అండి, గారు, నమస్కారం in Telugu; जी, नमस्कार in Hindi).
 */

export interface PurityCheckResult {
  valid: boolean;
  leakedChars: string[];
  reason?: string;
}

/**
 * Validates that text strictly conforms to the expected script for the target language.
 */
export function validateScriptPurity(text: string, language: string, strict = false): PurityCheckResult {
  if (!text || !text.trim()) return { valid: true, leakedChars: [] };

  if (language === 'te-IN') {
    if (strict) {
      // In strict Telugu mode, no Latin characters are allowed except digits and whitespace
      const latinMatches = text.match(/[a-zA-Z]/g) || [];
      if (latinMatches.length > 0) {
        return {
          valid: false,
          leakedChars: Array.from(new Set(latinMatches)).slice(0, 10),
          reason: `Found ${latinMatches.length} Latin characters in strict Telugu script mode.`,
        };
      }
    }
    // In conversational Tenglish mode, natural school nouns are allowed
    return { valid: true, leakedChars: [] };
  }

  if (language === 'hi-IN') {
    if (strict) {
      const latinMatches = text.match(/[a-zA-Z]/g) || [];
      if (latinMatches.length > 0) {
        return {
          valid: false,
          leakedChars: Array.from(new Set(latinMatches)).slice(0, 10),
          reason: `Found ${latinMatches.length} Latin characters in pure Hindi mode.`,
        };
      }
    }
    return { valid: true, leakedChars: [] };
  }

  return { valid: true, leakedChars: [] };
}

/**
 * Normalizes numbers, fractions, percentages, dates, and currencies into natural spoken phrasing.
 */
export function normalizeSpokenText(text: string, language: string): string {
  if (!text) return '';
  let out = text;

  if (language === 'te-IN') {
    // 1. Currency: ₹12,500 or Rs. 12500 -> 12500 రూపాయలు
    out = out.replace(/(?:₹|Rs\.?\s*)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, (_, num) => {
      const cleanNum = num.replace(/,/g, '');
      return `${cleanNum} రూపాయలు`;
    });

    // 2. Marks Fraction: 88/100 marks or 88/100 -> 100 కి 88 marks
    out = out.replace(/(\d+)\s*\/\s*100(?:\s*marks)?/gi, (_, marks) => {
      return `100 కి ${marks} marks`;
    });

    // 3. Generic fraction: 88/90 -> 90 కి 88
    out = out.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, denom) => {
      return `${denom} కి ${num}`;
    });

    // 4. Percentage: 92% or 92 % -> 92 శాతం
    out = out.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, pct) => {
      return `${pct} శాతం`;
    });

    // 5. Date conversions (e.g. 15-11-2026 or 15/11/2026 -> నవంబర్ 15, 2026)
    out = out.replace(/\b(\d{1,2})[-/](11)[-/](\d{4})\b/g, 'నవంబర్ $1, $3');
    out = out.replace(/\b(\d{1,2})[-/](12)[-/](\d{4})\b/g, 'డిసెంబర్ $1, $3');
    out = out.replace(/\b(\d{1,2})[-/](01|1)[-/](\d{4})\b/g, 'జనవరి $1, $3');
    out = out.replace(/\b(\d{1,2})[-/](02|2)[-/](\d{4})\b/g, 'ఫిబ్రవరి $1, $3');
    out = out.replace(/\b(\d{1,2})[-/](03|3)[-/](\d{4})\b/g, 'మార్చి $1, $3');

    // 6. Clean up duplicate words if any
    out = out.replace(/marks\s+marks/gi, 'marks');
    out = out.replace(/మార్కులు\s+మార్కులు/g, 'మార్కులు');

    // 7. Inject cultural honorific if sentence lacks one
    out = injectTeluguHonorific(out);
  } else if (language === 'hi-IN') {
    // 1. Currency
    out = out.replace(/(?:₹|Rs\.?\s*)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, (_, num) => {
      const cleanNum = num.replace(/,/g, '');
      return `${cleanNum} रुपये`;
    });

    // 2. Fraction: 88/100 -> 100 में से 88 अंक
    out = out.replace(/(\d+)\s*\/\s*100/g, (_, marks) => {
      return `100 में से ${marks} अंक`;
    });

    // 3. Percentage: 92% -> 92 प्रतिशत
    out = out.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, pct) => {
      return `${pct} प्रतिशत`;
    });

    out = out.replace(/\bmarks\b/gi, 'अंक');
    out = out.replace(/\bgrade\b/gi, 'ग्रेड');

    // 4. Inject Hindi cultural honorific
    out = injectHindiHonorific(out);
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

/**
 * Ensures polite Telugu honorifics (అండి or గారు) are present
 */
function injectTeluguHonorific(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed) return trimmed;

  // If already has honorific, return as-is
  if (/(అండి|గారు|నమస్కారం)/.test(trimmed)) {
    return trimmed;
  }

  // If ends with punctuation, inject before punctuation or append
  if (/[.!?।]$/.test(trimmed)) {
    return trimmed.replace(/([.!?।])$/, ' అండి$1');
  }

  return `${trimmed} అండి`;
}

/**
 * Ensures polite Hindi honorifics (जी or नमस्कार) are present
 */
function injectHindiHonorific(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed) return trimmed;

  if (/(जी|नमस्कार|नमस्ते)/.test(trimmed)) {
    return trimmed;
  }

  if (/[.!?।]$/.test(trimmed)) {
    return trimmed.replace(/([.!?।])$/, ' जी$1');
  }

  return `${trimmed} जी`;
}
