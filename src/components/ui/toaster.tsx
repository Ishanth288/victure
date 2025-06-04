import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      richColors={false}
      closeButton={true}
      duration={4000}
      visibleToasts={2}
      className="z-50"
      gap={12}
      expand={false}
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
