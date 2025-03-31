
import { useState } from 'react';
import { Camera, ChevronRight, Home, Settings, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SimulationStep {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
  image?: string;
}

interface InstallationSimulatorProps {
  onComplete: () => void;
  onBack: () => void;
}

export function InstallationSimulator({ onComplete, onBack }: InstallationSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  
  const simulationSteps: SimulationStep[] = [
    {
      id: 1,
      title: "Select Installation Location",
      description: "Choose a location with clear view of the area you want to monitor.",
      icon: <Home className="h-8 w-8 text-green-600" />,
      image: "/placeholder.svg",
    },
    {
      id: 2,
      title: "Mount the Camera",
      description: "Attach the mounting bracket securely to the wall or ceiling using the provided screws.",
      icon: <Camera className="h-8 w-8 text-green-600" />,
      image: "/placeholder.svg",
    },
    {
      id: 3,
      title: "Adjust Camera Angle",
      description: "Rotate the camera to cover the desired field of view.",
      icon: <Settings className="h-8 w-8 text-green-600" />,
      image: "/placeholder.svg",
    },
    {
      id: 4,
      title: "Connect to Monitor",
      description: "Connect the camera to your monitoring system or app.",
      icon: <Monitor className="h-8 w-8 text-green-600" />,
      image: "/placeholder.svg",
    }
  ];

  const handleNext = () => {
    if (currentStep < simulationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
    }, 3000);
  };

  const currentStepData = simulationSteps[currentStep];

  return (
    <Card className="max-w-md mx-auto p-6">
      <h3 className="text-xl font-bold mb-4">Virtual Installation Simulator</h3>
      <p className="text-gray-500 text-sm mb-6">Follow these steps to simulate the installation process</p>
      
      <div className="flex items-center mb-8">
        {simulationSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            {index < simulationSteps.length - 1 && (
              <div 
                className={`w-10 h-0.5 ${
                  index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {currentStepData.icon}
          <h4 className="text-lg font-medium">{currentStepData.title}</h4>
        </div>
        <p className="text-gray-600 mb-4">{currentStepData.description}</p>
        
        <div className="bg-gray-100 rounded-lg p-4 aspect-video flex items-center justify-center">
          <div 
            className={`transition-all duration-1000 ease-in-out ${
              isRotating ? 'animate-[spin_3s_linear]' : ''
            }`}
          >
            {currentStep === 2 ? (
              <div className="relative">
                <Camera size={100} className="text-gray-700" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
                  onClick={handleRotate}
                >
                  Rotate Camera
                </Button>
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <div className="text-5xl mb-2">
                  {currentStepData.icon}
                </div>
                <p className="text-sm">Interactive simulation</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="flex items-center gap-1"
        >
          {currentStep < simulationSteps.length - 1 ? 'Next Step' : 'Complete'}
          <ChevronRight size={16} />
        </Button>
      </div>
    </Card>
  );
}
