"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Bot, CheckCircle2, FileUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { unitDirectory } from "@/lib/communities";
import {
  MIN_GRADES,
  STYLE_QUESTIONS,
  VOICE_QUESTIONS,
  saveLocalApplication,
} from "@/lib/mentors";
import { usePersona } from "@/lib/persona-context";
import { cn } from "@/lib/utils";

const EMPTY_STYLE = { teaching: "", tone: "", pace: "", help: [], feedback: "", languages: [], format: "" };
const EMPTY_VOICE = { topics: "", explain: "", lost: "", about: "" };

function Section({ step, title, children }) {
  return (
    <section className="space-y-3 border-b px-4 py-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors duration-300",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40 hover:bg-primary/[0.04]"
      )}
    >
      {children}
    </button>
  );
}

function ApplyForm() {
  const { persona } = usePersona();
  const params = useSearchParams();
  const units = unitDirectory().filter((u) => u.name);

  const [unitCode, setUnitCode] = useState(params.get("unit")?.toUpperCase() ?? "");
  const [grade, setGrade] = useState("");
  const [email, setEmail] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [style, setStyle] = useState(EMPTY_STYLE);
  const [voice, setVoice] = useState(EMPTY_VOICE);
  const [rate, setRate] = useState(30);
  const [availability, setAvailability] = useState("Weeknights after 6, online");
  const [showExperience, setShowExperience] = useState(false);
  const [experience, setExperience] = useState([]);
  const [conduct, setConduct] = useState(false);

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const eligibleGrade = MIN_GRADES.includes(grade);
  const emailOk = persona.verified || /^[^\s@]+@deakin\.edu\.au$/i.test(email.trim());
  const styleDone = STYLE_QUESTIONS.every((q) => (q.multiple ? style[q.id].length > 0 : style[q.id]));
  const voiceDone = VOICE_QUESTIONS.every((q) => voice[q.id].trim().length >= 20);
  const draft = { profile_id: persona.id, unit_code: unitCode, grade, style, voice };
  const draftKey = JSON.stringify(draft);
  const previewFresh = preview?.key === draftKey;
  const canPreview = unitCode && eligibleGrade && styleDone && voiceDone;
  const canSubmit = canPreview && emailOk && conduct && previewFresh;

  function pick(q, option) {
    setStyle((prev) => {
      if (!q.multiple) return { ...prev, [q.id]: option };
      const list = prev[q.id];
      return { ...prev, [q.id]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option] };
    });
  }

  async function uploadTranscript(file) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setTranscript(data.url);
      else setError(data.error ?? "Upload failed.");
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function runPreview() {
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: draftKey,
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Preview failed.");
      else setPreview({ key: draftKey, ...data });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPreviewing(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mentors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...draft,
          email: persona.verified ? undefined : email.trim(),
          transcript_url: null,
          rate_per_hour: Number(rate),
          availability,
          show_experience: showExperience,
          experience: experience.filter((e) => e.company.trim() && e.role.trim()),
          code_of_conduct: conduct,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit the application.");
        return;
      }
      if (!data.persisted) saveLocalApplication(data.application);
      setDone(data);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <h1 className="text-xl font-bold">Application sent for review</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          A reviewer checks your grade{transcript ? " and transcript" : ""} for {unitCode}. Once approved, your AI
          mentor goes live and students can find you.
          {!done.persisted && " (Saved on this device only: the database table is not set up yet.)"}
        </p>
        <div className="flex gap-2">
          <Link href="/review" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
            Open review queue
          </Link>
          <Link href="/mentors" className={cn(buttonVariants(), "rounded-full")}>
            Back to mentors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Become a mentor</h1>
        <p className="text-sm text-muted-foreground">
          Applying as {persona.name}. Earn by mentoring a unit you scored Distinction or above in.
        </p>
        <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
          How we use your data: we store your teaching answers, rate and a yes/no email-verified flag.
          We never show your exact grade or store a transcript file.
        </p>
      </div>

      <Section step={1} title="Unit and verification">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Unit you want to mentor</span>
          <select
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
          >
            <option value="">Choose a unit</option>
            {units.map((u) => (
              <option key={u.code} value={u.code}>
                {u.code} · {u.name}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1.5 text-sm">
          <p className="font-medium">Your grade in this unit</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={eligibleGrade} onClick={() => setGrade(grade === "D" ? "" : "D")}>
              Distinction or above
            </Chip>
          </div>
          <p className="text-xs text-muted-foreground">
            Reviewers confirm you are Distinction or above. The public profile never shows HD vs D.
          </p>
          {grade && !eligibleGrade && (
            <p className="text-destructive">
              Mentors need a Distinction or High Distinction. You can still help for free in the community.
            </p>
          )}
        </div>

        {persona.verified ? (
          <p className="flex items-center gap-2 text-sm">
            <BadgeCheck className="size-4 text-primary" />
            Your Deakin student email is already verified.
          </p>
        ) : (
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Deakin student email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@deakin.edu.au"
              className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus:border-primary/50"
            />
            <span className={cn("text-xs", email && !emailOk ? "text-destructive" : "text-muted-foreground")}>
              {email && !emailOk
                ? "Must end in @deakin.edu.au."
                : "Demo checks the domain only; production sends a one-time code. Only the verified flag is stored."}
            </span>
          </label>
        )}

        <div className="space-y-1 text-sm">
          <p className="font-medium">Transcript check (optional, this session only, not stored)</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted">
            {uploading ? <Spinner /> : <FileUp className="size-4" />}
            {transcript ? "Replace file" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadTranscript(e.target.files?.[0])}
            />
          </label>
          {transcript && (
            <span className="ml-2 text-xs text-primary">Checked for this session. The file is not saved.</span>
          )}
        </div>
      </Section>

      <Section step={2} title="How you teach (used to match you with students)">
        {STYLE_QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-1.5">
            <p className="text-sm font-medium">
              {q.label}
              {q.multiple && <span className="font-normal text-muted-foreground"> (pick any)</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => (
                <Chip
                  key={o}
                  active={q.multiple ? style[q.id].includes(o) : style[q.id] === o}
                  onClick={() => pick(q, o)}
                >
                  {o}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section step={3} title="Your voice (the AI learns to talk like you)">
        {VOICE_QUESTIONS.map((q) => (
          <label key={q.id} className="block space-y-1 text-sm">
            <span className="font-medium">{q.label}</span>
            {q.hint && <span className="block text-xs text-primary">{q.hint}</span>}
            <Textarea
              value={voice[q.id]}
              onChange={(e) => setVoice((prev) => ({ ...prev, [q.id]: e.target.value }))}
              rows={3}
              maxLength={1500}
            />
          </label>
        ))}
      </Section>

      <Section step={4} title="Rate and profile highlights">
        <label className="flex items-center gap-3 text-sm">
          <span className="font-medium">Hourly rate (AUD)</span>
          <input
            type="number"
            min={10}
            max={200}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="h-10 w-24 rounded-lg border bg-transparent px-3 text-sm"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Weekly availability</span>
          <input
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Tue/Thu evenings, Burwood weekends"
            maxLength={120}
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showExperience}
            onChange={(e) => setShowExperience(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          <span>
            Show my work experience on my profile{" "}
            <span className="text-muted-foreground">(mentors who do stand out more)</span>
          </span>
        </label>
        {showExperience && (
          <div className="space-y-2">
            {experience.map((e, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  value={e.role}
                  placeholder="Role"
                  onChange={(ev) =>
                    setExperience((prev) => prev.map((x, j) => (j === i ? { ...x, role: ev.target.value } : x)))
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border bg-transparent px-3 text-sm"
                />
                <input
                  value={e.company}
                  placeholder="Company"
                  onChange={(ev) =>
                    setExperience((prev) => prev.map((x, j) => (j === i ? { ...x, company: ev.target.value } : x)))
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border bg-transparent px-3 text-sm"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={e.current}
                    onChange={(ev) =>
                      setExperience((prev) => prev.map((x, j) => (j === i ? { ...x, current: ev.target.checked } : x)))
                    }
                  />
                  Current
                </label>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remove"
                  onClick={() => setExperience((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {experience.length < 3 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setExperience((prev) => [...prev, { role: "", company: "", current: false }])}
              >
                <Plus data-icon="inline-start" />
                Add experience
              </Button>
            )}
          </div>
        )}
      </Section>

      <Section step={5} title="Preview and approve your AI mentor">
        <p className="text-sm text-muted-foreground">
          The AI answers three test questions in your voice, including one where a student asks it to
          write their assignment. Read them, then approve.
        </p>
        <Button type="button" variant="outline" onClick={runPreview} disabled={!canPreview || previewing}>
          {previewing ? <Spinner data-icon="inline-start" /> : <Bot data-icon="inline-start" />}
          {preview && !previewFresh ? "Regenerate preview (answers changed)" : "Preview my AI"}
        </Button>
        {!canPreview && (
          <p className="text-xs text-muted-foreground">
            Choose a unit, an eligible grade, answer every Part A question and write a few sentences for each Part B question.
          </p>
        )}
        {previewFresh && (
          <div className="space-y-3">
            {preview.mocked && (
              <Badge variant="outline" className="text-muted-foreground">
                Offline preview (AI unavailable)
              </Badge>
            )}
            {preview.samples.map((s, i) => (
              <div key={s.question} className="space-y-1.5 rounded-xl border p-3 text-sm">
                <p className="font-medium">Student: {s.question}</p>
                <Textarea
                  value={s.answer}
                  rows={4}
                  onChange={(e) =>
                    setPreview((prev) => ({
                      ...prev,
                      samples: prev.samples.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={conduct}
            onChange={(e) => setConduct(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            I agree to the mentor code of conduct: I coach concepts and study skills, I never write or
            sell assessment work, and I won&apos;t share exam content.
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full rounded-full" disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? <Spinner data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
          Publish AI mentor for review
        </Button>
        {!emailOk && <p className="text-xs text-muted-foreground">Add your Deakin email in step 1 to submit.</p>}
      </Section>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyForm />
    </Suspense>
  );
}
