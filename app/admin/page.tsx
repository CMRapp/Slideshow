'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiX } from 'react-icons/fi';
import TabbedContainer from '../components/admin/TabbedContainer';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/check-auth');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      const response = await fetch('/api/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset the database');
      }

      setSuccess('All media deleted successfully');
      setShowDeleteAllConfirm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset the database');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Delete All Confirmation Popup */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-effect p-6 rounded-lg max-w-md w-full mx-4 border border-white/10 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_20px_rgba(234,179,8,0.20)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reset Database</h3>
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to reset the database? This will permanently delete all media files and database records. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FiLogOut />
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 text-white rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900 text-white rounded-lg">
            {success}
          </div>
        )}

        <TabbedContainer />
      </div>
    </div>
  );
} 