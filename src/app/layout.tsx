import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Opportunity Radar | Find Hackathons, Internships, Fellowships & Grants',
  description: 'AI-driven radar scanning the web to discover curated hackathons, internships, fellowships, and grants tailored to your profile.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080c14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
