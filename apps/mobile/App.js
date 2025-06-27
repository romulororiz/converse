import React from 'react';
import 'react-native-url-polyfill/auto';
import { AuthProvider } from './src/components/AuthProvider';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { validateApiKeys, logApiKeyStatus } from './src/utils/apiSecurity';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';

// Validate API keys on app startup
const { valid, errors } = validateApiKeys();
if (!valid) {
	console.error('API Key validation failed:', errors);
}
logApiKeyStatus();

export default function App() {
	return (
		<ErrorBoundary>
			<SubscriptionProvider>
				<ThemeProvider>
					<AuthProvider>
						<AppNavigator />
					</AuthProvider>
				</ThemeProvider>
			</SubscriptionProvider>
		</ErrorBoundary>
	);
}
