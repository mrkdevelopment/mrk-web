/**
 * /robots.txt, built with the site so the Sitemap line always matches the deployed URL.
 *
 * Policy: allow everyone, including AI search and AI assistants, because a small business wants to
 * be found and quoted. The AI crawlers get their own named groups so that choice is visible and easy
 * to change (to block training only, add `Disallow: /` to the "training" group).
 *
 * Gotcha: a crawler that matches a named group ignores the `*` group completely. So every group gets
 * the same DISALLOW lines; add any new Disallow to DISALLOW, never to one group by hand.
 *
 * To keep a page out of search, give it `noindex` (SeoHead) instead of a Disallow: a crawler can't
 * read the noindex tag of a page it is not allowed to fetch.
 */
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../data/site';

/** Paths no crawler needs. /api/ is the contact form endpoint. */
const DISALLOW = ['Disallow: /api/'];

const GROUPS: { comment: string; agents: string[] }[] = [
  {
    comment: 'AI search engines (pages cited in ChatGPT search, Claude, Perplexity)',
    agents: ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'],
  },
  {
    comment: 'Pages fetched because a person asked an AI assistant to look',
    agents: ['ChatGPT-User', 'Claude-User', 'Perplexity-User'],
  },
  {
    comment: 'AI training crawlers and AI-use opt-out tokens',
    agents: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'],
  },
  { comment: 'Everyone else, including Googlebot and Bingbot', agents: ['*'] },
];

export const GET: APIRoute = ({ site }) => {
  const lines = GROUPS.flatMap((group) => [
    `# ${group.comment}`,
    ...group.agents.map((agent) => `User-agent: ${agent}`),
    'Allow: /',
    ...DISALLOW,
    '',
  ]);
  lines.push(`Sitemap: ${absoluteUrl('/sitemap.xml', site?.href)}`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
