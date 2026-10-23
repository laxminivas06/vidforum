/**
 * Conversational Reasoning Engine (Groq LPU / Llama 3.3 70B & Qwen 2.5)
 * Enforces the natural human counselor persona, zero robotic vocabulary, clause streaming,
 * and seamless [Agent Interrupted] handling.
 */

import { env } from '../../../config/env';
import {
  getStudentMarksTool,
  getStudentAttendanceTool,
  getFeeStatusTool,
  lookupStudentRecordTool,
  GROQ_TOOL_DEFINITIONS,
  normalizeSubjectName,
} from './tools';
import { normalizeSpokenText } from '../audio/normalizer';

export interface GroqBrainOptions {
  institutionId: string;
  studentId?: string;
  studentName?: string;
  guardianName?: string;
  language?: string;
  useCase?: string;
  studentDossier?: string;
  onToolStart?: (toolName: string) => void;
  onClauseStream?: (clause: string) => void;
}

export interface GroqChatResult {
  reply: string;
  toolUsed?: string;
  toolData?: any;
  interrupted?: boolean;
}

/**
 * Punctuation regex for real-time clause streaming
 */
const CLAUSE_BOUNDARY_REGEX = /([.?!,।\n]+)/;

/**
 * Splits text into clauses based on natural conversational punctuation boundaries
 */
export function extractClauses(text: string): string[] {
  const parts = text.split(CLAUSE_BOUNDARY_REGEX);
  const clauses: string[] = [];
  let current = '';

  for (let i = 0; i < parts.length; i++) {
    current += parts[i];
    if (CLAUSE_BOUNDARY_REGEX.test(parts[i])) {
      if (current.trim().length > 0) {
        clauses.push(current.trim());
      }
      current = '';
    }
  }

  if (current.trim().length > 0) {
    clauses.push(current.trim());
  }

  return clauses;
}

