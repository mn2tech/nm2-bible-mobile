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

// Lightweight HTML entity decoder
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
	s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
	s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
	Object.keys(map).forEach((k) => { s = s.split(k).join(map[k]); });
	return s;
}

// Try to discover a feed URL from a homepage: look for <link rel="alternate" type="application/rss+xml"> or try common feed paths
async function discoverFeedUrl(homepage: string): Promise<string | null> {
	try {
		const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; NewsFetcher/1.0)', Accept: 'text/html,application/xhtml+xml' } as any;
		const res = await fetch(homepage, { headers });
		if (!res.ok) return null;
		const html = await res.text();
		const linkRegex = /<link[^>]*rel=["']alternate["'][^>]*>/gi;
		let match: RegExpExecArray | null;
		while ((match = linkRegex.exec(html)) !== null) {
			const tag = match[0];
			const typeMatch = /type=["']([^"']+)["']/i.exec(tag);
			const hrefMatch = /href=["']([^"']+)["']/i.exec(tag);
			if (hrefMatch) {
				const type = typeMatch ? typeMatch[1].toLowerCase() : '';
				if (!type || type.includes('rss') || type.includes('atom') || type.includes('xml')) {
					try {
						const candidate = new URL(hrefMatch[1], homepage).toString();
						return candidate;
					} catch (e) {
						return hrefMatch[1];
					}
				}
			}
		}

		const tryPaths = ['/feed/', '/rss.xml', '/rss', '/?feed=rss2', '/feeds/posts/default'];
		for (const p of tryPaths) {
			try {
				const candidate = new URL(p, homepage).toString();
				const r = await fetch(candidate, { headers });
				if (!r.ok) continue;
				const txt = await r.text();
				if (/\<rss|\<feed|\<\?xml/i.test(txt)) return candidate;
			} catch (e) {
				continue;
			}
		}

		return null;
	} catch (e) {
		return null;
	}
}

export default {
	async getBibleNews(feedUrl?: string): Promise<NewsItem[]> {
		if (!feedUrl) {
			// no feed provided — return empty list (caller decides fallback behavior)
			await new Promise((r) => setTimeout(r, 150));
			return mocked;
		}

		try {
			// lazy require fast-xml-parser
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { XMLParser } = require('fast-xml-parser');

			const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; NewsFetcher/1.0)', Accept: 'application/rss+xml, application/atom+xml, text/xml, */*' } as any;
			let res = await fetch(feedUrl, { headers });
			let xml = '';
			if (res.ok) xml = await res.text();

			// If the response doesn't look like XML, try discovery (homepage → feed)
			if (!/\<rss|\<feed|\<\?xml/i.test(xml)) {
				const discovered = await discoverFeedUrl(feedUrl);
				if (discovered) {
					try {
						const r2 = await fetch(discovered, { headers });
						if (r2.ok) xml = await r2.text();
						feedUrl = discovered;
					} catch (e) {
						// ignore discovery failure
					}
				}
			}

			if (!xml || !/\<rss|\<feed|\<\?xml/i.test(xml)) {
				// couldn't find a feed
				return mocked;
			}

			const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
			const json = parser.parse(xml);
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

				let image: string | undefined;
				if (it.enclosure && it.enclosure['@_url']) {
					const url = it.enclosure['@_url'];
					const type = it.enclosure['@_type'] || '';
					if (type.startsWith('image')) image = url;
				}
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
			await new Promise((r) => setTimeout(r, 200));
			return mocked;
		}
	},

	// API fallback using groqService (kept as-is)
	async getBibleNewsFromAPI(): Promise<NewsItem[]> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const groq = require('./groqService').default;
			const prompt = `Return up to 8 recent Christian/Biblical news items as a JSON array. Each item should be an object with keys: title, summary, url, source, publishedAt, image, video. Respond with valid JSON only.`;
			const res = await groq.queryBible(prompt);
			let text = res.answer || '';
			text = text.replace(/^Q:.*\n\n/, '').trim();
			const arrayMatch = text.match(/\[[\s\S]*\]/);
			let parsedJson: any = null;
			if (arrayMatch) {
				parsedJson = JSON.parse(arrayMatch[0]);
			} else {
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
			await new Promise((r) => setTimeout(r, 200));
			return mocked;
		}
	},
};

