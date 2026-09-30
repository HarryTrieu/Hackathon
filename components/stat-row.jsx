import { cn } from "@/lib/utils";

// Big numbers with small labels in one bordered row, like the post and
// follower counts on social profiles. items: [[value, label], ...]
export function StatRow({ items, className }) {
  return (
    <dl
      className={cn(
        "grid divide-x rounded-xl border bg-background/60 text-center",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(([value, label]) => (
        <div key={label} className="flex flex-col-reverse px-2 py-2">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-lg font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
