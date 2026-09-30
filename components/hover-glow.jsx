// The soft corner glow from post cards, faded in while the surrounding
// shadcn Card (which carries the `group/card` class) is hovered. The Card
// needs `relative`, and its content `relative` so text stays above the glow.
export function HoverGlow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-5 -right-5 size-16 rounded-full bg-gradient-to-br from-primary/40 via-sky-400/20 to-transparent opacity-0 blur-2xl transition-opacity duration-300 ease-out group-hover/card:opacity-100 dark:-top-8 dark:-right-8 dark:size-28"
    />
  );
}
