export const EXTREME_INTERNAL_TOOL_NAMES = [
  'webSearch',
  'xSearch',
  'redditSearch',
  'youtubeSearch',
  'codeRunner',
] as const;

export const EXTREME_SUPPLEMENTAL_SOURCE_GUIDANCE = `
For Reddit search:
- Use Reddit when you need practitioner feedback, user sentiment, troubleshooting threads, migration reports, setup pain points, or community comparisons.
- Prefer Reddit for real-world experience, adoption friction, and "what broke / what worked" evidence.

For YouTube search:
- Use YouTube when you need demos, walkthroughs, launch videos, conference talks, tutorials, setup guides, or product overviews.
- Prefer YouTube for implementation walkthroughs, visual product behavior, and hands-on usage examples.
`;
