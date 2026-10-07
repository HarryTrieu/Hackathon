"use client";

import { useEffect, useRef } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shared by Messages (/messages/<id>) and session rooms (/sessions/<id>).

export function timeOf(iso) {
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}

// Messages and milestone pills ({ event: true, at, text, tone }) in time
// order. Your own messages get a delete button unless the thread is closed.
export function ChatItems({ items, meId, onDelete }) {
  return [...items]
    .sort((a, b) => Date.parse(a.created_at ?? a.at) - Date.parse(b.created_at ?? b.at))
    .map((m) => {
      if (m.event) {
        return (
          <p key={m.id} className="flex justify-center py-1">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-center text-[11px] font-medium",
                m.tone === "start" && "bg-primary/10 text-primary",
                m.tone === "end" && "bg-primary text-primary-foreground",
                !m.tone && "bg-muted text-muted-foreground"
              )}
            >
              {m.text} · {timeOf(m.at)}
            </span>
          </p>
        );
      }
      const mine = m.sender_id === meId;
      return (
        <div key={m.id} className={cn("group flex items-center gap-1", mine ? "justify-end" : "justify-start")}>
          {mine && !m.deleted && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(m)}
              aria-label="Delete message"
              title="Delete message"
              className="rounded-full p-1.5 text-muted-foreground opacity-60 transition hover:bg-muted hover:text-destructive hover:opacity-100 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <div
            className={cn(
              "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
              m.deleted
                ? "border border-dashed bg-transparent text-muted-foreground"
                : mine
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
            )}
          >
            {m.label && <p className={cn("mb-0.5 text-[10px] font-semibold uppercase tracking-wide", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.label}</p>}
            {m.deleted ? (
              <p className="italic">{mine ? "You deleted this message" : "This message was deleted"}</p>
            ) : (
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
            )}
            <p className={cn("mt-0.5 text-[10px]", mine && !m.deleted ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {timeOf(m.created_at)}
            </p>
          </div>
        </div>
      );
    });
}

// Enter sends, Shift+Enter adds a line.
// Phones: the keyboard covers the bottom of the page (iPhones) or shrinks it
// (Android), so when the message box is tapped, and again as the keyboard
// finishes opening, scroll to the newest message so it sits right above the
// box. Closing the keyboard leaves the chat where it is.
function showLatest() {
  const go = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  go();
  setTimeout(go, 150);
  setTimeout(go, 400);
}

export function Composer({ value, onChange, onSend, sending, placeholder }) {
  const box = useRef(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    // The keyboard opening or closing resizes the visual viewport.
    const onResize = () => {
      if (document.activeElement === box.current) showLatest();
    };
    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, []);

  return (
    <form onSubmit={onSend} className="flex items-end gap-2">
      <textarea
        ref={box}
        onFocus={showLatest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) onSend(e);
        }}
        rows={value.includes("\n") || value.length > 80 ? 3 : 1}
        maxLength={2000}
        enterKeyHint="send"
        placeholder={placeholder}
        className="min-h-10 flex-1 resize-none rounded-2xl border bg-transparent px-4 py-2 text-base outline-none focus:border-primary/50 md:text-sm"
      />
      <Button type="submit" size="icon-lg" className="rounded-full" disabled={!value.trim() || sending} aria-label="Send">
        <Send />
      </Button>
    </form>
  );
}
