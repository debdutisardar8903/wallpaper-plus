'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminOperations } from '@/lib/database';
import { seedDatabase, clearDatabase } from '@/scripts/seedData';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const adminStatus = await adminOperations.isAdmin(user.uid);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const handleSeedDatabase = async () => {
    if (!confirm('Are you sure you want to seed the database? This will add sample data.')) {
      return;
    }

    setSeeding(true);
    setMessage(null);

    try {
      const result = await seedDatabase();
      setMessage({ 
        type: 'success', 
        text: `Database seeded successfully! Added ${result.data.categories} categories and ${result.data.wallpapers} wallpapers.` 
      });
    } catch (error: unknown) {
      console.error('Error seeding database:', error);
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to seed database' });
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL data from the database. Are you sure?')) {
      return;
    }

    if (!confirm('This action cannot be undone. Type "DELETE" to confirm.')) {
      return;
    }

    setClearning(true);
    setMessage(null);

    try {
      await clearDatabase();
      setMessage({ type: 'success', text: 'Database cleared successfully!' });
    } catch (error: unknown) {
      console.error('Error clearing database:', error);
      setMessage({ type: 'error', text: (error as Error).message || 'Failed to clear database' });
    } finally {
      setClearning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wallpaper website database and settings
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {message.text}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Database Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H4c0-2.21 1.79-4 4-4z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Database Management
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seed Database */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Seed Database
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add sample categories, wallpapers, and settings to get started.
                </p>
                <button
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {seeding ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Seeding...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Seed Database
                    </>
                  )}
                </button>
              </div>

              {/* Clear Database */}
              <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-2">
                  Clear Database
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  ⚠️ Permanently delete all data. This action cannot be undone!
                </p>
                <button
                  onClick={handleClearDatabase}
                  disabled={clearing}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {clearing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Database
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin/uploads')}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Review Uploads</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Moderate pending wallpaper uploads</p>
              </button>

              <button
                onClick={() => router.push('/admin/reports')}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">View Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Handle user reports and feedback</p>
              </button>

              <button
                onClick={() => router.push('/admin/analytics')}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View usage statistics and trends</p>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex">
              <svg className="w-6 h-6 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Getting Started
                </h3>
                <div className="text-blue-800 dark:text-blue-300 space-y-2">
                  <p>1. <strong>First time setup:</strong> Click &quot;Seed Database&quot; to populate with sample data</p>
                  <p>2. <strong>Database URL:</strong> https://wallpaper-plus-web-default-rtdb.firebaseio.com</p>
                  <p>3. <strong>Security Rules:</strong> Upload the rules from firebase-realtime-database-rules.json</p>
                  <p>4. <strong>Admin Access:</strong> Add your UID to /admins/{'{your_uid}'}: true in the database</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
