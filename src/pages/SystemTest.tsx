import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RotateCcw, 
  Bug,
  Shield,
  Database,
  Users,
  Receipt,
  Activity
} from "lucide-react";
import { BillingSystemTester } from "@/utils/billTestUtils";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

export default function SystemTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runSystemTest = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    setProgress(0);

    try {
      const tester = new BillingSystemTester();
      
      // Simulate progress updates
      const progressSteps = [
        { step: 20, message: "Initializing authentication..." },
        { step: 40, message: "Testing patient creation..." },
        { step: 60, message: "Testing prescription generation..." },
        { step: 80, message: "Testing bill generation & inventory..." },
        { step: 100, message: "Completing tests..." }
      ];

      for (const progressStep of progressSteps) {
        setProgress(progressStep.step);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const testResults = await tester.runFullTest();
      
      setResults(testResults.results);
      setSummary(testResults.summary);

      const allPassed = testResults.summary.failed === 0;
      
      toast({
        title: allPassed ? "All Tests Passed! 🎉" : "Some Tests Failed ⚠️",
        description: `${testResults.summary.passed}/${testResults.summary.total} tests passed (${testResults.summary.passRate}%)`,
        variant: allPassed ? "default" : "destructive",
      });

    } catch (error) {
      console.error("Test execution error:", error);
      toast({
        title: "Test Execution Failed",
        description: "An error occurred while running the tests. Please check the console.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const resetTests = () => {
    setResults([]);
    setSummary(null);
    setProgress(0);
  };

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case "Authentication Check":
        return <Shield className="w-5 h-5" />;
      case "Patient Creation":
        return <Users className="w-5 h-5" />;
      case "Prescription Creation":
        return <Receipt className="w-5 h-5" />;
      case "Inventory Check":
        return <Database className="w-5 h-5" />;
      case "Bill Generation & Inventory Update":
        return <Activity className="w-5 h-5" />;
      case "Data Retrieval Integrity":
        return <Bug className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧪 Billing System Health Check
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive testing suite to verify all billing components are working correctly
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Activity className="w-6 h-6 mr-2" />
              Test Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button
                onClick={runSystemTest}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                {isRunning ? "Running Tests..." : "Run System Test"}
              </Button>
              
              <Button
                onClick={resetTests}
                variant="outline"
                disabled={isRunning}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>

              {isRunning && (
                <div className="flex-1 max-w-md">
                  <div className="text-sm text-gray-600 mb-2">
                    Progress: {progress}%
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Summary */}
        {summary && (
          <Card className={`mb-6 border-2 ${
            summary.failed === 0 
              ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
              : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${
                summary.failed === 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {summary.failed === 0 ? (
                  <CheckCircle2 className="w-6 h-6 mr-2 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 mr-2 text-red-600" />
                )}
                Test Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.passRate}%</div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </div>
              </div>
              
              <div className="mt-4">
                <Badge 
                  variant={summary.failed === 0 ? "default" : "destructive"}
                  className="text-lg px-3 py-1"
                >
                  {summary.failed === 0 ? "✅ ALL SYSTEMS OPERATIONAL" : "⚠️ ISSUES DETECTED"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Test Results */}
        {results.length > 0 && (
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Bug className="w-6 h-6 mr-2" />
                Detailed Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        result.passed 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`${
                            result.passed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {getTestIcon(result.test)}
                          </div>
                          <div>
                            <h3 className={`font-semibold text-lg ${
                              result.passed ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {result.test}
                            </h3>
                            <p className={`text-sm ${
                              result.passed ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {result.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {result.passed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <Badge 
                            variant={result.passed ? "default" : "destructive"}
                            className="ml-2"
                          >
                            {result.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                      </div>
                      
                      {result.data && (
                        <div className="mt-3 p-3 bg-white/70 rounded border border-gray-200">
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                              View Test Data
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {results.length === 0 && !isRunning && (
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-gray-900">🚀 Ready to Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  This comprehensive test suite will verify the following system components:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Authentication & Security</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Patient Data Management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Prescription Generation</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Inventory Management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">Bill Generation & Inventory Updates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bug className="w-4 h-4 text-pink-600" />
                      <span className="text-sm font-medium">Data Integrity & Error Handling</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-blue-900 text-sm">
                    <strong>Note:</strong> Tests will create temporary data that will be cleaned up automatically. 
                    Your existing data will not be affected.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 