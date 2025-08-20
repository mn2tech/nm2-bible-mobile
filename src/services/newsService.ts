// Simple news service with optional RSS parsing support
export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source?: string;
  publishedAt?: string;
  image?: string;
  url?: string;
};

const mocked: NewsItem[] = [];

// Helpers to normalize IDs coming from RSS/Atom feeds where fields may be objects
function extractText(node: any): string | null {
  if (!node) return null;
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (typeof node === 'object') {
    return node._text || node['#text'] || node['@_value'] || node['#cdata'] || node['text'] || null;
  }
  return null;
}

function makeStableId(feedHint: string | undefined, title: string | undefined, pubDate: string | undefined, idx: number) {
  const t = title ? String(title).trim() : '';
  const d = pubDate ? String(pubDate).trim() : '';
  if (t && d) return `${t}::${d}`.replace(/\s+/g, ' ');
  if (t) return `${t}::${idx}`.replace(/\s+/g, ' ');
  return `${feedHint || 'feed'}-${idx}`;
}

// Lightweight HTML entity decoder for common cases (keeps dependency-free)
function decodeHtml(input: string | null | undefined): string {
  if (!input) return '';
  let s = String(input);
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#039;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  s = s.replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (m) => map[m] || m);
  // numeric entities (decimal)
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  // numeric entities (hex)
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // also replace common named ones not covered by the first regex
  Object.keys(map).forEach((k) => { s = s.split(k).join(map[k]); });
  return s;
}

// Try to parse RSS feeds when a feedUrl is provided. Falls back to mocked items on error.
export default {
  async getBibleNews(feedUrl?: string): Promise<NewsItem[]> {
    if (!feedUrl) {
      // simulate network delay
      await new Promise((r) => setTimeout(r, 300));
      return mocked;
    }

    try {
      // lazy require fast-xml-parser to keep installs optional
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { XMLParser } = require('fast-xml-parser');

      const res = await fetch(feedUrl);
      if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
      const xml = await res.text();

      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
      const json = parser.parse(xml);

      // Support rss->channel->item or feed->entry (Atom)
      const channel = json.rss?.channel || json.feed;
      const items = json.rss?.channel?.item || json.feed?.entry || [];

      const siteTitle = channel?.title || null;

      const parsed: NewsItem[] = (Array.isArray(items) ? items : [items]).map((it: any, idx: number) => {
        const rawGuid = it.guid ?? it.id ?? it.link ?? null;
        const guidText = extractText(rawGuid) || extractText(it.id) || extractText(it.link) || null;
        const titleRaw = extractText(it.title) || it.title || '';
        const title = decodeHtml(titleRaw);
        const link = extractText(it.link) || (it.link && it.link['@_href']) || null;
        const descriptionRaw = extractText(it.description) || extractText(it.summary) || it.summary || it.content || '';
        const description = decodeHtml(descriptionRaw);
        const pubDate = it.pubDate || it.published || it.updated || null;

        // Try to extract enclosure/media image only
        let image: string | undefined;
        if (it.enclosure && it.enclosure['@_url']) {
          const url = it.enclosure['@_url'];
          const type = it.enclosure['@_type'] || '';
          if (type.startsWith('image')) image = url;
        }
        // media:content image
        if (!image && it['media:content'] && it['media:content']['@_url']) {
          const murl = it['media:content']['@_url'];
          const mtype = it['media:content']['@_type'] || '';
          if (mtype.startsWith('image')) image = murl;
        }

        const idCandidate = guidText || link || makeStableId(feedUrl || siteTitle || undefined, title || undefined, pubDate ? String(pubDate) : undefined, idx);

        return {
          id: String(idCandidate),
          title: String(title),
          summary: String(description),
          source: siteTitle ? decodeHtml(siteTitle) : siteTitle,
          publishedAt: pubDate ? String(pubDate) : undefined,
          image: image || undefined,
          url: link || undefined,
        } as NewsItem;
      });

      return parsed;
    } catch (e) {
      // on any error, return mocked items
      // console.warn('RSS parse failed, falling back to mocked news', e);
      await new Promise((r) => setTimeout(r, 200));
      return mocked;
    }
  },
  // Try to request curated biblical news from the Groq backend (local API)
  // This will call the groq query endpoint with a prompt requesting JSON.
  async getBibleNewsFromAPI(): Promise<NewsItem[]> {
    try {
      // lazy import to avoid circular load at module init
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const groq = require('./groqService').default;

      const prompt = `Return up to 8 recent Christian/Biblical news items as a JSON array. Each item should be an object with keys: title, summary, url, source, publishedAt, image, video. Respond with valid JSON only.`;
      const res = await groq.queryBible(prompt);
      let text = res.answer || '';
      // strip leading Q: if any
      text = text.replace(/^Q:.*\n\n/, '').trim();

      // try to extract JSON array from text
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      let parsedJson: any = null;
      if (arrayMatch) {
        parsedJson = JSON.parse(arrayMatch[0]);
      } else {
        // maybe it's plain JSON object list separated by newlines - try parse directly
        parsedJson = JSON.parse(text);
      }

      if (!Array.isArray(parsedJson)) return mocked;

      const mapped: NewsItem[] = parsedJson.map((it: any, idx: number) => {
        const title = String(it.title || '');
        const pubDate = it.publishedAt || it.pubDate || undefined;
        const idCandidate = extractText(it.id) || it.url || makeStableId(undefined, title, pubDate ? String(pubDate) : undefined, idx);
        return {
          id: String(idCandidate),
          title: title,
          summary: String(it.summary || it.description || ''),
          source: it.source || undefined,
          publishedAt: pubDate || undefined,
          image: it.image || undefined,
          video: it.video || undefined,
          url: it.url || undefined,
        };
      });

      return mapped;
    } catch (e) {
      // fallback
      await new Promise((r) => setTimeout(r, 200));
      return mocked;
    }
  },
};
