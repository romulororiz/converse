import { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      {children}
    </>
  );
} 