import { Output, tool, generateText } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { z } from 'zod';
import { generateObject } from 'ai';
import { DEFAULT_MODEL, scira } from '@/ai/providers';

export const textTranslateTool = tool({
  description: 'Translate text from one language to another.',
  parameters: z.object({
    text: z.string().describe('The text to translate.'),
    to: z.string().describe('The language to translate to in the format of ISO 639-1.'),
    from: z.string().optional().describe('Optional source language ISO 639-1 code. If omitted, it will be detected.'),
  }),
  // @ts-expect-error - AI SDK v6 type inference issue
  execute: async ({ text, to }) => {
    const { object: translation } = await generateObject({
      model: scira.languageModel(DEFAULT_MODEL),
      system: `You are a helpful assistant that translates text from one language to another.`,
      prompt: `Translate the following text to ${to} language: ${text}`,
      schema: z.object({
        translatedText: z.string(),
        detectedLanguage: z.string().describe('The detected language of the input text in the format of ISO 639-1.'),
      }),
    });
    console.log('[text-translate] Text prompt built:', promptText.substring(0, 200));

    // Text-only translation
    if (!text || text.trim() === '') {
      console.log('[text-translate] Error: No text provided');
      throw new Error('No text to translate. Please provide text or an image containing text.');
    }

    console.log('[text-translate] Calling TranslateGemma for text-only translation...');
    const { text: translatedText } = await generateText({
      model: cohere('command-a-translate-08-2025'),
      prompt: promptText,
      temperature: 0,
    });
    console.log('[text-translate] Text translation complete. Result length:', translatedText.length);
    console.log('[text-translate] Translation result:', translatedText.substring(0, 200));

    return {
      translatedText: translatedText.trim(),
      detectedLanguage,
    };
  },
});
