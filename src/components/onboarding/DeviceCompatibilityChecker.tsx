
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Camera, Mic, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface CompatibilityStatus {
  camera: boolean | null;
  microphone: boolean | null;
  connectivity: boolean | null;
  browser: boolean;
  webRTC: boolean;
  screen: boolean;
}

interface DeviceCompatibilityCheckerProps {
  onComplete: (status: CompatibilityStatus) => void;
  onCancel: () => void;
}

export function DeviceCompatibilityChecker({ onComplete, onCancel }: DeviceCompatibilityCheckerProps) {
  const [status, setStatus] = useState<CompatibilityStatus>({
    camera: null,
    microphone: null,
    connectivity: null,
    browser: false,
    webRTC: false,
    screen: false,
  });
  
  const [checking, setChecking] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('Initializing checks...');

  // Check browser compatibility
  useEffect(() => {
    setCurrentTest('Checking browser compatibility...');
    const isCompatibleBrowser = 
      typeof window !== 'undefined' && 
      (
        'chrome' in window || 
        'safari' in window || 
        'firefox' in window || 
        'edge' in window
      );
    
    setStatus(prev => ({ ...prev, browser: isCompatibleBrowser }));
    setProgress(16);
  }, []);

  // Check WebRTC support
  useEffect(() => {
    if (status.browser) {
      setCurrentTest('Checking WebRTC support...');
      const hasWebRTC = 
        typeof navigator !== 'undefined' && 
        navigator.mediaDevices && 
        navigator.mediaDevices.getUserMedia;
      
      setStatus(prev => ({ ...prev, webRTC: !!hasWebRTC }));
      setProgress(33);
    }
  }, [status.browser]);
  
  // Check screen compatibility
  useEffect(() => {
    if (status.webRTC) {
      setCurrentTest('Checking screen compatibility...');
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isScreenCompatible = width >= 320 && height >= 480;
      
      setStatus(prev => ({ ...prev, screen: isScreenCompatible }));
      setProgress(50);
    }
  }, [status.webRTC]);

  // Check camera
  useEffect(() => {
    if (status.screen) {
      setCurrentTest('Checking camera access...');
      
      const checkCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setStatus(prev => ({ ...prev, camera: true }));
        } catch (err) {
          console.error('Camera access error:', err);
          setStatus(prev => ({ ...prev, camera: false }));
        }
        setProgress(66);
      };
      
      checkCamera();
    }
  }, [status.screen]);
  
  // Check microphone
  useEffect(() => {
    if (status.camera !== null) {
      setCurrentTest('Checking microphone access...');
      
      const checkMicrophone = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setStatus(prev => ({ ...prev, microphone: true }));
        } catch (err) {
          console.error('Microphone access error:', err);
          setStatus(prev => ({ ...prev, microphone: false }));
        }
        setProgress(83);
      };
      
      checkMicrophone();
    }
  }, [status.camera]);
  
  // Check connectivity
  useEffect(() => {
    if (status.microphone !== null) {
      setCurrentTest('Checking internet connectivity...');
      
      const checkConnectivity = () => {
        const isOnline = navigator.onLine;
        setStatus(prev => ({ ...prev, connectivity: isOnline }));
        setProgress(100);
        setChecking(false);
      };
      
      checkConnectivity();
    }
  }, [status.microphone]);
  
  // Complete check when all tests are done
  useEffect(() => {
    if (
      status.browser !== null &&
      status.webRTC !== null &&
      status.screen !== null &&
      status.camera !== null &&
      status.microphone !== null &&
      status.connectivity !== null
    ) {
      setChecking(false);
    }
  }, [status]);
  
  const getStatusIcon = (value: boolean | null) => {
    if (value === null) return <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />;
    return value ? <CheckCircle className="text-green-500" /> : <AlertCircle className="text-amber-500" />;
  };

  return (
    <Card className="p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-6">Device Compatibility Check</h3>
      
      {checking ? (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">{currentTest}</p>
          <Progress value={progress} className="h-2" />
        </div>
      ) : null}
      
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={18} />
            <span>Internet Connectivity</span>
          </div>
          {getStatusIcon(status.connectivity)}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} />
            <span>Camera Access</span>
          </div>
          {getStatusIcon(status.camera)}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic size={18} />
            <span>Microphone Access</span>
          </div>
          {getStatusIcon(status.microphone)}
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onComplete(status)} 
          disabled={checking}
        >
          Continue
        </Button>
      </div>
    </Card>
  );
}
