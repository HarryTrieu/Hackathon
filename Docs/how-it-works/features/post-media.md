# Post media and link previews

## Purpose
Give posts visual weight (images, link cards, coloured avatars) without breaking
the offline demo or leaking keys to the browser.

## User workflow
1. Scroll the feed: 5 seeded posts carry an image, 3 carry a link preview card
2. A card whose link has no thumbnail still shows domain, title and description
3. In the composer, paste a link and wait about a second for the preview to appear
4. Click "Image", pick a file: a spinner shows, then a thumbnail with a remove button
5. With no Cloudinary keys set, the thumbnail carries a "Mock mode" badge, which is the honest state, not a silent fake success

## Files and responsibilities
- `app/api/link-preview/route.js` validates and unfurls a URL, always returns a usable card
- `app/api/upload/route.js` validates the file and signs the Cloudinary request server-side
- `components/link-preview.jsx` renders the card and drops the thumbnail if the image 404s
- `components/composer.jsx` owns upload state, debounced unfurl, and error text
- `components/user-avatar.jsx` derives a muted tint from the handle so avatars vary

## Data flow and dependencies
Browser sends `FormData` to `/api/upload`; the route reads `CLOUDINARY_*` from the
server environment only and returns `{ url, mocked }`. The composer holds that URL
in local state; persisting it against a post arrives with `POST /api/posts`.
Preview requests are plain `GET` with a query parameter, no auth, no keys.

## How to test
1. `curl -F "file=@public/demo/pong.svg;type=image/svg+xml" localhost:3000/api/upload` returns a mocked URL
2. `curl "localhost:3000/api/link-preview?url=http://localhost:3000/"` returns 400, the SSRF guard
3. `curl "localhost:3000/api/link-preview?url=https://github.com"` returns real OpenGraph data

## Out of scope
- Attaching the uploaded URL to a stored post (build step 2)
- Multiple images, video, cropping, alt-text editing
