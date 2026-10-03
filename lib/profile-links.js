// Links people add to their profile. https only, at most MAX_LINKS, and no
// personal-social or messaging sites: contact and payment stay on Sodu.
export const MAX_LINKS = 6;

const BLOCKED = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|snapchat\.com|whatsapp\.com|wa\.me|t\.me|telegram\.(me|org)|discord\.(gg|com)|onlyfans\.com)$/i;

const LABELS = [
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)gitlab\.com$/, "GitLab"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)behance\.net$/, "Behance"],
  [/(^|\.)dribbble\.com$/, "Dribbble"],
  [/(^|\.)medium\.com$/, "Medium"],
  [/(^|\.)kaggle\.com$/, "Kaggle"],
  [/(^|\.)figma\.com$/, "Figma"],
];

// { ok, link: { url, label } } or { ok: false, error }.
export function checkLink(raw) {
  let url;
  try {
    url = new URL(raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return { ok: false, error: "That doesn't look like a link." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Links need to start with https." };
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!host.includes(".")) return { ok: false, error: "That doesn't look like a link." };
  if (BLOCKED.test(host)) {
    return { ok: false, error: "Personal social and messaging links aren't allowed. Keep contact on Sodu." };
  }
  const label = LABELS.find(([pattern]) => pattern.test(host))?.[1] ?? host;
  return { ok: true, link: { url: url.toString(), label } };
}

// "Resources used" on a profile's Path tab: study links with a title and an
// optional note. Same link rules as profile links.
export const MAX_RESOURCES = 8;

export function checkResource({ url, label, note }) {
  const link = checkLink(url ?? "");
  if (!link.ok) return link;
  const title = (label ?? "").trim() || link.link.label;
  const isVideo = /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(link.link.url).hostname.replace(/^www\./, ""));
  return {
    ok: true,
    resource: {
      url: link.link.url,
      label: title.slice(0, 100),
      type: isVideo ? "Video" : "Website",
      note: (note ?? "").trim().slice(0, 140) || null,
    },
  };
}
