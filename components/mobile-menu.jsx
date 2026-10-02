"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MessageCircle, Search, User } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { AccountSwitcher } from "@/components/account-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { usePersona } from "@/lib/persona-context";
import { useInbox } from "@/lib/use-inbox";
import { cn } from "@/lib/utils";

const ROW = "flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors hover:bg-muted";

// Phone-only "Me" tab: your avatar in the bottom nav opens a sheet with your
// profile, Topics, dark mode and the demo persona switcher, which otherwise
// only live in the desktop left nav.
export function MobileMenu() {
  const pathname = usePathname();
  const { persona } = usePersona();
  const inbox = useInbox(persona.role === "admin" ? null : persona.id);
  const [open, setOpen] = useState(false);
  const profileHref = `/profile/${persona.id}`;
  const active = open || pathname.startsWith(profileHref);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] transition-colors hover:bg-muted",
          active ? "font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        <UserAvatar
          profile={persona}
          className={cn("size-5 ring-2 ring-offset-1 ring-offset-background", active ? "ring-primary" : "ring-transparent")}
          textClassName="text-[8px]"
        />
        Me
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40" />
          <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col gap-1 overflow-y-auto rounded-t-2xl border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-popover-foreground shadow-lg outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom md:hidden">
            <div aria-hidden className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <DialogTitle className="sr-only">Menu</DialogTitle>

            <Link href={profileHref} onClick={close} className={ROW}>
              <User className="size-4" />
              View profile
            </Link>
            {persona.role !== "admin" && (
              <Link href="/messages" onClick={close} className={ROW}>
                <MessageCircle className="size-4" />
                Messages
                {inbox.unread > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
                    {inbox.unread}
                  </span>
                )}
              </Link>
            )}
            <Link href="/search" onClick={close} className={ROW}>
              <Search className="size-4" />
              Topics
            </Link>
            <ThemeToggle className={cn(ROW, "py-2.5")} />

            <div className="mt-2 space-y-2 border-t pt-3">
              <AccountSwitcher inline />
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
