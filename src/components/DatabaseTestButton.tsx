'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, set, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function DatabaseTestButton() {
  const { user } = useAuth();
  const [result, setResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const testDatabaseWrite = async () => {
    if (!user) {
      setResult('❌ Please login first');
      return;
    }

    setTesting(true);
    setResult('🔄 Testing database connection...');

    try {
      // Test simple write
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Database connection test'
      };

      const testRef = ref(realtimeDb, `userUploads/${user.uid}/test-${Date.now()}`);
      
      console.log('Testing database write to:', `userUploads/${user.uid}/test-${Date.now()}`);
      console.log('Test data:', testData);
      
      await set(testRef, testData);
      
      // Test read back
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        setResult('✅ Database connection working! Rules are correct.');
        console.log('✅ Test successful! Data read back:', snapshot.val());
      } else {
        setResult('⚠️ Write succeeded but read failed');
      }
      
    } catch (error: unknown) {
      console.error('❌ Database test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Database test failed: ${errorMessage}`);
      
      if (errorMessage.includes('PERMISSION_DENIED')) {
        setResult('❌ PERMISSION_DENIED: Firebase rules need to be updated! Apply the emergency rules.');
      }
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-yellow-800">Please login to test database connection</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
      
      <button
        onClick={testDatabaseWrite}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
      >
        {testing ? 'Testing...' : 'Test Database Write'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p><strong>This tests:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>Firebase authentication status</li>
          <li>Database write permissions</li>
          <li>Database read permissions</li>
          <li>Rules configuration</li>
        </ul>
      </div>
    </div>
  );
}
