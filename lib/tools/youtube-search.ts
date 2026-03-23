import { Supadata, type TranscriptChunk } from '@supadata/js';
import { tool } from 'ai';
import { z } from 'zod';
import { serverEnv } from '@/env/server';
import { allSettled } from 'better-all';
import { getBetterAllOptions } from '@/lib/better-all';

interface VideoDetails {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  type?: string;
  provider_name?: string;
  provider_url?: string;
  author_avatar_url?: string;
}

interface VideoStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface VideoResult {
  videoId: string;
  url: string;
  details?: VideoDetails;
  captions?: string;
  transcriptChunks?: TranscriptChunk[];
  timestamps?: string[];
  views?: number | string;
  likes?: number | string;
  summary?: string;
  publishedDate?: string;
  durationSeconds?: number;
  stats?: VideoStats;
  tags?: string[];
}

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'anytime';

interface SupadataYouTubeChannel {
  id?: string;
  name?: string;
  thumbnail?: string;
  url?: string;
}

interface SupadataYouTubeVideo {
  type?: string;
  id?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  viewCount?: number;
  uploadDate?: string;
  channel?: SupadataYouTubeChannel;
  tags?: string[];
  url?: string;
}

const SEARCH_LIMIT = 12;
const YOUTUBE_BASE_URL = 'https://www.youtube.com/watch?v=';
const searchModeEnum = z.enum(['general', 'channel', 'playlist']);
const channelVideoTypeEnum = z.enum(['all', 'video', 'short', 'live']);
type SearchMode = z.infer<typeof searchModeEnum>;
type ChannelVideoType = z.infer<typeof channelVideoTypeEnum>;

const timeRangeToUploadDate: Record<Exclude<TimeRange, 'anytime'>, 'hour' | 'today' | 'week' | 'month' | 'year'> = {
  day: 'today',
  week: 'week',
  month: 'month',
  year: 'year',
};

const chapterRegex = /^\s*((?:\d+:)?\d{1,2}:\d{2})\s*[-–—]?\s*(.+)$/i;

function dedupeVideos(videos: SupadataYouTubeVideo[]) {
  const seen = new Set<string>();
  return videos.filter((video) => {
    const videoId = video.id;
    if (!videoId) return false;
    if (seen.has(videoId)) return false;
    seen.add(videoId);
    return true;
  });
}

function extractChaptersFromDescription(description?: string): string[] | undefined {
  if (!description) return undefined;
  const chapters: string[] = [];
  const lines = description.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(chapterRegex);
    if (match) {
      const [, time, title] = match;
      if (time && title) {
        chapters.push(`${time} - ${title.trim()}`);
      }
    }
  }
  return chapters.length > 0 ? chapters : undefined;
}

function generateChaptersFromTranscriptChunks(
  chunks: TranscriptChunk[] | undefined,
  targetCount: number = 30,
): string[] | undefined {
  if (!chunks || chunks.length === 0) return undefined;

  const last = chunks[chunks.length - 1];
  // Supadata returns offset/duration in milliseconds
  const totalDurationMs = Math.max(0, last.offset + last.duration);
  const totalDurationSec = totalDurationMs / 1000;
  if (totalDurationSec <= 1) return undefined;

  const interval = Math.max(10, Math.floor(totalDurationSec / targetCount));

  const formatTime = (secondsTotal: number) => {
    const seconds = Math.max(1, Math.floor(secondsTotal)); // avoid 0:00 which UI filters out
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };

  const chapters: string[] = [];
  const usedTimes = new Set<number>();
  for (let t = interval; t < totalDurationSec; t += interval) {
    // Convert target time to milliseconds for comparison
    const targetMs = t * 1000;
    const idx = chunks.findIndex((chunk) => chunk.offset >= targetMs);
    const chosen = idx >= 0 ? chunks[idx] : chunks[chunks.length - 1];
    const text = chosen.text?.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const key = Math.floor(chosen.offset / 1000);
    if (usedTimes.has(key)) continue;
    usedTimes.add(key);
    chapters.push(`${formatTime(key)} - ${text}`);
    if (chapters.length >= targetCount) break;
  }

  return chapters.length > 0 ? chapters : undefined;
}

