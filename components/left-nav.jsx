"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, HeartHandshake, MessageCircle, User, Users, GraduationCap, ShieldAlert, Search } from "lucide-react";
import { AccountSwitcher } from "@/components/account-switcher";
import { FloatingPostButton } from "@/components/floating-post-button";
import { PostDialogButton } from "@/components/post-dialog";
import { isMentoringPath } from "@/components/mentoring-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePersona } from "@/lib/persona-context";
import { useNotifications } from "@/lib/use-notifications";
import { useInbox } from "@/lib/use-inbox";
import { canModerate } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useReviewCount } from "@/lib/use-review-count";

// Unread count on the bell, capped so the badge stays small.
function UnreadBadge({ count, className }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function LeftNav() {
  const pathname = usePathname();
  const { persona } = usePersona();
  const isAdmin = persona.role === "admin";
  const { unreadCount } = useNotifications(persona.id, pathname);
  // Items waiting in /review (moderators only).
  const review = useReviewCount(canModerate(persona) ? persona.id : null);
  const inbox = useInbox(isAdmin ? null : persona.id);

  const items = [
    { href: "/", label: "Home", icon: Home },
    // Find a mentor and the Mentor hub, as tabs inside.
    { href: "/mentors", label: "Mentoring", icon: HeartHandshake },
    // The demo Moderator doesn't chat; everyone else gets Messages.
    ...(isAdmin ? [] : [{ href: "/messages", label: "Messages", icon: MessageCircle, badge: inbox.unread }]),
    { href: "/search", label: "Topics", icon: Search },
    { href: "/communities", label: "Communities", icon: Users },
    // The demo Moderator works from the review queue instead of notifications;
    // a real moderator account gets both.
    ...(canModerate(persona) ? [{ href: "/review", label: "Review", icon: ShieldAlert, badge: review?.total ?? 0 }] : []),
    ...(isAdmin ? [] : [{ href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount }]),
    { href: `/profile/${persona.id}`, label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col gap-1 px-3 py-4 md:flex">
      <Link
        href="/"
        className="mb-2 flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-muted"
      >
        <GraduationCap className="size-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">Sodu</span>
      </Link>

      <nav className="flex flex-col gap-1" aria-label="Main">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/mentors"
                ? isMentoringPath(pathname)
                : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2.5 text-base transition-all hover:bg-muted hover:translate-x-0.5",
                active ? "font-bold" : "text-foreground/80"
              )}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <UnreadBadge count={badge} className="absolute -top-1.5 -right-2" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <PostDialogButton />

      <div className="mt-auto space-y-2">
        <ThemeToggle className="w-full justify-start text-foreground/80" />
        <AccountSwitcher />
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { persona } = usePersona();
  const { unreadCount } = useNotifications(persona.id, pathname);
  // Items waiting in /review (moderators only).
  const review = useReviewCount(canModerate(persona) ? persona.id : null);

  // The profile, Topics and settings live in the top bar's drawer
  // (components/mobile-drawer.jsx); the last slot goes straight to Messages.
  const inbox = useInbox(persona.role === "admin" ? null : persona.id);
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/mentors", label: "Mentoring", icon: HeartHandshake },
    { href: "/communities", label: "Units", icon: Users },
    ...(canModerate(persona)
      ? [{ href: "/review", label: "Review", icon: ShieldAlert, badge: review?.total ?? 0 }]
      : [{ href: "/notifications", label: "Alerts", icon: Bell, badge: unreadCount }]),
    ...(persona.role === "admin" ? [] : [{ href: "/messages", label: "Messages", icon: MessageCircle, badge: inbox.unread }]),
  ];

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t bg-background md:bg-background/95 py-2 md:backdrop-blur md:hidden"
    >
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : href === "/mentors"
              ? isMentoringPath(pathname)
              : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] transition-colors hover:bg-muted",
              active ? "font-semibold text-primary" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <Icon className="size-5" />
              <UnreadBadge count={badge} className="absolute -top-1.5 -right-2" />
            </span>
            {label}
          </Link>
        );
      })}
      <FloatingPostButton />
    </nav>
  );
}
