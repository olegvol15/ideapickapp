import Link from 'next/link';

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-bold text-muted-foreground">403</p>
      <h2 className="text-xl font-semibold">Access forbidden</h2>
      <p className="text-sm text-muted-foreground">
        You don&apos;t have permission to access this page.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go home
      </Link>
    </div>
  );
}
