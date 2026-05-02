import { z } from 'zod';

const ymdDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');

export const directXqlRequestSchema = z
  .object({
    query: z.string().min(1).describe("The natural language query crafted from the user's arbitrary query"),
    startDate: ymdDateSchema.optional(),
    endDate: ymdDateSchema.optional(),
    includeXHandles: z.array(z.string()).max(10).optional(),
    excludeXHandles: z.array(z.string()).max(10).optional(),
    postFavoritesCount: z.number().min(0).optional(),
    postViewCount: z.number().min(0).optional(),
    maxResults: z.number().min(1).max(100).optional(),
  })
  .refine((data) => !(data.includeXHandles && data.excludeXHandles), {
    message: 'Cannot specify both includeXHandles and excludeXHandles - use one or the other',
    path: ['includeXHandles', 'excludeXHandles'],
  });

export type DirectXqlRequest = z.infer<typeof directXqlRequestSchema>;

export function resolveSciraModelAlias(model: string): string {
  switch (model.trim()) {
    case 'xai:grok-4.1-fast':
      return 'scira-grok4.1-fast-thinking';
    case 'xai:grok-4-fast':
      return 'scira-grok-4-fast';
    default:
      return model.trim();
  }
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sanitizeHandle(handle: string): string {
  return handle.replace(/^@+/, '').trim();
}

export function normalizeXqlRequest(input: DirectXqlRequest, now: Date = new Date()): DirectXqlRequest {
  const normalizedInput = directXqlRequestSchema.parse(input);
  const today = new Date(now);
  const daysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);

  const includeXHandles = normalizedInput.includeXHandles?.map(sanitizeHandle).filter(Boolean);
  const excludeXHandles = normalizedInput.excludeXHandles?.map(sanitizeHandle).filter(Boolean);

  return {
    query: normalizedInput.query,
    startDate: normalizedInput.startDate?.trim().length ? normalizedInput.startDate : toYmd(daysAgo),
    endDate: normalizedInput.endDate?.trim().length ? normalizedInput.endDate : toYmd(today),
    includeXHandles: includeXHandles && includeXHandles.length > 0 ? includeXHandles : undefined,
    excludeXHandles: excludeXHandles && excludeXHandles.length > 0 ? excludeXHandles : undefined,
    postFavoritesCount: normalizedInput.postFavoritesCount,
    postViewCount: normalizedInput.postViewCount,
    maxResults:
      typeof normalizedInput.maxResults === 'number'
        ? Math.max(15, Math.min(normalizedInput.maxResults, 100))
        : 15,
  };
}

export function extractCitationUrls(
  sources: Array<{ sourceType?: string; url?: string | null }>,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const source of sources) {
    if (source?.sourceType !== 'url' || !source.url) {
      continue;
    }

    if (seen.has(source.url)) {
      continue;
    }

    seen.add(source.url);
    urls.push(source.url);
  }

  return urls;
}
