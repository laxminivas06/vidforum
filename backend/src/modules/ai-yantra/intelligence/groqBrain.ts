/**
 * Conversational Reasoning Engine (Groq LPU / Llama 3.3 70B & Qwen 2.5)
 * Enforces the natural human counselor persona, zero robotic vocabulary, and tool execution.
 */

import { env } from '../../../config/env';
import {
  getStudentMarksTool,
  getStudentAttendanceTool,
  getFeeStatusTool,
  GROQ_TOOL_DEFINITIONS,
  normalizeSubjectName,
} from './tools';
import { validateScriptPurity, normalizeSpokenText } from '../audio/normalizer';

export interface GroqBrainOptions {
  institutionId: string;
  studentId?: string;
  studentName?: string;
  guardianName?: string;
  language?: string;
  useCase?: string;
  studentDossier?: string;
  onToolStart?: (toolName: string) => void;
}

export interface GroqChatResult {
  reply: string;
  toolUsed?: string;
  toolData?: any;
  interrupted?: boolean;
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
    return {
      reply:
        language === 'te-IN'
          ? 'నమస్కారం అండి! నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను. మీకు ఎలా సహాయపడగలను?'
          : 'Hello! This is Priya from Narayana School. How can I help you today?',
    };
  }

  // Language Directives
  let languageDirective = '';
  if (language === 'te-IN') {
    languageDirective = `CRITICAL LANGUAGE REQUIREMENT: You MUST respond strictly in 100% PURE, NATURAL, POLITE TELUGU (తెలుగు) using proper TELUGU SCRIPT ONLY.
- ABSOLUTELY ZERO ENGLISH WORDS, ZERO CODE-MIXING, ZERO "TENGLISH".
- Do NOT output English words like "marks", "Science", "Quarterly", "A grade" in Latin script. Write them cleanly in Telugu script: "మార్కులు", "సైన్స్", "గణితం", "త్రైమాసిక పరీక్ష", "ఎ గ్రేడ్".
- Always maintain warmth and respect with "అండి" and polite Telugu phrasing.
- Strict limit: Maximum 2 concise spoken sentences.`;
  } else if (language === 'hi-IN') {
    languageDirective = `CRITICAL LANGUAGE REQUIREMENT: You MUST respond strictly in 100% PURE, POLITE HINDI (हिंदी) using DEVANAGARI SCRIPT ONLY.
- ABSOLUTELY ZERO ENGLISH WORDS. NO CODE-MIXING.
- Strict limit: Maximum 2 concise spoken sentences.`;
  } else {
    languageDirective = `CRITICAL LANGUAGE REQUIREMENT: You MUST respond strictly in 100% FLUENT, POLITE, PROFESSIONAL ENGLISH.
- Strict limit: Maximum 2 concise spoken sentences.`;
  }

  // Pre-warmed Student Dossier or Fallback Tool Calling
  const recordsSection = options.studentDossier ? `
${options.studentDossier}

CRITICAL RULES FOR FAST CONVERSATION:
1. The student's complete examination marks, attendance, and fee records are ALREADY ON YOUR DESK above.
2. When the caller asks about ANY marks (whether a single subject like Mathematics, Science, or "all subjects" / "అన్ని సబ్జెక్టులు"), attendance, or fees:
   - Directly answer from the record above in 1 warm sentence in pure spoken Telugu!
   - DO NOT call any tool functions when the details are already in the record above!
3. Only invoke a tool function if the caller asks for something that is NOT in the record above.` : `
2. When the parent asks ANY question regarding marks, attendance, or fees:
   - Call the appropriate function (get_student_marks, get_student_attendance, get_fee_status).
   - If they ask for "Maths", "Math", "Science", or any subject, pass the canonical subject name.
   - If the subject is not yet finalized, state it warmly: "గణితం మార్కులు ఇంకా ఖరారు కాలేదు అండి, త్వరలోనే తెలియజేస్తాము."`;

  // Strict Human Counselor Persona Prompt (Zero Robotic Vocabulary)
  const systemPrompt = `You are Priya, a warm, polite, articulate, and caring senior student counselor at Narayana e-Techno School. You are talking over a real phone call with ${guardianName}, the parent of ${studentName} (Admission Number: ${studentId}).
${languageDirective}

CRITICAL CONVERSATIONAL & PERSONA RULES:
1. NEVER use technical, robotic, or database words.
   - FORBIDDEN WORDS: "database", "records", "querying", "fetching", "system", "tool", "API", "backend", "డేటాబేస్", "సిస్టమ్".
   - Speak naturally as if you are a real school counselor holding the student's physical paper report card in front of you.
   - Example (Good): "మీ బాబు సాయి తేజకు గణితంలో 100 కి 94 మార్కులు వచ్చాయి అండి. చాలా బాగా చదువుతున్నాడు."
   - Example (Forbidden): "మా డేటాబేస్ లో చూసి చెప్తున్నాను..." or "I am fetching marks from the database."

${recordsSection}

3. Call Flow & Interruption Context:
   - If previous assistant message contains "[Agent Interrupted]", it means the caller spoke while you were speaking. Acknowledge and answer their new question directly without apologizing repeatedly.`;

  const chatMessages: any[] = [{ role: 'system', content: systemPrompt }, ...messages];
  const model = env.GROQ_MODEL || 'qwen/qwen3.8-27b';

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
    return {
      reply:
        language === 'te-IN'
          ? 'ధన్యవాదాలు అండి, మీకు ఇంకేమైనా వివరాలు కావాలా?'
          : 'Thank you, do you need any other details?',
    };
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
      finalReply = secondData.choices?.[0]?.message?.content || finalReply;
    }
  }

  // 3. Spoken Normalization & Script Purity Validation
  finalReply = normalizeSpokenText(finalReply, language);
  const purity = validateScriptPurity(finalReply, language);
  if (!purity.valid) {
    console.warn(`[PURITY RE-TRY] Output contained Latin leaks (${purity.reason}). Re-prompting...`);
    const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...chatMessages,
          { role: 'assistant', content: finalReply },
          {
            role: 'user',
            content:
              language === 'te-IN'
                ? 'ముఖ్యమైన ఆదేశం: ఎట్టి పరిస్థితుల్లోనూ ఇంగ్లీష్ లేదా రోమన్ లిపి ఉపయోగించవద్దు. కేవలం 100% తెలుగు లిపిలో మాత్రమే గౌరవంగా 2 వాక్యాలలో సమాధానం చెప్పండి.'
                : 'कड़ा निर्देश: उत्तर केवल 100% शुद्ध देवनागरी हिंदी में दें।',
          },
        ],
        temperature: 0.1,
        max_tokens: 220,
      }),
    });

    if (retryRes.ok) {
      const retryData: any = await retryRes.json();
      finalReply = normalizeSpokenText(retryData.choices?.[0]?.message?.content?.trim() || finalReply, language);
    }
  }

  return {
    reply: finalReply,
    toolUsed: toolUsedName,
    toolData: toolResultData,
  };
}
