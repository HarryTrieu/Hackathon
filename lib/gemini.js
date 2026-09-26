// Server-only Gemini REST helper shared by every AI route.
// Returns the model's text, or null when there is no key or every model
// failed, so callers can fall back to their deterministic mock.

// Alias that tracks the newest flash model, so it does not expire.
// Override with GEMINI_MODEL if needed; lite model is the 503 fallback.
const DEFAULT_MODEL = "gemini-flash-latest";
const FALLBACK_MODEL = "gemini-flash-lite-latest";

export function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// contents: Gemini "contents" array, or a plain string prompt.
// system: optional system instruction. json: ask for application/json.
export async function callGemini({ contents, system, json = false, temperature = 0.4 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const body = {
    contents:
      typeof contents === "string"
        ? [{ role: "user", parts: [{ text: contents }] }]
        : contents,
    generationConfig: {
      temperature,
      ...(json && { responseMimeType: "application/json" }),
    },
    ...(system && { systemInstruction: { parts: [{ text: system }] } }),
  };

  // Free-tier models 503 under load; try the main model, then the lite one.
  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL];
  for (const m of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (!res.ok) {
        console.warn(`Gemini ${m} failed: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      console.warn(`Gemini ${m} failed: ${err?.message ?? err}`);
    }
  }
  return null;
}

// Parse a JSON reply; null when the model returned something unparseable.
export function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return null;
  }
}
