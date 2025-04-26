'use client';

import { FiFilm, FiUpload, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  slideshowControls?: React.ReactNode;
}

export default function SidebarLayout({ children, slideshowControls }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [version, setVersion] = useState('');

  useEffect(() => {
    // Fetch version from package.json
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version');
        if (!response.ok) {
          throw new Error('Failed to fetch version');
        }
        const data = await response.json();
        console.log('Version data:', data);
        setVersion(data.version || 'unknown');
      } catch (error) {
        console.error('Error fetching version:', error);
        setVersion('unknown');
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Content Container */}
      <div className="relative w-full h-screen flex flex-col lg:flex-row">
        {/* Navigation - Sidebar on desktop, Top bar on mobile/tablet */}
        <div className="w-full lg:w-[70px] h-[70px] lg:h-full glass-effect bg-black/95 p-2 z-20 flex lg:flex-col items-center justify-center lg:justify-start">
          <div className="flex lg:flex-col items-center justify-between w-full lg:w-auto">
            {/* Logo */}
            <div className="lg:mb-5">
              <Image 
                src="/riders-wm.png" 
                alt="Riders Logo" 
                width={40}
                height={40}
                className="object-contain hover-glow"
                id="logo"
                priority
              />
            </div>

            {/* Navigation Links */}
            <div className="flex lg:flex-col items-center space-x-4 lg:space-x-0 lg:space-y-5">
              <Link
                href="/slideshow"
                className={`nav-item ${pathname === '/slideshow' ? 'active' : ''}`}
              >
                <FiFilm size={24} />
              </Link>
              <Link
                href="/upload"
                className={`nav-item ${pathname === '/upload' ? 'active' : ''}`}
              >
                <FiUpload size={24} />
              </Link>
            </div>

            {/* Slideshow Controls */}
            <div className="mt-5 lg:mt-0">
              <div className="flex lg:flex-col gap-2">
                {slideshowControls}
              </div>
            </div>

            {/* Branding */}
            <div id="sidebar-branding" className="mt-auto flex flex-col lg:flex-col items-center space-y-4 lg:space-y-4">
              <div className="flex flex-row lg:flex-col items-center space-x-4 lg:space-x-0 lg:space-y-4">
                <Image 
                  id="side-logo"
                  src="/side-logo-vertical.png" 
                  alt="Side Logo" 
                  width={60}
                  height={60}
                  className="hidden lg:block object-contain hover-glow"
                  priority
                />
                <Image 
                  id="side-logo"
                  src="/side-logo-horiz.png" 
                  alt="Side Logo" 
                  width={120}
                  height={60}
                  className="block lg:hidden object-contain hover-glow max-h-[60px] w-auto"
                  priority
                />
                <div className="group relative p-3 text-yellow-400">
                  <span className="text-sm font-mono">v{version || 'unknown'}</span>
                  <span className="absolute left-full ml-2 px-2 py-1 glass-effect text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                    Current Version
                  </span>
                </div>
                <Link
                  href="/admin"
                  className="nav-item"
                >
                  <FiSettings size={24} />
                  <span className="absolute left-full ml-2 px-2 py-1 glass-effect text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                    Admin Panel
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 