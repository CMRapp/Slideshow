import { Suspense } from 'react';
import TeamMediaGrid from './TeamMediaGrid';
import { Metadata } from 'next';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

type PageProps = {
  params: Promise<{ teamName: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: 'Team Media Review',
};

export default async function TeamReviewPage({ params }: PageProps) {
  const { teamName } = await params;
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link 
          href="/admin#review" 
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-8 transition-colors"
        >
          <FiArrowLeft />
          Back to Review
        </Link>
        <Suspense fallback={
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        }>
          <TeamMediaGrid teamName={teamName} />
        </Suspense>
      </div>
    </div>
  );
} 