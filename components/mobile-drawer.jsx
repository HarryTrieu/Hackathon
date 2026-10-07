"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Bookmark, GraduationCap, HeartHandshake, Pencil, Search, ShieldAlert, User, Users } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { AccountSwitcher } from "@/components/account-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { canModerate } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ROW = "flex w-full items-center gap-4 rounded-xl px-2 py-3 text-lg font-bold transition-colors hover:bg-muted";

// Following / followers for the drawer header (empty before the migration).
function useFollowCounts(profileId, open) {
  const [counts, setCounts] = useState({ id: null, followers: 0, following: 0 });
  useEffect(() => {
    if (!open || !profileId || profileId === "admin") return;
    let cancelled = false;
    fetch(`/api/follows?counts=${encodeURIComponent(profileId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && !cancelled && setCounts({ id: profileId, ...data }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileId, open]);
  return counts.id === profileId ? counts : { followers: 0, following: 0 };
}

// Phone-only top bar, like X: your avatar on the left opens a drawer with
// your profile, the places that aren't in the bottom bar, dark mode and the
// account switcher. It scrolls away; each page's own sticky header stays.
export function MobileTopBar() {
  const pathname = usePathname();
  const { persona, face } = usePersona();
  const [open, setOpen] = useState(false);
  const counts = useFollowCounts(persona.id, open);
  const close = () => setOpen(false);
  const isAdmin = persona.role === "admin";

  // Scroll direction on <html data-scroll>: down hides the bar (and Home's
  // tabs), any scroll up shows it again. See app/globals.css.
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const root = document.documentElement;
        if (y < 60) root.dataset.scroll = "up";
        else if (y > last + 6) root.dataset.scroll = "down";
        else if (y < last - 6) root.dataset.scroll = "up";
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      document.documentElement.dataset.scroll = "up";
    };
  }, []);

  // While you type (keyboard open on a phone), <html data-typing> hides the
  // bottom tab bar so the message box sits right on the keyboard. See
  // app/globals.css. Closing the keyboard doesn't always take focus off the
  // box (Android's Back, iPhone's swipe down), so the keyboard is also read
  // from the visible height: when it grows back, the tab bar comes back.
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const isText = (el) =>
      el?.tagName === "TEXTAREA" ||
      (el?.tagName === "INPUT" && !["checkbox", "radio", "button", "submit", "file", "range"].includes(el.type));
    // Tallest visible height seen with the keyboard closed (reset on rotate).
    let full = viewport?.height ?? window.innerHeight;
    const keyboardOpen = () => (viewport ? full - viewport.height > 150 : true);
    const typing = (on) => {
      if (on) root.dataset.typing = "1";
      else delete root.dataset.typing;
    };
    const onIn = (e) => {
      if (isText(e.target)) typing(true);
    };
    const onOut = () => typing(false);
    const onResize = () => {
      full = Math.max(full, viewport.height);
      typing(isText(document.activeElement) && keyboardOpen());
    };
    const onRotate = () => {
      full = 0;
      setTimeout(() => {
        full = viewport?.height ?? window.innerHeight;
      }, 500);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    viewport?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onRotate);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
      viewport?.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onRotate);
      typing(false);
    };
  }, []);

  const items = [
    { href: `/profile/${persona.id}`, label: "Profile", icon: User },
    ...(persona.id.startsWith("u-") ? [{ href: "/welcome", label: "Edit profile", icon: Pencil }] : []),
    ...(isAdmin ? [] : [{ href: `/profile/${persona.id}?tab=saved`, label: "Saved", icon: Bookmark }]),
    { href: "/mentors", label: "Mentoring", icon: HeartHandshake },
    { href: "/communities", label: "Communities", icon: Users },
    { href: "/search", label: "Topics", icon: Search },
    ...(canModerate(persona) ? [{ href: "/review", label: "Review", icon: ShieldAlert }] : []),
  ];

  return (
    <div
      id="mobile-top-bar"
      className="sticky top-[0px] z-30 flex h-12 items-center gap-3 border-b bg-background px-4 md:hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-full ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-primary/40"
      >
        <UserAvatar profile={face} className="size-8" textClassName="text-[10px]" />
      </button>
      <Link href="/" className="mx-auto flex items-center gap-1.5 pr-11" aria-label="Sodu home">
        <GraduationCap className="size-5 text-primary" />
        <span className="font-bold tracking-tight">Sodu</span>
      </Link>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40" />
          <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-xs flex-col overflow-y-auto border-r bg-popover p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-popover-foreground shadow-xl outline-none duration-200 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left md:hidden">
            <DialogTitle className="sr-only">Menu</DialogTitle>

            <Link href={`/profile/${persona.id}`} onClick={close} className="w-fit">
              <UserAvatar profile={face} className="size-11" textClassName="text-sm" />
            </Link>
            <p className="mt-2 text-lg leading-tight font-bold">{face.name}</p>
            <p className="text-sm text-muted-foreground">@{face.handle}</p>
            {!isAdmin && (
              <p className="mt-2 flex gap-4 text-sm">
                <span>
                  <b>{counts.following}</b> <span className="text-muted-foreground">Following</span>
                </span>
                <span>
                  <b>{counts.followers}</b>{" "}
                  <span className="text-muted-foreground">{counts.followers === 1 ? "Follower" : "Followers"}</span>
                </span>
              </p>
            )}

            <nav className="mt-4 flex flex-col border-t pt-2" aria-label="Menu">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={close}
                  className={cn(ROW, pathname === href.split("?")[0] && label !== "Saved" && "text-primary")}
                >
                  <Icon className="size-6" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-2 border-t pt-3">
              <ThemeToggle className="w-full justify-start px-2 text-base" />
              <AccountSwitcher />
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
