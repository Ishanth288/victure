/**
 * Timeout Debug Page
 * A comprehensive testing interface for debugging timeout handling
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeoutMonitor } from '@/components/debug/TimeoutMonitor';
import { ClientTimeoutHandler } from '@/utils/clientTimeoutHandler';
import { UITimeoutManager, useUITimeout } from '@/utils/uiTimeoutManager';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Play, Square, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  id: string;
  testName: string;
  status: 'running' | 'success' | 'failed' | 'timeout';
  duration: number;
  error?: string;
  timestamp: Date;
}

export default function TimeoutDebugPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customTimeout, setCustomTimeout] = useState('5000');
  const [customDelay, setCustomDelay] = useState('3000');
  const [selectedPreset, setSelectedPreset] = useState('ui_interaction');
  const [testData, setTestData] = useState('');
  
  const { executeWithTimeout, isLoading, error, progress } = useUITimeout();

  const addTestResult = useCallback((result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const newResult: TestResult = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setTestResults(prev => [newResult, ...prev.slice(0, 19)]); // Keep last 20 results
  }, []);

  const runBasicTimeoutTest = useCallback(async () => {
    const startTime = Date.now();
    const timeout = parseInt(customTimeout);
    const delay = parseInt(customDelay);
    
    try {
      setIsRunning(true);
      
      const result = await ClientTimeoutHandler.executeWithTimeout(
        () => new Promise(resolve => setTimeout(resolve, delay)),
        timeout,
        `Basic timeout test (${delay}ms delay, ${timeout}ms timeout)`
      );
      
      addTestResult({
        testName: 'Basic Timeout Test',
        status: 'success',
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      addTestResult({
        testName: 'Basic Timeout Test',
        status: error.message?.includes('timeout') ? 'timeout' : 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  }, [customTimeout, customDelay, addTestResult]);

  const runFetchTimeoutTest = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setIsRunning(true);
      
      // Test with a slow endpoint (httpbin delay)
      const fetchWithTimeout = ClientTimeoutHandler.createFetchWithTimeout(3000);
      const response = await fetchWithTimeout('https://httpbin.org/delay/5');
      
      addTestResult({
        testName: 'Fetch Timeout Test',
        status: 'success',
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      addTestResult({
        testName: 'Fetch Timeout Test',
        status: error.message?.includes('timeout') ? 'timeout' : 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  }, [addTestResult]);

  const runSupabaseTimeoutTest = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setIsRunning(true);
      
      // Test Supabase query with timeout
      const result = await ClientTimeoutHandler.executeWithTimeout(
        () => supabase.from('patients').select('*').limit(1),
        2000,
        'Supabase query test'
      );
      
      addTestResult({
        testName: 'Supabase Timeout Test',
        status: 'success',
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      addTestResult({
        testName: 'Supabase Timeout Test',
        status: error.message?.includes('timeout') ? 'timeout' : 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  }, [addTestResult]);

  const runUITimeoutTest = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setIsRunning(true);
      
      await executeWithTimeout(
        () => new Promise(resolve => setTimeout(resolve, parseInt(customDelay))),
        {
          timeout: parseInt(customTimeout),
          description: 'UI Timeout Test',
          showProgress: true,
          retries: 1
        }
      );
      
      addTestResult({
        testName: 'UI Timeout Test',
        status: 'success',
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      addTestResult({
        testName: 'UI Timeout Test',
        status: error.message?.includes('timeout') ? 'timeout' : 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  }, [executeWithTimeout, customTimeout, customDelay, addTestResult]);

  const runStressTest = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setIsRunning(true);
      
      // Run multiple concurrent operations
      const promises = Array.from({ length: 10 }, (_, i) => 
        ClientTimeoutHandler.executeWithTimeout(
          () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)),
          3000,
          `Stress test operation ${i + 1}`
        )
      );
      
      await Promise.allSettled(promises);
      
      addTestResult({
        testName: 'Stress Test (10 concurrent)',
        status: 'success',
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      addTestResult({
        testName: 'Stress Test (10 concurrent)',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  }, [addTestResult]);

  const clearResults = useCallback(() => {
    setTestResults([]);
    ClientTimeoutHandler.clearStats();
  }, []);

  const abortAllOperations = useCallback(() => {
    ClientTimeoutHandler.abortAllOperations();
    UITimeoutManager.abortAllUIOperations();
    setIsRunning(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timeout Debug Center</h1>
          <p className="text-muted-foreground mt-2">
            Test and debug client-side timeout handling across different scenarios
          </p>
        </div>
        <TimeoutMonitor showDetails={true} />
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tests">Timeout Tests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    value={customTimeout}
                    onChange={(e) => setCustomTimeout(e.target.value)}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="delay">Delay (ms)</Label>
                  <Input
                    id="delay"
                    value={customDelay}
                    onChange={(e) => setCustomDelay(e.target.value)}
                    placeholder="3000"
                  />
                </div>
                <div>
                  <Label htmlFor="preset">Preset</Label>
                  <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ui_interaction">UI Interaction</SelectItem>
                      <SelectItem value="database_query">Database Query</SelectItem>
                      <SelectItem value="api_call">API Call</SelectItem>
                      <SelectItem value="file_upload">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Timeout</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test basic promise timeout with configurable delay
                </p>
                <Button 
                  onClick={runBasicTimeoutTest} 
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Basic Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fetch Timeout</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test HTTP request timeout with external API
                </p>
                <Button 
                  onClick={runFetchTimeoutTest} 
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Fetch Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supabase Timeout</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test database query timeout with Supabase
                </p>
                <Button 
                  onClick={runSupabaseTimeoutTest} 
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run DB Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">UI Timeout</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test UI operation timeout with progress feedback
                </p>
                <Button 
                  onClick={runUITimeoutTest} 
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run UI Test
                </Button>
                {isLoading && (
                  <div className="mt-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.toFixed(0)}% complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stress Test</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Test multiple concurrent timeout operations
                </p>
                <Button 
                  onClick={runStressTest} 
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Stress Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Control Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={abortAllOperations} 
                  variant="destructive"
                  className="w-full"
                  disabled={!isRunning}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Abort All
                </Button>
                <Button 
                  onClick={clearResults} 
                  variant="outline"
                  className="w-full"
                >
                  Clear Results
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Status */}
          {(isRunning || error) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isRunning && "Test is currently running..."}
                {error && `Error: ${error}`}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results ({testResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No test results yet. Run some tests to see results here.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.testName}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        <Badge variant="outline">
                          {result.duration}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeout Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-data">Test Data (JSON)</Label>
                <Textarea
                  id="test-data"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder='{ "custom": "test data" }'
                  rows={4}
                />
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This page is for debugging timeout handling. In production, these controls should be removed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}