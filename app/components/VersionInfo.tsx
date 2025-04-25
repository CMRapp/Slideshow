'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildDate: string;
  environment: string;
}

export default function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(console.error);
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400">
      <div>Version: {versionInfo.version}</div>
      <div>Build: {new Date(versionInfo.buildDate).toLocaleString()}</div>
      <div>Environment: {versionInfo.environment}</div>
    </div>
  );
} 