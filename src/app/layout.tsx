import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "The Jolly Barber — Book Your Appointment",
  description: "Book your next cut at The Jolly Barber. Haircuts, fades, beard trims & more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-jolly-cream text-jolly-dark antialiased`}>
        {children}
      </body>
    </html>
  );
}
