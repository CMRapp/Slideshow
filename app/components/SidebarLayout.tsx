'use client';

import { FiFilm, FiUpload, FiVolume2, FiVolumeX, FiSettings, FiPlay, FiPause } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onVolumeChange?: (volume: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export default function SidebarLayout({ 
  children, 
  onVolumeChange,
  isPlaying = false,
  onPlayPause
}: SidebarLayoutProps) {
  const pathname = usePathname();
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
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

  useEffect(() => {
    if (onVolumeChange) {
      onVolumeChange(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, onVolumeChange]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (onVolumeChange) {
      onVolumeChange(newMuted ? 0 : 100);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Content Container */}
      <div className="relative w-full h-screen flex flex-col lg:flex-row">
        {/* Navigation - Sidebar on desktop, Top bar on mobile/tablet */}
        <div className="w-full lg:w-[70px] h-[70px] lg:h-full glass-effect p-2 z-20 flex lg:flex-col items-center justify-center lg:justify-start">
          <div className="flex lg:flex-col items-center justify-between w-full lg:w-auto">
            {/* Logo */}
            <div className="lg:mb-8">
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
            <div className="flex lg:flex-col items-center space-x-4 lg:space-x-0 lg:space-y-8">
              <Link
                href="/slideshow"
                className={`nav-item ${pathname === '/slideshow' ? 'active' : ''}`}
              >
                <FiFilm size={24} />
              </Link>
              <button
                onClick={() => onPlayPause?.()}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                id="play-pause-button"
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
              </button>
              <Link
                href="/upload"
                className={`nav-item ${pathname === '/upload' ? 'active' : ''}`}
              >
                <FiUpload size={24} />
              </Link>
              <button
                onClick={toggleMute}
                className="nav-item"
              >
                {isMuted ? <FiVolumeX size={24} /> : <FiVolume2 size={24} />}
              </button>
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
                  width={60}
                  height={60}
                  className="block lg:hidden object-contain hover-glow"
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