import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      richColors={false}
      closeButton={true}
      duration={3500}
      visibleToasts={5}
      className="z-50"
      gap={4}
      expand={true}
      toastOptions={{
        style: {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
        className: 'group',
        closeButton: true,
      }}
    />
  );
}
