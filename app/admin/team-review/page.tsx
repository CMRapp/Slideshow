import { Suspense } from 'react';
import { Metadata } from 'next';
import TeamList from './TeamList';

export const metadata: Metadata = {
  title: 'Team Review',
};

export default function TeamReviewPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Team Review</h1>
        <Suspense fallback={
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl">Loading teams...</h2>
          </div>
        }>
          <TeamList />
        </Suspense>
      </div>
    </div>
  );
} 