async function buildTranscriptArtifacts(supadata: Supadata, videoUrl: string, fallbackDescription?: string) {
  // Check for chapters in description first - skip transcript if we have them
  const timestampsFromDescription = extractChaptersFromDescription(fallbackDescription);

  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      // Use 'native' mode - faster, only fetches existing transcripts (no AI generation)
      const transcriptResult = await supadata.transcript({
        url: videoUrl,
        lang: 'en',
        text: false, // Get timestamped chunks
        mode: 'native', // Only fetch existing transcripts - fast
      });

      // Check if we got a jobId (async processing) vs immediate result
      if ('jobId' in transcriptResult) {
        // For async jobs, poll with shorter intervals
        let attempts = 0;
        const maxAttempts = 5;
        const pollInterval = 1500; // 1.5 seconds

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          const jobResult = await supadata.transcript.getJobStatus(transcriptResult.jobId);

          if (jobResult.status === 'completed' && jobResult.result) {
            const content = jobResult.result.content;
            const chunks = Array.isArray(content) ? content : undefined;
            const transcriptText = chunks ? chunks.map((c) => c.text).join('\n') : typeof content === 'string' ? content : undefined;

            return {
              transcriptText,
              timestamps: timestampsFromDescription ?? generateChaptersFromTranscriptChunks(chunks),
              description: fallbackDescription,
              transcriptChunks: chunks,
            };
          } else if (jobResult.status === 'failed') {
            break; // Don't retry failed jobs
          }
          attempts++;
        }

        // Job didn't complete in time - return with description chapters only
        return {
          transcriptText: undefined,
          timestamps: timestampsFromDescription,
          description: fallbackDescription,
          transcriptChunks: undefined,
        };
      }

      // Immediate result
      const content = transcriptResult.content;
      const chunks = Array.isArray(content) ? content : undefined;
      const transcriptText = chunks ? chunks.map((c) => c.text).join('\n') : typeof content === 'string' ? content : undefined;

      return {
        transcriptText,
        timestamps: timestampsFromDescription ?? generateChaptersFromTranscriptChunks(chunks),
        description: fallbackDescription,
        transcriptChunks: chunks,
      };
    } catch (error) {
      // Only retry on network errors, not on "transcript unavailable"
      const isRetryable = error instanceof Error && !error.message.includes('unavailable');
      if (isRetryable && retry < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }
    }
  }

  // Return with description chapters only
  return {
    transcriptText: undefined,
    timestamps: timestampsFromDescription,
    description: fallbackDescription,
    transcriptChunks: undefined,
  };
}

async function fetchMetadataWithRetry(supadata: Supadata, videoUrl: string, videoId: string) {
  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      const metadata = await supadata.metadata({ url: videoUrl });
      return metadata;
    } catch (error) {
      if (retry < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }
      console.warn(`⚠️ Supadata metadata failed for ${videoId}:`, error);
    }
  }
  return null;
}

function mapTimeRangeToSupadata(timeRange: TimeRange) {
  if (timeRange === 'anytime') return undefined;
  return timeRangeToUploadDate[timeRange];
}

function resolveNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function flattenVideoIds(ids?: { videoIds?: string[]; shortIds?: string[]; liveIds?: string[] }) {
  if (!ids) return [];
  return [...(ids.videoIds ?? []), ...(ids.shortIds ?? []), ...(ids.liveIds ?? [])];
}

function normalizeHandle(query: string) {
  return query.trim().replace(/^@/, '');
}

function extractPlaylistId(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/[?&]list=([^&]+)/i);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }
  if (trimmed.startsWith('PL') || trimmed.startsWith('UU') || trimmed.startsWith('LL')) {
    return trimmed;
  }
  return null;
}

async function resolveChannelIdFromQuery(supadata: Supadata, query: string) {
  const normalized = normalizeHandle(query);
  if (!normalized) return null;

  try {
    const searchResult = await supadata.youtube.search({
      query: normalized,
      type: 'channel',
      limit: 5,
      sortBy: 'relevance',
    });

    const channelResults = (searchResult?.results ?? []) as Array<{
      type?: string;
      id?: string;
      handle?: string;
      name?: string;
    }>;

    const cleanedHandle = normalized.toLowerCase();

    const handleMatch = channelResults.find((result) => {
      if (result.type !== 'channel' || !result.handle) return false;
      const candidate = result.handle.replace(/^@/, '').toLowerCase();
      return candidate === cleanedHandle;
    });

    const chosenChannel = handleMatch ?? channelResults.find((result) => result.type === 'channel');
    if (!chosenChannel) return null;
    return chosenChannel.id || chosenChannel.handle || null;
  } catch (error) {
    console.warn('⚠️ Failed to resolve channel ID from query', { query, error });
    return null;
  }
}

