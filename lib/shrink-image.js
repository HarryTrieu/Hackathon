"use client";

// Phone photos are often 4 to 10 MB, over Vercel's ~4.5 MB request limit, so
// big images are resized in the browser before uploading (longest side
// MAX_SIDE, JPEG). GIFs, PDFs and already-small files are left alone.
const MAX_SIDE = 1600;
const SMALL_ENOUGH = 1.5 * 1024 * 1024;

export async function shrinkImage(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size <= SMALL_ENOUGH) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // HEIC or anything the browser can't decode: send it as it is.
    return file;
  }
}

// The upload route answers in JSON, but a request over the platform's size
// limit comes back as an error page; turn that into a readable message.
export async function uploadFile(file) {
  const body = new FormData();
  body.append("file", await shrinkImage(file));
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json().catch(() => null);
  if (res.ok && data?.url) return { ok: true, url: data.url, mocked: Boolean(data.mocked) };
  if (res.status === 413) return { ok: false, error: "That file is too large. Keep it under 4 MB." };
  return { ok: false, error: data?.error ?? "Upload failed. Please try again." };
}
