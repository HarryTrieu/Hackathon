import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const metadata = { title: "Page not found · Sodu" };

// Any unknown URL, and pages that call notFound() (e.g. a profile that
// doesn't exist). Rendered inside the app shell, so the nav stays.
export default function NotFound() {
  return (
    <Empty className="min-h-[70svh] pb-24 md:pb-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Compass />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          The link may be wrong, or the post or person it pointed to isn&apos;t here any more.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center">
        <Link href="/" className={cn(buttonVariants(), "rounded-full")}>
          <Home data-icon="inline-start" />
          Back to Home
        </Link>
        <Link href="/mentors" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
          Find a mentor
          <ArrowRight data-icon="inline-end" />
        </Link>
      </EmptyContent>
    </Empty>
  );
}
