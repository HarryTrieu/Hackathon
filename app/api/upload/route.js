import { createHash } from "node:crypto";

// Cloudinary keys are server-only. When they are missing the route still
// returns 200 with a stand-in image so the demo works offline.
const MOCK_URL = "/demo/upload-placeholder.svg";
const MAX_BYTES = 4 * 1024 * 1024; // Vercel hobby request cap is ~4.5MB

function signature(params, apiSecret) {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

export async function POST(request) {
  let file;
  try {
    const form = await request.formData();
    file = form.get("file");
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return Response.json({ error: "No file was attached." }, { status: 400 });
  }
  if (!file.type?.startsWith("image/")) {
    return Response.json({ error: "Only image files are allowed." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Image is larger than 4MB. Please pick a smaller one." },
      { status: 413 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ url: MOCK_URL, mocked: true });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "sodu";
  const upload = new FormData();
  upload.append("file", file);
  upload.append("api_key", apiKey);
  upload.append("timestamp", String(timestamp));
  upload.append("folder", folder);
  upload.append("signature", signature({ folder, timestamp }, apiSecret));

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: upload, signal: AbortSignal.timeout(15000) }
    );
    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      // Never break the demo on an upstream failure.
      return Response.json({ url: MOCK_URL, mocked: true, upstreamFailed: true });
    }
    return Response.json({ url: data.secure_url, mocked: false });
  } catch {
    return Response.json({ url: MOCK_URL, mocked: true, upstreamFailed: true });
  }
}
