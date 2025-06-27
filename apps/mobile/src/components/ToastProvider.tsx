import React, { ReactNode } from 'react';
import { ToastProvider as CustomToastProvider } from './ui/toast';

export function ToastProvider({ children }: { children: ReactNode }) {
	return <CustomToastProvider>{children}</CustomToastProvider>;
}