export async function processConversationalTurn(
  messages: Array<{ role: string; content: string }>,
  options: GroqBrainOptions
): Promise<GroqChatResult> {
  const language = options.language || 'te-IN';
  const studentName = options.studentName || 'Sai Teja Chary';
  const guardianName = options.guardianName || 'Parent';
  const studentId = options.studentId || 'SIA-2026-0101';
  const instId = options.institutionId;

  if (!env.GROQ_API_KEY) {
    const fallback =
      language === 'te-IN'
        ? 'నమస్కారం అండి! Narayana School నుండి Priya ని మాట్లాడుతున్నాను. మీకు ఎలా help చేయగలను?'
        : 'Hello! This is Priya from Narayana School. How can I help you today?';
    if (options.onClauseStream) {
      options.onClauseStream(fallback);
    }
    return { reply: fallback };
  }

  // Language & Tone Guidelines
  let languageDirective = '';
  if (language === 'te-IN') {
    languageDirective = `LANGUAGE & TONE MANDATE (CONVERSATIONAL TENGLISH):
You are a warm, human school counselor speaking in natural everyday Telugu mixed with English ("Tenglish").
1. Avoid Pure or Literary Telugu: Speak the way teachers and parents naturally converse in Hyderabad/Telangana/Andhra Pradesh. Keep English school terms in English (Science, Maths, Marks, Exam, Attendance, Fee, Report Card, Sports, Leave).
2. Human Counselor Presence: Speak as if you are holding the student's physical report card on your table. Never say words like "database", "querying", "records", "system", "fetching", or "tool".
3. Voice & Interruption Etiquette: If previous turn contains "[Agent Interrupted]", immediately and warmly address the parent's new query directly without repeatedly apologizing.
4. Voice-Optimized Output: Zero bullet points, asterisks (*), markdown formatting, hashes, or tables.
5. Strict limit: Maximum 1 to 2 concise spoken sentences per turn.`;
  } else if (language === 'hi-IN') {
    languageDirective = `CRITICAL LANGUAGE & TONE GUIDELINES:
- Output strictly in warm, polite conversational Hindi.
- Voice-optimized: zero symbols, markdown, bullet points, or tables.
- Polite honorifics: "जी", "बताइए".
- Counselor Persona: Never say "database", "system", or "fetching".
- Strict limit: Maximum 2 concise spoken sentences per turn.`;
  } else {
    languageDirective = `CRITICAL LANGUAGE & TONE GUIDELINES:
- Output in clear, warm, natural conversational English as a school counselor.
- Voice-optimized: zero symbols, markdown, bullet points, or tables.
- Strict limit: Maximum 2 concise spoken sentences per turn.`;
  }

  const useCaseDesc =
    options.useCase === 'fee_reminder'
      ? 'Term-2 tuition fee reminder and fee balance inquiry'
      : options.useCase === 'attendance_alert'
      ? 'Morning assembly absence notification and parent leave confirmation'
      : options.useCase === 'exam_announcement'
      ? 'Quarterly examination results release notice'
      : 'School event announcement (Annual Sports Day celebration)';

  // Report Card Dossier or Fallback Lookup
  const recordsSection = options.studentDossier
    ? `
${options.studentDossier}

COUNSELOR INFORMATION RULES:
1. STRICT REFERENCE-ONLY RULE: The student report card above is for YOUR REFERENCE ONLY. NEVER recite or dump marks, grades, attendance, or fees unprompted!
2. If the caller asks about leave or makes an announcement, respond directly with warm confirmation and DO NOT recite marks!
3. If the caller specifically asks for marks (e.g., "marks ఎంత?", "Science లో ఎంత వచ్చింది?"), answer directly with the exact score in 1 concise sentence.`
    : `
COUNSELOR INFORMATION RULES:
1. If the parent asks for marks, attendance, or fees, check the report card via the appropriate lookup function.
2. Deliver only the specific fact requested in 1-2 warm sentences in natural Tenglish.
3. If not found: "Sorry అండి, ఈ వివరాలు రిపోర్ట్ కార్డులో ఇంకా నమోదు కాలేదు."`;

  const systemPrompt = `# Role & Identity
You are Priya, a warm, caring, and helpful human School Counselor at Narayana e-Techno School.
You are on a phone call with ${guardianName}, parent of student ${studentName} (Admission/Roll Number: ${studentId}).
Current Call Purpose: ${useCaseDesc}.

---
## CORE CONVERSATIONAL RULES:
1. LISTEN & CONFIRM PARENT ANNOUNCEMENTS:
   - If the parent makes ANY announcement (student has fever, sick, taking leave tomorrow, attending event, bus change, etc.), LISTEN CAREFULLY and WARMLY CONFIRM IT (e.g., "సరే అండి, leave note చేసుకున్నాను. Class teacher కి inform చేస్తాను. Thank you for informing us!").
   - NEVER ignore the parent's announcement!
2. STRICTLY DO NOT RECITE MARKS UNPROMPTED:
   - NEVER recite marks or fees UNLESS the parent EXPLICITLY asks for them (e.g. "marks entha?", "maths lo enni vachayi?", "what are his marks?").
3. NEVER HANG UP ABRUPTLY:
   - Always keep the conversation open with a warm follow-up:
     - In Telugu: "ఇంకేమైనా details కావాలా అండి?"
     - In Hindi: "क्या आप कुछ और जानकारी जानना चाहते हैं जी?"
     - In English: "Do you have any other questions regarding the student?"
4. ZERO ROBOTIC VOCABULARY:
   - Strictly forbid words like "database", "querying", "records", "system", "fetching", "tool", "API", "డేటాబేస్", "సిస్టమ్". Speak naturally as a school counselor holding a physical report card.
5. AGENT INTERRUPTED PROTOCOL:
   - If previous message contains "[Agent Interrupted]", it means the caller interrupted you. Acknowledge their new query directly and answer without long apologies.

---
${recordsSection}

---
${languageDirective}`;

  const chatMessages: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
  const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  // 1. Initial LLM Call with Tool Declarations
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      tools: GROQ_TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 220,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API returned ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  const choice = data.choices && data.choices[0];
  if (!choice) {
    const fallback =
      language === 'te-IN'
        ? 'థ్యాంక్స్ అండి, మీకు ఇంకేమైనా details కావాలా?'
        : 'Thank you, do you need any other details?';
    if (options.onClauseStream) options.onClauseStream(fallback);
    return { reply: fallback };
  }

  let finalReply = choice.message.content || '';
  let toolUsedName: string | undefined;
  let toolResultData: any;

  // 2. Handle Tool Calling If Emitted
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const toolCall = choice.message.tool_calls[0];
    toolUsedName = toolCall.function?.name || '';
    let args: any = {};
    try {
      args = JSON.parse(toolCall.function?.arguments || '{}');
    } catch (_) {}

    const targetStudentId = args.student_id || studentId;
    if (options.onToolStart && toolUsedName) {
      options.onToolStart(toolUsedName);
    }

    if (toolUsedName === 'get_student_marks') {
      const targetSub = normalizeSubjectName(args.subject || 'General Science');
      toolResultData = await getStudentMarksTool(instId, targetStudentId, targetSub);
    } else if (toolUsedName === 'get_student_attendance') {
      toolResultData = await getStudentAttendanceTool(instId, targetStudentId);
    } else if (toolUsedName === 'get_fee_status') {
      toolResultData = await getFeeStatusTool(instId, targetStudentId);
    } else if (toolUsedName === 'lookup_student_record') {
      toolResultData = await lookupStudentRecordTool(instId, args.roll_number_or_name || targetStudentId);
    }

    // Secondary LLM Call to Formulate Spoken Counselor Response
    const secondRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...chatMessages,
          choice.message,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResultData),
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    if (secondRes.ok) {
      const secondData: any = await secondRes.json();
      const content = secondData.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        finalReply = content;
      }
    } else {
      console.warn(`[GROQ SECOND CALL ERROR ${secondRes.status}]`, await secondRes.text());
    }
  }

  // 3. Spoken Normalization
  finalReply = normalizeSpokenText(finalReply, language);

  // 4. Stream clauses to caller if callback is registered
  if (options.onClauseStream && finalReply) {
    const clauses = extractClauses(finalReply);
    for (const clause of clauses) {
      options.onClauseStream(clause);
    }
  }

  return {
    reply: finalReply,
    toolUsed: toolUsedName,
    toolData: toolResultData,
  };
}
