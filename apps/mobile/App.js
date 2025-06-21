import 'react-native-url-polyfill/auto';
import { AuthProvider } from './src/components/AuthProvider';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
	return (
		<AuthProvider>
			<AppNavigator />
		</AuthProvider>
	);
}
