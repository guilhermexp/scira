import { tool } from 'ai';
import { z } from 'zod';
import { serverEnv } from '@/env/server';

export const codeContextTool = tool({
  description: 'Get the context about coding, programming, and development libraries, frameworks, and tools',
  parameters: z.object({
    query: z.string().min(1).max(100).describe('The query to search for'),
  }),
  // @ts-expect-error - AI SDK v6 type inference issue
  execute: async ({ query }) => {
    const response = await fetch('https://api.exa.ai/context', {
      method: 'POST',
      headers: {
        'x-api-key': serverEnv.EXA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        tokensNum: 'dynamic',
      }),
    });
    const data = await response.json();
    return data;
  },
});
