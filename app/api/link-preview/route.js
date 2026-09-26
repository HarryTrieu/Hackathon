// Fetches OpenGraph tags for a pasted link. Any failure degrades to a
// domain-only card rather than an error, so a blocked site never breaks a post.

const TIMEOUT_MS = 3000;
const MAX_HTML_BYTES = 200_000;

const PRIVATE_HOST =
  /^(localhost$|127\.|0\.0\.0\.0|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i;

function metaTags(html) {
  const found = new Map();
  for (const tag of html.match(/<meta\s+[^>]*>/gi) ?? []) {
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (key && content && !found.has(key.toLowerCase())) {
      found.set(key.toLowerCase(), content);
    }
  }
  return found;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return Response.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let target;
  try {
    target = new URL(raw);
  } catch {
    return Response.json({ error: "That is not a valid URL." }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Response.json({ error: "Only http and https links are supported." }, { status: 400 });
  }
  if (PRIVATE_HOST.test(target.hostname)) {
    return Response.json({ error: "That host is not allowed." }, { status: 400 });
  }

  const fallback = {
    url: target.toString(),
    title: target.hostname.replace(/^www\./, ""),
    site: target.hostname.replace(/^www\./, ""),
    description: null,
    image: null,
    mocked: true,
  };

  try {
    const res = await fetch(target, {
      headers: {
        // Some sites return 403 to header-less requests.
        "user-agent": "Mozilla/5.0 (compatible; SoduLinkPreview/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("html")) {
      return Response.json(fallback);
    }

    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    const meta = metaTags(html);
    const title =
      meta.get("og:title") ??
      meta.get("twitter:title") ??
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    const image = meta.get("og:image") ?? meta.get("twitter:image");
    const description = meta.get("og:description") ?? meta.get("description");
    const site = meta.get("og:site_name");

    return Response.json({
      url: target.toString(),
      title: title ? decodeEntities(title) : fallback.title,
      site: site ? decodeEntities(site) : fallback.site,
      description: description ? decodeEntities(description) : null,
      image: image ? new URL(decodeEntities(image), target).toString() : null,
      mocked: false,
    });
  } catch {
    return Response.json(fallback);
  }
}
