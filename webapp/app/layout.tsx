import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SimpleFM Web',
  description: 'A mobile-first football management experience inspired by classic managers.',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