async function resolvePlaylistIdFromQuery(supadata: Supadata, query: string) {
  const playlistId = extractPlaylistId(query);
  if (playlistId) return playlistId;

  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const searchResult = await supadata.youtube.search({
      query: trimmed,
      type: 'playlist',
      limit: 5,
      sortBy: 'relevance',
    });

    const playlistResults = (searchResult?.results ?? []) as Array<{
      type?: string;
      id?: string;
      title?: string;
    }>;

    const chosenPlaylist = playlistResults.find((result) => result.type === 'playlist');
    return chosenPlaylist?.id ?? null;
  } catch (error) {
    console.warn('⚠️ Failed to resolve playlist ID from query', { query, error });
    return null;
  }
}

async function getVideosForMode({
  supadata,
  query,
  timeRange,
  mode,
  channelVideoType,
}: {
  supadata: Supadata;
  query: string;
  timeRange: TimeRange;
  mode: SearchMode;
  channelVideoType?: ChannelVideoType;
}) {
  if (mode === 'general') {
    const uploadDateFilter = mapTimeRangeToSupadata(timeRange);
    const searchResult = await supadata.youtube.search({
      query,
      type: 'video',
      ...(uploadDateFilter ? { uploadDate: uploadDateFilter } : {}),
      limit: SEARCH_LIMIT,
      sortBy: 'relevance',
    });

    const rawVideos = (searchResult?.results ?? []) as SupadataYouTubeVideo[];
    return dedupeVideos(rawVideos.filter((result) => result.type === 'video'));
  }

  const fetchChannelVideos = async (channelQuery: string) => {
    if (!channelQuery.trim()) return [];
    try {
      const ids = await supadata.youtube.channel.videos({
        id: channelQuery,
        limit: SEARCH_LIMIT,
        type: channelVideoType ?? 'all',
      });
      return flattenVideoIds(ids);
    } catch (error) {
      console.warn('⚠️ Supadata channel.videos failed', { channelQuery, error });
      return [];
    }
  };

  const fetchPlaylistVideos = async (playlistId: string | null) => {
    if (!playlistId) return [];
    try {
      const ids = await supadata.youtube.playlist.videos({
        id: playlistId,
        limit: SEARCH_LIMIT,
      });
      return flattenVideoIds(ids);
    } catch (error) {
      console.warn('⚠️ Supadata playlist.videos failed', { playlistId, error });
      return [];
    }
  };

  const normalizedIds =
    mode === 'channel'
      ? await (async () => {
        // First, try to resolve the channel identifier from the query
        const resolvedId = await resolveChannelIdFromQuery(supadata, query);
        const channelIdentifier = resolvedId || query;

        // Now fetch videos using the resolved identifier
        const ids = await fetchChannelVideos(channelIdentifier);
        return ids;
      })()
      : await (async () => {
        const preExtractedId = extractPlaylistId(query);
        const directIds = await fetchPlaylistVideos(preExtractedId ?? query);
        if (directIds.length > 0) return directIds;

        const resolvedId = await resolvePlaylistIdFromQuery(supadata, query);
        if (!resolvedId) return directIds;
        return fetchPlaylistVideos(resolvedId);
      })();

  if (normalizedIds.length === 0) {
    console.warn(`⚠️ No video IDs resolved for mode="${mode}". Falling back to general search.`);
    return getVideosForMode({
      supadata,
      query,
      timeRange,
      mode: 'general',
    });
  }

  const uniqueIds = Array.from(new Set(normalizedIds)).slice(0, SEARCH_LIMIT);

  // Fetch video metadata in parallel for channel/playlist videos
  try {
    const metadataResults = await allSettled(
      Object.fromEntries(
        uniqueIds.map((id) => [
          id,
          async () => {
            const url = `${YOUTUBE_BASE_URL}${id}`;
            const metadata = await supadata.metadata({ url });
            return { id, metadata };
          },
        ]),
      ),
      getBetterAllOptions(),
    );

    const videosWithMetadata = Object.values(metadataResults)
      .filter((r) => r.status === 'fulfilled' && r.value?.metadata)
      .map((r) => {
        const { id, metadata } = (r as PromiseFulfilledResult<{ id: string; metadata: any }>).value;
        const media = metadata.media as { duration?: number; thumbnailUrl?: string } | undefined;
        return {
          id,
          type: 'video' as const,
          title: metadata.title ?? undefined,
          description: metadata.description ?? undefined,
          thumbnail: media?.thumbnailUrl,
          duration: media?.duration,
          viewCount: metadata.stats?.views ?? undefined,
          uploadDate: metadata.createdAt,
          channel: metadata.author ? {
            id: metadata.author.username,
            name: metadata.author.displayName,
            thumbnail: metadata.author.avatarUrl,
          } : undefined,
          tags: metadata.tags,
          url: `${YOUTUBE_BASE_URL}${id}`,
        } as SupadataYouTubeVideo;
      })
      // Sort by date (newest first)
      .sort((a, b) => {
        if (!a.uploadDate && !b.uploadDate) return 0;
        if (!a.uploadDate) return 1;
        if (!b.uploadDate) return -1;
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      });

    if (videosWithMetadata.length > 0) {
      return videosWithMetadata;
    }
  } catch (error) {
    console.warn('⚠️ Parallel metadata fetch error, falling back to IDs only:', error);
  }

  // Fallback: return minimal video objects
  return uniqueIds.map((id) => ({
    id,
    type: 'video',
    url: `${YOUTUBE_BASE_URL}${id}`,
  }));
}

