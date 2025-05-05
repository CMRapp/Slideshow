import { Suspense } from 'react';
import { Metadata } from 'next';
import TeamMediaGrid from './TeamMediaGrid';

interface PageProps {
  params: {
    teamName: string;
  };
}

export const metadata: Metadata = {
  title: 'Team Media Review',
};

export default function TeamReviewPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        }>
          <TeamMediaGrid teamName={params.teamName} />
        </Suspense>
      </div>
    </div>
  );
} 