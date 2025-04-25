'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SidebarLayoutProps {
  children: React.ReactNode;
  slideshowControls?: React.ReactNode;
}

export default function SidebarLayout({ children, slideshowControls }: SidebarLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-black/90 backdrop-blur-lg p-6 flex flex-col">
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <Link
                href="/"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/upload"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/upload' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                Upload
              </Link>
            </li>
            <li>
              <Link
                href="/slideshow"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/slideshow' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                Slideshow
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/admin' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                Admin
              </Link>
            </li>
          </ul>
        </nav>

        {slideshowControls}

        <div className="mt-auto">
          <Image
            src="/side-logo.png"
            alt="Side Logo"
            width={200}
            height={100}
            className="w-full"
          />
        </div>
      </div>
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
} 