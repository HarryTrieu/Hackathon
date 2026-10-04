"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Languages, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { LANGUAGES, languageName } from "@/lib/languages";
import { useLanguage } from "@/lib/use-language";

const googleUrl = (text, lang) =>
  `https://translate.google.com/?sl=auto&tl=${lang === "zh" ? "zh-CN" : lang}&text=${encodeURIComponent(text.slice(0, 4000))}&op=translate`;

// The translated post under the original, in the viewer's language (menu to
// change it). Google Translate is offered alongside, and instead when the AI
// can't translate right now.
export function PostTranslation({ post, onClose }) {
  const [lang, setLang] = useLanguage();
  const [result, setResult] = useState({ lang: null, text: null, error: null });
  // Already in the chosen language: ask for another one instead of
  // "translating" English into English.
  const same = (post.lang ?? "en") === lang;
  const current = result.lang === lang ? result : null;

  useEffect(() => {
    if (same) return;
    let cancelled = false;
    fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ post_id: post.id, lang }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setResult(res.ok ? { lang, text: data.text, error: null } : { lang, text: null, error: data.error ?? "Couldn't translate this." });
      })
      .catch(() => !cancelled && setResult({ lang, text: null, error: "Couldn't reach the server." }));
    return () => {
      cancelled = true;
    };
  }, [post.id, lang, same]);

  return (
    <div className="mt-2.5 rounded-xl border bg-muted/40 p-3 text-sm">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Languages className="size-3.5 text-primary" />
        <span className="font-semibold">Translated by AI into</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="Translate into"
          className="h-6 rounded-md border bg-background px-1 text-xs"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex items-center gap-0.5 rounded-full px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
          Show original only
        </button>
      </div>
      {same && (
        <p className="text-muted-foreground">
          This post is already in {languageName(lang)}. Pick another language above.
        </p>
      )}
      {!same && !current && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Spinner className="size-3.5" /> Translating into {languageName(lang)}...
        </p>
      )}
      {!same && current?.text && (
        <p className="whitespace-pre-wrap leading-relaxed" lang={lang}>
          {current.text}
        </p>
      )}
      {!same && current?.error && <p className="text-muted-foreground">{current.error}</p>}
      <a
        href={googleUrl(post.text, lang)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Open in Google Translate
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
