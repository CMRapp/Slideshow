import { initializeGlobalGradient } from '@/lib/colorUtils';
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Slideshow App',
  description: 'Upload and display media in a slideshow',
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
      </body>
    </html>
  );
}
