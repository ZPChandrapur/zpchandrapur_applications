import React, { useState } from 'react';
import { ermsClient, supabase, testERMSConnection } from '../lib/supabase';
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const TestERMSConnection: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Use the built-in test function
    try {
      addResult({ test: 'ERMS Schema Connection Test', status: 'pending', message: 'Testing connection with provided credentials...' });
      
      const result = await testERMSConnection();
      
      if (result.success) {
        addResult({ 
          test: 'ERMS Schema Connection Test', 
          status: 'success', 
          message: `Successfully connected! Found ${result.count} departments`,
          data: result.data
        });
      } else {
        addResult({ 
          test: 'ERMS Schema Connection Test', 
          status: 'error', 
          message: result.error || 'Connection failed'
        });
      }
    } catch (error: any) {
      addResult({ 
        test: 'ERMS Schema Connection Test', 
        status: 'error', 
        message: error.message 
      });
    }

    // Test 2: Basic Supabase Connection
    try {
      addResult({ test: 'Basic Supabase Connection', status: 'pending', message: 'Testing basic connection...' });
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      addResult({ 
        test: 'Basic Supabase Connection', 
        status: 'success', 
        message: 'Connected successfully',
        data: { hasSession: !!data.session }
      });
    } catch (error: any) {
      addResult({ 
        test: 'Basic Supabase Connection', 
        status: 'error', 
        message: error.message 
      });
    }

    // Test 3: Public Schema Access (roles table)
    try {
      addResult({ test: 'Public Schema Access', status: 'pending', message: 'Testing roles table...' });
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      addResult({ 
        test: 'Public Schema Access', 
        status: 'success', 
        message: `Found ${data?.length || 0} roles`,
        data: data
      });
    } catch (error: any) {
      addResult({ 
        test: 'Public Schema Access', 
        status: 'error', 
        message: error.message 
      });
    }

    // Test 4: Direct ERMS Schema Access
    try {
      addResult({ test: 'Direct ERMS Schema Access', status: 'pending', message: 'Testing direct department table access...' });
      
      const { data, error } = await ermsClient
        .from('department')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      addResult({ 
        test: 'Direct ERMS Schema Access', 
        status: 'success', 
        message: `Found ${data?.length || 0} departments`,
        data: data
      });
    } catch (error: any) {
      addResult({ 
        test: 'Direct ERMS Schema Access', 
        status: 'error', 
        message: error.message 
      });
    }

    // Test 5: ERMS Table Structure Analysis
    try {
      addResult({ test: 'ERMS Table Structure Analysis', status: 'pending', message: 'Analyzing table structure...' });
      
      const { data, error } = await ermsClient
        .from('department')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      addResult({ 
        test: 'ERMS Table Structure Analysis', 
        status: 'success', 
        message: `Table has ${columns.length} columns: ${columns.join(', ')}`,
        data: { columns, sampleData: data?.[0] }
      });
    } catch (error: any) {
      addResult({ 
        test: 'ERMS Table Structure Analysis', 
        status: 'error', 
        message: error.message 
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">ERMS Schema Connection Test</h2>
            <p className="text-gray-600">Test connection to Supabase ERMS schema with provided credentials</p>
            <div className="mt-2 text-sm text-gray-500">
              <p><strong>URL:</strong> https://tvmqkondihsomlebizjj.supabase.co</p>
              <p><strong>Schema:</strong> erms</p>
              <p><strong>Table:</strong> department</p>
            </div>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg mb-6 flex items-center space-x-2"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              <span>Run Connection Tests</span>
            </>
          )}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.test}</div>
                    <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View Data
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};