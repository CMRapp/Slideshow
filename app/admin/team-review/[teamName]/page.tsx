import { Suspense } from 'react';
import { Metadata } from 'next';
import TeamMediaGrid from './TeamMediaGrid';

export const metadata: Metadata = {
  title: 'Team Media Review',
};

type Props = {
  params: {
    teamName: string;
  };
};

export default async function TeamReviewPage({ params }: Props) {
  const { teamName } = params;

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
          <TeamMediaGrid teamName={teamName} />
        </Suspense>
      </div>
    </div>
  );
}
