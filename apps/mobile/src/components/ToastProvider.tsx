import React, { ReactNode } from 'react';
import ToastManager from 'toastify-react-native';

export function ToastProvider({ children }: { children: ReactNode }) {
	return (
		<>
			{children}
			<ToastManager
				theme="light"
				position="top"
				duration={3000}
				showCloseIcon={true}
				showProgressBar={true}
				animationStyle="fade"
				iconFamily="Ionicons"
			/>
		</>
	);
}
