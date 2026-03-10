import type { Metadata } from 'next';
import { Geist, Geist_Mono, Anton } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
});

export const metadata: Metadata = {
  title: 'IdeaPick — Generate startup ideas with AI',
  description:
    'Describe your skills, interests, or problems and get product ideas you can actually build.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
