'use server';

import { generateText } from 'ai';
import { scira } from '@/ai/providers';
import { getLightweightUserAuth } from '@/lib/user-data-server';

export async function enhancePrompt(raw: string) {
  try {
    const auth = await getLightweightUserAuth();

    if (!auth?.isProUser) {
      return { success: false, error: 'Pro subscription required' };
    }

    const system = `You are an expert prompt engineer. Rewrite and enhance the user's prompt.

Today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}. Treat this as the authoritative current date/time.

Temporal awareness:
- Interpret relative time expressions (e.g., "today", "last week", "current", "up-to-date") relative to the date stated above.
- Do not include meta-references like "date above", "current date", or similar in the output.
- Only include an explicit calendar date when the user's prompt requests or clearly implies a time boundary; otherwise, keep timing implicit and avoid adding extra date text.
- Do not speculate about future events beyond the date stated above.

Guidelines (MANDATORY):
- Preserve the user's original intent, constraints, and point of view and voice.
- Make the prompt specific, unambiguous, and actionable.
- Add missing context when implied: entities, timeframe, location, and output format/constraints.
- Remove fluff and vague language; prefer proper nouns over pronouns.
- Keep it concise (add at most 1-2 sentences of necessary context) but information-dense.
- Do NOT ask follow-up questions.
- Do NOT answer the user's request; your job is only to improve the prompt.
- Do NOT introduce new facts not implied by the user.

Output requirements:
- Return ONLY the improved prompt text, in plain text.
- No quotes, no commentary, no markdown, and no preface.`;

    const { text } = await generateText({
      model: scira.languageModel('scira-enhance'),
      temperature: 0.6,
      topP: 0.95,
      maxOutputTokens: 1024,
      system,
      prompt: raw,
    });

    return { success: true, enhanced: text.trim() };
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return { success: false, error: 'Failed to enhance prompt' };
  }
}
