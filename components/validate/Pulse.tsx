export function Pulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/40 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground/60" />
    </span>
  );
}
