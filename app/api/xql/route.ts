import { getCurrentUser } from '@/app/actions';
import {
  convertToModelMessages,
  streamText,
  ToolSet,
  tool,
  hasToolCall,
  UIMessage,
  UIDataTypes,
  InferUITools,
  generateText,
} from 'ai';
import { ChatSDKError } from '@/lib/errors';
import { directXqlRequestSchema, extractCitationUrls, normalizeXqlRequest } from '@/lib/scira-cli-contract';

import { markdownJoinerTransform } from '@/lib/parser';
import { scira } from '@/ai/providers';

import { GroqProviderOptions } from '@ai-sdk/groq';
import { XaiProviderOptions } from '@ai-sdk/xai';

async function executeXqlSearch(input: unknown) {
  const {
    query,
    startDate,
    endDate,
    includeXHandles,
    excludeXHandles,
    postFavoritesCount,
    postViewCount,
    maxResults,
  } = normalizeXqlRequest(directXqlRequestSchema.parse(input));

  console.log('X search - includeHandles:', includeXHandles, 'excludeHandles:', excludeXHandles);

  const result = await generateText({
    model: scira.languageModel('scira-grok-4-fast'),
    prompt: query,
    maxOutputTokens: 10,
    providerOptions: {
      xai: {
        searchParameters: {
          mode: 'on',
          fromDate: startDate,
          toDate: endDate,
          maxSearchResults: maxResults,
          returnCitations: true,
          sources: [
            {
              type: 'x',
              ...(includeXHandles?.length ? { includedXHandles: includeXHandles } : {}),
              ...(excludeXHandles?.length ? { excludedXHandles: excludeXHandles } : {}),
              ...(typeof postFavoritesCount === 'number' ? { postFavoriteCount: postFavoritesCount } : {}),
              ...(typeof postViewCount === 'number' ? { postViewCount: postViewCount } : {}),
            },
          ],
        },
      } satisfies XaiProviderOptions,
    },
  });

  return extractCitationUrls(result.sources);
}

const xqlTool = tool({
  description:
    'Search X posts for recent information and discussions with the ability to filter by X handles, date range, and post engagement metrics.',
  inputSchema: directXqlRequestSchema,
  async execute(input) {
    return executeXqlSearch(input);
  },
});

const tools = {
  xql: xqlTool,
};

export type XQLMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>;

export async function POST(req: Request) {
  console.log('🔍 Search API endpoint hit');

  const requestStartTime = Date.now();
  const body = await req.json();

  if (body && typeof body === 'object' && 'query' in body) {
    try {
      const urls = await executeXqlSearch(body);
      return Response.json(urls);
    } catch (error) {
      console.error('Direct XQL request failed:', error);
      return new ChatSDKError('bad_request:api', 'Invalid XQL request payload').toResponse();
    }
  }

  const { messages } = body;

  const user = await getCurrentUser();

  if (!user) {
    console.log('User not found');
  }

  // REMOVED: Pro subscription check for self-hosting
  // if (user) {
  //     const isProUser = user.isProUser;
  //
  //     if (!isProUser) {
  //         return new ChatSDKError('upgrade_required:auth', 'This feature requires a Pro subscription').toResponse();
  //     }
  // }

  const result = streamText({
    model: scira.languageModel('scira-grok-4-fast'),
    messages: await convertToModelMessages(messages),
    stopWhen: hasToolCall('xql'),
    onAbort: ({ steps }) => {
      console.log('Stream aborted after', steps.length, 'steps');
    },
    prepareStep: ({ stepNumber }) => {
      if (stepNumber === 0) {
        return {
          toolChoice: { toolName: 'xql', type: 'tool' },
          activeTools: ['xql'],
        };
      }
    },
    providerOptions: {
      groq: {
        reasoningEffort: 'none',
        parallelToolCalls: false,
        structuredOutputs: true,
        serviceTier: 'auto',
      } satisfies GroqProviderOptions,
    },
    maxRetries: 10,
    experimental_transform: markdownJoinerTransform(),
    system: `You are a helpful assistant that searches for X posts, You will be given a search query and you will need to search for the posts and return the results in a structured format.

        Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}.
        The date range is from 15 days ago to today unless the user specifies otherwise.

        The tool to use is xql.

        The tool has the following parameters:
        - query: The natural language query
        - startDate: The start date of the search in the format YYYY-MM-DD (default to 15 days ago if not specified)
        - endDate: The end date of the search in the format YYYY-MM-DD (default to today if not specified)
        - includeXHandles: The X handles to include in the search (max 10 handles). Do not include the @ symbol. CANNOT be used together with excludeXHandles.
        - excludeXHandles: The X handles to exclude in the search (max 10 handles). Do not include the @ symbol. CANNOT be used together with includeXHandles. Note: "grok" handle is automatically excluded by default.
        - postFavoritesCount: The minimum number of favorites (likes) the post must have to be included
        - postViewCount: The minimum number of views the post must have to be included
        - maxResults: The maximum number of search results to return (default 15, max 100)

        IMPORTANT CONSTRAINTS:
        - Maximum 10 handles for include/exclude lists
        - Cannot use both includeXHandles and excludeXHandles in the same query
        - postFavoritesCount and postViewCount are minimum thresholds, not exact matches

        The tools name is xql it doesnt meant you should write SQL in the input of the tool!
        `,
    tools: {
      xql: xqlTool,
    } as ToolSet,
    onChunk(event) {
      if (event.chunk.type === 'tool-call') {
        console.log('Called Tool: ', event.chunk.toolName);
      }
    },
    onStepFinish(event) {
      if (event.warnings) {
        console.log('Warnings: ', event.warnings);
      }
    },
    onFinish: async (event) => {
      console.log('Fin reason: ', event.finishReason);
      console.log('Steps: ', event.steps);
      console.log('Tool calls: ', event.toolCalls);
      console.log('Tool Result: ', event.toolResults);
      console.log('Response: ', event.response);
      console.log('Provider metadata: ', event.providerMetadata);
      console.log('Sources: ', event.sources);
      console.log('Usage: ', event.usage);
      console.log('Total Usage: ', event.totalUsage);

      const requestEndTime = Date.now();
      const processingTime = (requestEndTime - requestStartTime) / 1000;
      console.log('--------------------------------');
      console.log(`Total request processing time: ${processingTime.toFixed(2)} seconds`);
      console.log('--------------------------------');
    },
    onError(event) {
      console.log('Error: ', event.error);
      const requestEndTime = Date.now();
      const processingTime = (requestEndTime - requestStartTime) / 1000;
      console.log('--------------------------------');
      console.log(`Request processing time (with error): ${processingTime.toFixed(2)} seconds`);
      console.log('--------------------------------');
    },
  });

  result.consumeStream();

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
}
