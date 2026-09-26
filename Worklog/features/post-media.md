# Post media, link previews, upload (Feature 1.5)

## Purpose
Make the feed look like a real social feed: attached images, link preview cards
with thumbnails, coloured avatars. Upload goes to Cloudinary, with a mock image
when keys are absent so the demo survives offline.

## Files
| Path | Lines (approx) | What |
|------|----------------|------|
| `app/api/upload/route.js` | 1–80 | Cloudinary signed upload, size/type guards, mock fallback |
| `app/api/link-preview/route.js` | 1–105 | OpenGraph fetch, SSRF guard, timeout, domain-only fallback |
| `components/link-preview.jsx` | 1–50 | Preview card, hides thumbnail on image error |
| `components/user-avatar.jsx` | 1–45 | Deterministic tint from handle, shared `initials()` |
| `components/composer.jsx` | 1–170 | Image attach + upload states, debounced live unfurl |
| `components/post-card.jsx` | 1–210 | Image frame, preview card, calmer hover, trailing URL stripped |
| `public/demo/*.svg` | n/a | 7 offline demo assets (screenshots, thumbnails, mock upload) |

## What we implemented
- Hover: post rows fade over 300ms at ~1.5% tint; chips wait 150ms then take a 7% accent tint
- Removed the fake 350ms skeleton on persona switch; the fade plus changed reason lines carry the signal
- Upload guards: no file 400, non-image 400, empty 400, over 4MB 413, upstream failure 200 + `mocked: true`
- Link preview guards: missing/invalid URL 400, non-http protocol 400, localhost and private ranges 400
- Seed text is English only; `lang` and `summary_en` stay so live non-English posts still get a summary

## How to test
1. `npm run dev`, hover a card and its chips to check the timing
2. Paste `https://github.com` into the composer, wait ~1s for the unfurl
3. Attach any image with no Cloudinary keys set: expect the mock badge

## Depends on
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (all optional, server only)

## Out of scope
- Saving uploads against a post (needs `POST /api/posts`, build step 2)
- Multiple images per post, video, image cropping
