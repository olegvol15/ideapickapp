import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { Providers } from './providers';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'IdeaPick',
  description:
    'Describe your skills, interests, or problems and get product ideas you can actually build.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the nonce injected by middleware so it can be passed to any
  // <Script nonce={nonce}> tags. Next.js also reads x-nonce internally
  // to apply it to its own hydration scripts.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} antialiased`}>
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
