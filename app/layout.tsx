import type { Metadata } from 'next';
import { initializeGlobalGradient } from '@/lib/colorUtils';
import './globals.css';
import { Inter } from 'next/font/google';
import VersionInfo from './components/VersionInfo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Slideshow',
  description: 'A modern, team-based media slideshow application',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize the gradient on server startup
  const gradient = await initializeGlobalGradient();
  
  return (
    <html lang="en">
      <head>
        <style>
          {`
            :root {
              --heading-gradient: ${gradient || 'linear-gradient(to right, #ffffff, #000000)'};
            }
          `}
        </style>
      </head>
      <body className={inter.className}>
        {children}
        <VersionInfo />
      </body>
    </html>
  );
}
