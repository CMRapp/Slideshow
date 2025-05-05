import { Suspense } from 'react';
import { Metadata } from 'next';
import TeamMediaGrid from './TeamMediaGrid';

export const metadata: Metadata = {
  title: 'Team Media Review',
};

// ✅ This is the correct way to type the props Next.js provides to route segments
interface TeamReviewPageProps {
  params: {
    teamName: string;
  };
}

export default async function TeamReviewPage({ params }: TeamReviewPageProps) {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-4 mb-8">
              <h1 className="text-3xl font-bold">Loading...</h1>
            </div>
          }
        >
          <TeamMediaGrid teamName={params.teamName} />
        </Suspense>
      </div>
    </div>
  );
}
