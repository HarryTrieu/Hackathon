import { cn } from "@/lib/utils";

// Big numbers with small labels in one bordered row, like the post and
// follower counts on social profiles. items: [[value, label], ...]
export function StatRow({ items, className }) {
  return (
    // Four or more stats: a 2 by 2 grid on phones so labels don't squeeze
    // into three lines, one row from sm up. The 1 px gaps over a border
    // colour draw the dividers in either layout.
    <dl
      className={cn(
        "grid gap-px overflow-hidden rounded-xl border bg-border text-center",
        items.length > 3 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
      style={items.length > 3 ? undefined : { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(([value, label]) => (
        // Value above label (dt first for screen readers), centred in the cell.
        <div key={label} className="flex flex-col-reverse justify-center gap-0.5 bg-background px-2 py-3">
          <dt className="text-xs leading-snug text-muted-foreground">{label}</dt>
          <dd className="text-lg leading-tight font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
