'use server';

import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { scira } from '@/ai/providers';

type SuggestionMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function suggestQuestions(history: SuggestionMessage[]) {
  if (process.env.SELF_HOSTED_DISABLE_SUGGESTED_QUESTIONS === 'true') {
    return { questions: [] };
  }

  try {
    const { output } = await generateText({
      model: scira.languageModel('scira-follow-up'),
      providerOptions: {
        google: {
          structuredOutputs: true,
        } satisfies GoogleGenerativeAIProviderOptions,
      },
      system: `You are a search engine follow up query/questions generator. You MUST create between 3 and 5 questions for the search engine based on the conversation history.

### Question Generation Guidelines:
- Create 3-5 questions that are open-ended and encourage further discussion
- Questions must be concise (5-10 words each) but specific and contextually relevant
- Each question must contain specific nouns, entities, or clear context markers
- Questions should explore different aspects, implications, comparisons, or applications of the topic
- Avoid generic questions like "Tell me more" or "What else?"
- Make questions natural and conversational
- Questions should be in the same language as the user's query

JSON Output Schema:
{
  "questions": [
    "First follow-up question?",
    "Second follow-up question?",
    "Third follow-up question?"
  ]
}
`,
      messages: history,
      output: Output.object({
        schema: z.object({
          questions: z
            .array(z.string().max(150))
            .describe('The generated questions based on the message history.')
            .min(3)
            .max(5),
        }),
      }),
    });

    return {
      questions: output.questions,
    };
  } catch (error) {
    console.warn('Suggested questions disabled after generation failure:', error);
    return { questions: [] };
  }
}
