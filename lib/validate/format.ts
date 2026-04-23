export function relativeDate(raw: string | number): string {
  const ms   = typeof raw === 'number' ? raw : new Date(raw).getTime();
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
