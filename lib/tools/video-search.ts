import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import { serverEnv } from '@/env/server';

const videoPlatforms = ['youtube', 'x', 'tiktok', 'instagram', 'vimeo', 'dailymotion', 'open-web'] as const;

type VideoPlatform = (typeof videoPlatforms)[number];
type TimeRange = 'day' | 'week' | 'month' | 'year' | 'anytime';

type VideoSearchResult = {
  url: string;
  title: string;
  content: string;
  published_date?: string;
  author?: string;
};

type VideoSearchQueryResult = {
  query: string;
  platform: VideoPlatform;
  results: VideoSearchResult[];
  images: Array<{ url: string; description: string }>;
};

const platformDomains: Record<VideoPlatform, string[]> = {
  youtube: ['youtube.com', 'youtu.be', 'm.youtube.com'],
  x: ['x.com', 'twitter.com'],
  tiktok: ['tiktok.com'],
  instagram: ['instagram.com'],
  vimeo: ['vimeo.com'],
  dailymotion: ['dailymotion.com'],
  'open-web': ['peertube.tv', 'odysee.com', 'rumble.com', 'twitch.tv', 'facebook.com'],
};

const platformQueryHints: Record<VideoPlatform, string> = {
  youtube: 'YouTube video',
  x: 'X Twitter video post clip',
  tiktok: 'TikTok video',
  instagram: 'Instagram Reel video',
  vimeo: 'Vimeo video',
  dailymotion: 'Dailymotion video',
  'open-web': 'video clip recording',
};

const isVideoUrlForPlatform = (url: string, platform: VideoPlatform): boolean => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const pathname = parsedUrl.pathname;

    switch (platform) {
      case 'youtube':
        return (
          hostname === 'youtu.be' ||
          pathname.startsWith('/watch') ||
          pathname.startsWith('/shorts/') ||
          pathname.startsWith('/embed/')
        );
      case 'x':
        return /\/status\/\d+/.test(pathname);
      case 'tiktok':
        return /\/video\/\d+/.test(pathname) || pathname.startsWith('/@');
      case 'instagram':
        return pathname.startsWith('/reel/') || pathname.startsWith('/tv/');
      case 'vimeo':
        return /^\/(?:channels\/[^/]+\/)?\d+/.test(pathname) || pathname.startsWith('/video/');
      case 'dailymotion':
        return pathname.startsWith('/video/');
      case 'open-web':
        return /\.(mp4|mov|webm|m3u8)(?:$|\?)/i.test(url) || platformDomains['open-web'].includes(hostname);
    }
  } catch {
    return false;
  }
};

const cleanTitle = (title: string | null | undefined): string => {
  return (title || '').replace(/\s+/g, ' ').trim();
};

const getDateRange = (timeRange: TimeRange): { startDate?: string; endDate?: string } => {
  if (timeRange === 'anytime') return {};

  const now = new Date();
  const ranges: Record<Exclude<TimeRange, 'anytime'>, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };

  const start = new Date(now.getTime() - ranges[timeRange] * 24 * 60 * 60 * 1000);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
};

export const videoSearchTool = tool({
  description:
    'Search only video results across YouTube, X/Twitter posts, TikTok, Instagram Reels, Vimeo, Dailymotion, and open web video hosts. Use this when the user wants videos, clips, reels, TikToks, or video sources rather than general webpages.',
  parameters: z.object({
    query: z.string().min(1).max(200).describe('The topic or subject to find videos about.'),
    platforms: z
      .array(z.enum(videoPlatforms))
      .min(1)
      .max(videoPlatforms.length)
      .optional()
      .describe('Optional platforms to search. Defaults to every supported video platform.'),
    timeRange: z
      .enum(['day', 'week', 'month', 'year', 'anytime'])
      .optional()
      .describe('Optional publication time range. Defaults to anytime.'),
    maxResultsPerPlatform: z
      .number()
      .min(3)
      .max(10)
      .optional()
      .describe('Maximum video results per platform. Defaults to 5.'),
  }),
  // @ts-expect-error - AI SDK v6 type inference issue
  execute: async ({
    query,
    platforms,
    timeRange = 'anytime',
    maxResultsPerPlatform = 5,
  }: {
    query: string;
    platforms?: VideoPlatform[];
    timeRange?: TimeRange;
    maxResultsPerPlatform?: number;
  }) => {
    const exa = new Exa(serverEnv.EXA_API_KEY);
    const selectedPlatforms = platforms?.length ? platforms : [...videoPlatforms];
    const { startDate, endDate } = getDateRange(timeRange);

    const searches = await Promise.all(
      selectedPlatforms.map(async (platform): Promise<VideoSearchQueryResult> => {
        const platformQuery = `${query} ${platformQueryHints[platform]}`;

        try {
          const searchResult = await exa.searchAndContents(platformQuery, {
            type: 'auto',
            numResults: Math.max(maxResultsPerPlatform * 2, 10),
            includeDomains: platformDomains[platform],
            startPublishedDate: startDate,
            endPublishedDate: endDate,
            text: true,
          });

          const seenUrls = new Set<string>();
          const results = searchResult.results
            .filter((result) => isVideoUrlForPlatform(result.url, platform))
            .filter((result) => {
              if (seenUrls.has(result.url)) return false;
              seenUrls.add(result.url);
              return true;
            })
            .slice(0, maxResultsPerPlatform)
            .map((result): VideoSearchResult => ({
              url: result.url,
              title: cleanTitle(result.title) || result.url,
              content: (result.text || '').slice(0, 1000),
              published_date: result.publishedDate || undefined,
              author: result.author || undefined,
            }));

          const images = searchResult.results
            .filter((result) => result.image && isVideoUrlForPlatform(result.url, platform))
            .slice(0, 3)
            .map((result) => ({
              url: result.image as string,
              description: cleanTitle(result.title) || platformQuery,
            }));

          return {
            query: platformQuery,
            platform,
            results,
            images,
          };
        } catch (error) {
          console.error(`Video search error for ${platform}:`, error);
          return {
            query: platformQuery,
            platform,
            results: [],
            images: [],
          };
        }
      }),
    );

    return {
      searches,
      searchedPlatforms: selectedPlatforms,
      timeRange,
    };
  },
});
