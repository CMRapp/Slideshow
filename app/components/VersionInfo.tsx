'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  commitCount: string;
  lastTag: string;
  buildTime: string;
}

export default function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(console.error);
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400">
      <div>Version: {versionInfo.version}</div>
      <div>Build: {new Date(versionInfo.buildTime).toLocaleString()}</div>
      <div>Commits: {versionInfo.commitCount}</div>
    </div>
  );
} 