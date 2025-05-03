import { Suspense } from 'react';
import TeamMediaGrid from './TeamMediaGrid';
import { Metadata } from 'next';

type PageProps = {
  params: { teamName: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `${params.teamName} Media Review`,
  };
}

export default async function TeamReviewPage({ params }: PageProps) {
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