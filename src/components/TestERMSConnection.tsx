import React, { useState, useEffect } from 'react';
import { testERMSConnection } from '../lib/supabase';
import { Database, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

interface TestResult {
  success: boolean;
  error: string | null;
  data: any;
  count?: number;
  schema?: string;
  table?: string;
}

export const TestERMSConnection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testERMSConnection();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ERMS Database Connection Test</h1>
              <p className="text-gray-600">Testing connection to Supabase ERMS schema</p>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={runTest}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Run Connection Test</span>
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {testResult && (
            <div className="space-y-4">
              {/* Status */}
              <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    testResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </h3>
                  {testResult.error && (
                    <p className="text-red-700 text-sm mt-1">{testResult.error}</p>
                  )}
                </div>
              </div>

              {/* Connection Details */}
              {testResult.success && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Connection Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Schema:</span>
                      <span className="ml-2 font-medium">{testResult.schema || 'erms'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Table:</span>
                      <span className="ml-2 font-medium">{testResult.table || 'department'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Records Found:</span>
                      <span className="ml-2 font-medium">{testResult.count || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {testResult.success && testResult.data && testResult.data.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Sample Data</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {Object.keys(testResult.data[0]).map((key) => (
                            <th key={key} className="text-left py-2 px-3 font-medium text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {testResult.data.slice(0, 3).map((row: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100">
                            {Object.values(row).map((value: any, cellIndex: number) => (
                              <td key={cellIndex} className="py-2 px-3 text-gray-900">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {testResult.data.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing 3 of {testResult.data.length} records
                    </p>
                  )}
                </div>
              )}

              {/* Empty State */}
              {testResult.success && (!testResult.data || testResult.data.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">No Data Found</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Connection successful but no records found in the department table.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};