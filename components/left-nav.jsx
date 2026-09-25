"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, PenLine, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { usePersona } from "@/lib/persona-context";
import { cn } from "@/lib/utils";

export function LeftNav() {
  const pathname = usePathname();
  const { persona } = usePersona();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
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
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2.5 text-base transition-all hover:bg-muted hover:translate-x-0.5",
                active ? "font-bold" : "text-foreground/80"
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Button
        size="lg"
        className="mt-3 w-full rounded-full text-base font-semibold shadow-sm transition-all hover:shadow-md"
        onClick={() =>
          document.getElementById("composer-input")?.focus()
        }
      >
        <PenLine data-icon="inline-start" />
        Post
      </Button>

      <div className="mt-auto">
        <PersonaSwitcher />
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { persona } = usePersona();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: `/profile/${persona.id}`, label: "Profile", icon: User },
  ];

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t bg-background/95 py-2 backdrop-blur md:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-4 py-1 text-[11px] transition-colors hover:bg-muted",
              active ? "font-semibold text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
