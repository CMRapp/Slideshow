'use client';

import { FiFilm, FiUpload, FiPlay, FiPause, FiVolume2, FiVolumeX, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onVolumeChange?: (volume: number) => void;
}

export default function SidebarLayout({ 
  children, 
  isPlaying = true,
  onPlayPause,
  onVolumeChange 
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
      onVolumeChange(newMuted ? 0 : volume);
    }
  };

  return (
    <div className="min-h-screen relative">
          
      {/* Content Container */}
      <div className="relative w-full h-screen flex flex-col lg:flex-row">
        {/* Navigation - Sidebar on desktop, Top bar on mobile/tablet */}
        <div className="w-full lg:w-[70px] h-[70px] lg:h-full bg-black/85 p-2 z-20 flex lg:flex-col items-center justify-center lg:justify-start">
          <div className="flex lg:flex-col items-center justify-between w-full lg:w-auto">
            {/* Logo */}
            <div className="lg:mb-8">
              <img 
                src="/riders-wm.png" 
                alt="Riders Logo" 
                className="w-10 h-10 object-contain"
                id="logo"
              />
            </div>

            {/* Navigation Links */}
            <div className="flex lg:flex-col items-center space-x-4 lg:space-x-0 lg:space-y-4">
              <Link
                href="/slideshow"
                className={`group relative p-3 text-white hover:text-blue-300 transition-colors ${
                  pathname === '/slideshow' ? 'text-blue-300' : ''
                }`}
              >
                <FiFilm size={24} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                  Slideshow
                </span>
              </Link>
              <Link
                href="/upload"
                className={`group relative p-3 text-white hover:text-blue-300 transition-colors ${
                  pathname === '/upload' ? 'text-blue-300' : ''
                }`}
              >
                <FiUpload size={24} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                  Upload Media
                </span>
              </Link>
            </div>

            {/* Controls Container - Only show on slideshow page */}
            {(pathname === '/slideshow' || pathname === '/') && (
              <div id="controls" className="flex lg:flex-col items-center space-x-4 lg:space-x-0 lg:space-y-4">
                {/* Play/Pause Button */}
                {onPlayPause && (
                  <button
                    onClick={onPlayPause}
                    className="group relative p-3 text-yellow-400 hover:text-yellow-300 transition-colors"
                    aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                  >
                    {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
                    <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                      {isPlaying ? 'Pause' : 'Play'}
                    </span>
                  </button>
                )}

                {/* Volume Controls */}
                <div className="group relative">
                  <button
                    onClick={toggleMute}
                    className="p-3 text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    {isMuted ? <FiVolumeX size={24} /> : <FiVolume2 size={24} />}
                  </button>
                  <div className="absolute left-full ml-2 p-2 bg-black/90 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                    Volume
                  </span>
                </div>
              </div>
            )}

            {/* Sidebar Branding Container */}
            <div id="sidebar-branding" className="mt-auto flex flex-col lg:flex-col items-center space-y-4 lg:space-y-4">
              <div className="flex flex-row lg:flex-col items-center space-x-4 lg:space-x-0 lg:space-y-4">
                <img 
                  id="side-logo"
                  src="/side-logo-vertical.png" 
                  alt="Side Logo" 
                  className="hidden lg:block max-w-[60px] h-auto object-contain"
                />
                <img 
                  id="side-logo"
                  src="/side-logo-horiz.png" 
                  alt="Side Logo" 
                  className="block lg:hidden h-[60px] w-auto object-contain"
                />
                <div className="group relative p-3 text-yellow-400">
                  <span className="text-sm font-mono">v{version || 'unknown'}</span>
                  <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                    Current Version
                  </span>
                </div>
                <Link
                  href="/admin"
                  className="group relative p-3 text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  <FiSettings size={24} />
                  <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
                    Admin Panel
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-[70px] relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
} 