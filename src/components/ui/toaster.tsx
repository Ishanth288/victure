
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-center"
      richColors={false} // We're handling custom colors ourselves
      closeButton
      duration={5000}
      className="z-50"
      toastOptions={{
        style: {
          background: 'white',
          color: 'black',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      }}
    />
  );
}
