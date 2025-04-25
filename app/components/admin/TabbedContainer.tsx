'use client';

import { useState, ReactNode } from 'react';
import { FiSliders, FiImage, FiDatabase, FiEye } from 'react-icons/fi';

interface TabbedContainerProps {
  children: ReactNode[];
}

export default function TabbedContainer({ children }: TabbedContainerProps) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { name: 'Slideshow Config', icon: <FiSliders /> },
    { name: 'Branding', icon: <FiImage /> },
    { name: 'Database Management', icon: <FiDatabase /> },
    { name: 'Review', icon: <FiEye /> },
  ];

  return (
    <div className="flex h-full">
      {/* Vertical Tabs */}
      <div className="w-16 bg-black/85 p-4 space-y-4 border-r border-white/10">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`w-full flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
              activeTab === index
                ? 'bg-yellow-400 text-black'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-xs text-center [writing-mode:vertical-rl] rotate-180">
              {tab.name}
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 bg-black/85">
        {children && children[activeTab]}
      </div>
    </div>
  );
} 