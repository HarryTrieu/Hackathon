"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePersona } from "@/lib/persona-context";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

export function Composer() {
  const { persona } = usePersona();
  const [text, setText] = useState("");
  const [notice, setNotice] = useState(false);

  return (
    <div className="border-b px-4 py-3">
      <div className="flex gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {initials(persona.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            id="composer-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setNotice(false);
            }}
            placeholder="Share what you learned..."
            className="min-h-16 resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {notice
                ? "Publishing arrives in the next build step (AI tags + TL;DR)."
                : "AI adds tags and a TL;DR when you post."}
            </p>
            <Button
              size="sm"
              className="rounded-full font-semibold"
              disabled={text.trim().length === 0}
              onClick={() => setNotice(true)}
            >
              <PenLine data-icon="inline-start" />
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
