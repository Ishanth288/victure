
import React from 'react';

interface ConnectionErrorBoundaryProps {
  children: React.ReactNode;
}

interface ConnectionErrorBoundaryState {
  hasError: boolean;
}

export class ConnectionErrorBoundary extends React.Component<ConnectionErrorBoundaryProps, ConnectionErrorBoundaryState> {
  constructor(props: ConnectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ConnectionErrorBoundaryState {
    console.error('ConnectionErrorBoundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ConnectionErrorBoundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
            <p className="mb-4">There was a problem connecting to the service.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
