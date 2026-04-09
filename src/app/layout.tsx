import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FitCoach App',
  description: 'Coach and client fitness platform scaffold'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
