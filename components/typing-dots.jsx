import { cn } from "@/lib/utils";
import styles from "./typing-dots.module.css";

// Three dots that hop in turn, for "AI is working" labels. Decorative:
// the text next to it says what is happening.
export function TypingDots({ className }) {
  return (
    <span aria-hidden className={cn("inline-flex items-end gap-0.5", className)}>
      <span className={cn("size-1 rounded-full bg-current", styles.dot)} />
      <span className={cn("size-1 rounded-full bg-current", styles.dot)} />
      <span className={cn("size-1 rounded-full bg-current", styles.dot)} />
    </span>
  );
}
