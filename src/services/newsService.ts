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

const mocked: NewsItem[] = [
  {
    id: '1',
    title: 'Community Garden Launched by Local Church',
    summary: 'A local congregation started a community garden to provide food for families and teach stewardship.',
    source: 'Local',
    publishedAt: '2025-08-12',
    image: 'https://images.unsplash.com/photo-1522174242588-6c3b1e1d2b2b?auto=format&fit=crop&w=800&q=60',
    url: 'https://example.com/community-garden',
  },
  {
    id: '2',
    title: 'Translation Project Reaches New Testament Milestone',
    summary: 'Volunteers completed a New Testament draft for an underserved language community.',
    source: 'Mission News',
    publishedAt: '2025-08-10',
    image: 'https://images.unsplash.com/photo-1529257414771-1968b1b38e1c?auto=format&fit=crop&w=800&q=60',
    url: 'https://example.com/translation-project',
  },
  {
    id: '3',
    title: 'Conference Explores Parables in Modern Preaching',
    summary: 'Pastors and teachers gathered to discuss how parables inform preaching in the 21st century.',
    source: 'FaithDaily',
    publishedAt: '2025-08-08',
    image: 'https://images.unsplash.com/photo-1508873699372-7ae1be6b7f4b?auto=format&fit=crop&w=800&q=60',
    url: 'https://example.com/parables-conference',
  },
];

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
        const guid = it.guid?._text || it.guid || it.id || (it.link && (it.link['@_href'] || it.link)) || `${Date.now()}-${idx}`;
        const title = it.title?._text || it.title || '';
        const link = it.link?._text || it.link || (it.link && it.link['@_href']) || null;
        const description = it.description?._text || it.summary?._text || it.summary || it.content || '';
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

        return {
          id: String(guid),
          title: String(title),
          summary: String(description),
          source: siteTitle,
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

      const mapped: NewsItem[] = parsedJson.map((it: any, idx: number) => ({
        id: String(it.id || it.url || `${Date.now()}-${idx}`),
        title: String(it.title || ''),
        summary: String(it.summary || it.description || ''),
        source: it.source || undefined,
        publishedAt: it.publishedAt || it.pubDate || undefined,
        image: it.image || undefined,
        video: it.video || undefined,
        url: it.url || undefined,
      }));

      return mapped;
    } catch (e) {
      // fallback
      await new Promise((r) => setTimeout(r, 200));
      return mocked;
    }
  },
};