export const youtubeSearchTool = tool({
  description: 'Search YouTube videos using Exa AI and get detailed video information.',
  parameters: z.object({
    query: z.string().describe('The search query for YouTube videos'),
    timeRange: z.enum(['day', 'week', 'month', 'year', 'anytime']),
    mode: searchModeEnum.default('general').describe('general search, channel videos, or playlist videos'),
    channelVideoType: channelVideoTypeEnum.optional().describe('When mode=channel, filter to video/short/live/all'),
  }),
  // @ts-expect-error - AI SDK v6 type inference issue
  execute: async ({
    query,
    timeRange,
    mode = 'general',
    channelVideoType,
  }: {
    query: string;
    timeRange: 'day' | 'week' | 'month' | 'year' | 'anytime';
    mode?: SearchMode;
    channelVideoType?: ChannelVideoType;
  }) => {
    try {
      const supadata = new Supadata({
        apiKey: serverEnv.SUPADATA_API_KEY,
      });

      console.log('🔎 Supadata YouTube search', { query, timeRange, mode, channelVideoType });

      const videoResults = await getVideosForMode({
        supadata,
        query,
        timeRange,
        mode,
        channelVideoType,
      });

      const searchResult = await exa.searchAndContents(query, searchOptions);

      console.log('🎥 YouTube Search Results:', searchResult);

      // Deduplicate videos by ID to avoid redundant API calls
      const uniqueResults = searchResult.results.reduce((acc, result) => {
        const videoIdMatch = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
        const videoId = videoIdMatch?.[1];

        if (videoId && !acc.has(videoId)) {
          acc.set(videoId, result);
        }
        return acc;
      }, new Map());

      console.log(
        `🔍 Processing ${uniqueResults.size} unique videos from ${searchResult.results.length} search results`,
      );

      // Process videos in smaller batches to avoid overwhelming the API
      const batchSize = 5;
      console.log(`📦 Creating batches from ${uniqueResults.size} unique videos with batch size ${batchSize}`);

      const uniqueResultsArray = Array.from(uniqueResults.values());
      console.log(
        `🔗 Unique video URLs:`,
        uniqueResultsArray.map((r) => r.url),
      );

      const batches = uniqueResultsArray.reduce(
        (acc: Array<Array<(typeof searchResult.results)[0]>>, result, index) => {
          const batchIndex = Math.floor(index / batchSize);
          if (!acc[batchIndex]) {
            acc[batchIndex] = [];
            console.log(`📝 Created new batch ${batchIndex + 1}`);
          }
          acc[batchIndex].push(result);
          console.log(`➕ Added video ${index + 1} (${result.url}) to batch ${batchIndex + 1}`);
          return acc;
        },
        [] as Array<Array<(typeof searchResult.results)[0]>>,
      );

      console.log(`📊 Batch creation complete: ${batches.length} batches created`);
      batches.forEach((batch, index) => {
        console.log(`📋 Batch ${index + 1}: ${batch.length} videos`);
        batch.forEach((video, videoIndex) => {
          const videoId = video.url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
          )?.[1];
          console.log(`  ${videoIndex + 1}. ${videoId} - ${video.url}`);
        });
      });

      const processedResults: VideoResult[] = [];

      console.log(`🚀 Starting batch processing: ${batches.length} batches total`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 [BATCH ${batchIndex + 1}/${batches.length}] Processing ${batch.length} videos`);
        console.log(
          `📋 [BATCH ${batchIndex + 1}] Video IDs in this batch:`,
          batch.map((r) => {
            const match = r.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
            return match?.[1] || 'unknown';
          }),
        );

        try {
          const batchResults = await Promise.allSettled(
            batch.map(async (result: (typeof searchResult.results)[0]): Promise<VideoResult | null> => {
              const videoIdMatch = result.url.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
              );
              const videoId = videoIdMatch?.[1];

              if (!videoId) {
                console.warn(`⚠️  No video ID found for URL: ${result.url}`);
                return null;
              }

              const baseResult: VideoResult = {
                videoId,
                url: result.url,
                publishedDate: result.publishedDate,
              };

              try {
                console.log(`📹 Processing video ${videoId}...`);

                // Fetch details and subtitles using youtube-caption-extractor
                const details = await getVideoDetails({ videoID: videoId, lang: 'en' }).catch((e: unknown) => {
                  console.warn(`⚠️ getVideoDetails failed for ${videoId}:`, e);
                  return null;
                });

                // Extract transcript text from subtitles (prefer details.subtitles, fallback to direct API)
                let transcriptText: string | undefined = undefined;
                if (details && Array.isArray(details.subtitles) && details.subtitles.length > 0) {
                  transcriptText = details.subtitles.map((s) => s.text).join('\n');
                } else {
                  const subs = await getSubtitles({ videoID: videoId, lang: 'en' }).catch((e: unknown) => {
                    console.warn(`⚠️ getSubtitles failed for ${videoId}:`, e);
                    return null;
                  });
                  if (subs && Array.isArray(subs) && subs.length > 0) {
                    transcriptText = subs.map((s) => s.text).join('\n');
                  }
                }

                // Derive chapters from description if available (lines like "0:00 Intro" or "1:02:30 Deep dive")
                const extractChaptersFromDescription = (description: string | undefined): string[] | undefined => {
                  if (!description) return undefined;
                  const lines = description.split(/\r?\n/);
                  const chapterRegex = /^\s*((?:\d+:)?\d{1,2}:\d{2})\s*[\-|–|—]?\s*(.+)$/i;
                  const chapters: string[] = [];
                  for (const line of lines) {
                    const match = line.match(chapterRegex);
                    if (match) {
                      const time = match[1];
                      const title = match[2].trim();
                      if (time && title) {
                        chapters.push(`${time} - ${title}`);
                      }
                    }
                  }
                  return chapters.length > 0 ? chapters : undefined;
                };

                // Fallback: generate chapters from subtitles when description has no chapters
                const generateChaptersFromSubtitles = (
                  subs: SubtitleFragment[] | undefined,
                  targetCount: number = 30,
                ): string[] | undefined => {
                  if (!subs || subs.length === 0) return undefined;

                  const parseSeconds = (s: string) => {
                    const n = Number(s);
                    return Number.isFinite(n) ? n : 0;
                  };

                  const last = subs[subs.length - 1];
                  const totalDurationSec = Math.max(0, parseSeconds(last.start) + parseSeconds(last.dur));
                  if (totalDurationSec <= 1) return undefined;

                  const interval = Math.max(10, Math.floor(totalDurationSec / targetCount));

                  const formatTime = (secondsTotal: number) => {
                    const seconds = Math.max(1, Math.floor(secondsTotal)); // avoid 0:00 which UI filters out
                    const h = Math.floor(seconds / 3600);
                    const m = Math.floor((seconds % 3600) / 60);
                    const s = seconds % 60;
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
                  };

                  const chapters: string[] = [];
                  const usedTimes = new Set<number>();
                  for (let t = interval; t < totalDurationSec; t += interval) {
                    // find first subtitle starting at or after t
                    const idx = subs.findIndex((sf) => parseSeconds(sf.start) >= t);
                    const chosen = idx >= 0 ? subs[idx] : subs[subs.length - 1];
                    const text = chosen.text?.replace(/\s+/g, ' ').trim();
                    if (!text) continue;
                    const key = Math.floor(parseSeconds(chosen.start));
                    if (usedTimes.has(key)) continue;
                    usedTimes.add(key);
                    chapters.push(`${formatTime(key)} - ${text}`);
                    if (chapters.length >= targetCount) break;
                  }

                  return chapters.length > 0 ? chapters : undefined;
                };

                const timestampsFromDescription = extractChaptersFromDescription(details?.description);
                let timestamps: string[] | undefined = timestampsFromDescription;
                if (!timestamps) {
                  const subtitleSource: SubtitleFragment[] | undefined = details?.subtitles as
                    | SubtitleFragment[]
                    | undefined;
                  if (subtitleSource && subtitleSource.length > 0) {
                    timestamps = generateChaptersFromSubtitles(subtitleSource);
                  } else {
                    const subs = await getSubtitles({ videoID: videoId, lang: 'en' }).catch(() => null);
                    timestamps = generateChaptersFromSubtitles(subs ?? undefined);
                  }
                }

                const processedVideo: VideoResult = {
                  ...baseResult,
                  details: {
                    title: details?.title,
                    thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    provider_name: 'YouTube',
                    provider_url: 'https://www.youtube.com',
                  },
                  captions: transcriptText,
                  timestamps,
                };

                console.log(`✅ Successfully processed video ${videoId}:`, {
                  hasDetails: !!processedVideo.details,
                  hasCaptions: !!processedVideo.captions,
                  hasTimestamps: !!processedVideo.timestamps,
                  timestampCount: Array.isArray(processedVideo.timestamps) ? processedVideo.timestamps.length : 0,
                  captionsLength: processedVideo.captions ? processedVideo.captions.length : 0,
                });
                return processedVideo;
              } catch (error) {
                console.warn(`⚠️  Error processing video ${videoId}:`, error);
                return baseResult;
              }
            }),
          );

          // Process batch results - even failed promises return a result
          const validBatchResults = batchResults
            .filter((result) => result.status === 'fulfilled' && result.value !== null)
            .map((result) => (result as PromiseFulfilledResult<VideoResult>).value);

          const failedBatchResults = batchResults.filter((result) => result.status === 'rejected');

          console.log(`📊 [BATCH ${batchIndex + 1}] Results breakdown:`);
          console.log(`  ✅ Successful: ${validBatchResults.length}/${batch.length}`);
          console.log(`  ❌ Failed: ${failedBatchResults.length}/${batch.length}`);

          if (failedBatchResults.length > 0) {
            console.log(
              `  🚨 Failed reasons:`,
              failedBatchResults.map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown'),
            );
          }

          processedResults.push(...validBatchResults);
          console.log(`📈 [BATCH ${batchIndex + 1}] Total processed so far: ${processedResults.length} videos`);
          console.log(
            `🆔 [BATCH ${batchIndex + 1}] Added video IDs:`,
            validBatchResults.map((v) => v.videoId),
          );

          // Small delay between batches to be respectful to the API
          if (batchIndex < batches.length - 1) {
            console.log(`⏳ [BATCH ${batchIndex + 1}] Waiting 100ms before next batch...`);
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (batchError) {
          console.error(`💥 [BATCH ${batchIndex + 1}] CRITICAL BATCH FAILURE:`, batchError);
          if (batchError instanceof Error) {
            console.error(`💥 [BATCH ${batchIndex + 1}] Stack trace:`, batchError.stack);
          }
          console.log(`🔄 [BATCH ${batchIndex + 1}] Continuing to next batch despite failure...`);
          // Continue with next batch even if this one fails
          continue;
        }

        console.log(`✅ [BATCH ${batchIndex + 1}] Batch completed successfully`);
      }

      console.log(`🎥 Resolved ${videoResults.length} video candidates for mode="${mode}"`);

      // Process all videos in parallel
      const taskMap = await allSettled(
        Object.fromEntries(
          videoResults.map((video) => {
            // Cast to access optional properties from SupadataYouTubeVideo
            const v = video as SupadataYouTubeVideo;
            return [
              `v:${video.id}`,
              async () => {
                const videoId = video.id;
                if (!videoId) {
                  console.warn('⚠️ Video missing ID from Supadata result, skipping');
                  return null;
                }

                const videoUrl = `${YOUTUBE_BASE_URL}${videoId}`;

                // Check if we have enough data from search results to skip metadata
                const hasBasicData = v.title && v.thumbnail;

                try {
                  // Only fetch transcript - metadata is often redundant with search data
                  const transcripts = await buildTranscriptArtifacts(supadata, video.url ?? videoUrl, v.description);

                  // Only fetch metadata if we don't have basic data from search
                  const metadata = hasBasicData ? null : await fetchMetadataWithRetry(supadata, video.url ?? videoUrl, videoId);

                  const metadataAuthor = metadata?.author;
                  const metadataStats = metadata?.stats;
                  const metadataMedia = metadata?.media as { duration?: number; thumbnailUrl?: string } | undefined;

                  const stats: VideoStats | undefined =
                    metadataStats != null || v.viewCount != null
                      ? {
                        views: resolveNumber(metadataStats?.views ?? v.viewCount),
                        likes: resolveNumber(metadataStats?.likes),
                        comments: resolveNumber(metadataStats?.comments),
                        shares: resolveNumber(metadataStats?.shares),
                      }
                      : undefined;

                  const processedVideo: VideoResult = {
                    videoId,
                    url: video.url ?? videoUrl,
                    details: {
                      title: v.title ?? metadata?.title ?? undefined,
                      author_name: v.channel?.name ?? metadataAuthor?.displayName,
                      author_url: v.channel?.id
                        ? `https://www.youtube.com/channel/${v.channel.id}`
                        : v.channel?.url ?? (metadataAuthor?.username ? `https://www.youtube.com/@${metadataAuthor.username}` : undefined),
                      thumbnail_url: v.thumbnail ?? metadataMedia?.thumbnailUrl ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                      provider_name: 'YouTube',
                      provider_url: 'https://www.youtube.com',
                      author_avatar_url: v.channel?.thumbnail ?? metadataAuthor?.avatarUrl,
                    },
                    captions: transcripts.transcriptText,
                    transcriptChunks: transcripts.transcriptChunks,
                    timestamps: transcripts.timestamps,
                    summary: v.description ?? metadata?.description ?? undefined,
                    publishedDate: v.uploadDate ?? metadata?.createdAt,
                    durationSeconds: v.duration ?? metadataMedia?.duration,
                    stats,
                    tags: v.tags ?? metadata?.tags,
                  };

                  if (processedVideo.stats?.views != null) {
                    processedVideo.views = processedVideo.stats.views;
                  }
                  if (processedVideo.stats?.likes != null) {
                    processedVideo.likes = processedVideo.stats.likes;
                  }

                  return processedVideo;
                } catch (error) {
                  console.warn(`⚠️ Error processing video ${videoId}:`, error);
                  // Return basic result with available data
                  return {
                    videoId,
                    url: video.url ?? videoUrl,
                    details: {
                      title: v.title,
                      author_name: v.channel?.name,
                      thumbnail_url: v.thumbnail ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                      provider_name: 'YouTube',
                      provider_url: 'https://www.youtube.com',
                    },
                    publishedDate: v.uploadDate,
                    durationSeconds: v.duration,
                    stats: v.viewCount ? { views: v.viewCount } : undefined,
                  } as VideoResult;
                }
              },
            ];
          }),
        ),
        getBetterAllOptions(),
      );

      const processedResults = Object.values(taskMap)
        .filter((result) => result.status === 'fulfilled' && result.value !== null)
        .map((result) => (result as PromiseFulfilledResult<VideoResult>).value)
        // Sort by date (newest first) - important for channel/playlist mode
        .sort((a, b) => {
          if (!a.publishedDate && !b.publishedDate) return 0;
          if (!a.publishedDate) return 1;
          if (!b.publishedDate) return -1;
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        });

      console.log(`🏁 Supadata processing completed with ${processedResults.length} enriched videos`);

      return {
        results: processedResults,
      };
    } catch (error) {
      console.error('YouTube search error:', error);
      throw error;
    }
  },
});
