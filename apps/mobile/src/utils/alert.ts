import { Alert, Platform } from 'react-native';

export const showAlert = (
	title: string,
	message: string,
	buttons?: Array<{
		text: string;
		onPress?: () => void;
		style?: 'default' | 'cancel' | 'destructive';
	}>
) => {
	if (Platform.OS === 'web') {
		// For web, use browser dialogs
		if (buttons && buttons.length > 1) {
			// For confirmation dialogs
			const confirmed = window.confirm(`${title}\n\n${message}`);
			if (confirmed) {
				const confirmButton = buttons.find(
					btn => btn.style === 'destructive' || btn.text === 'Delete'
				);
				confirmButton?.onPress?.();
			} else {
				const cancelButton = buttons.find(btn => btn.style === 'cancel');
				cancelButton?.onPress?.();
			}
		} else {
			// For simple alerts
			window.alert(`${title}\n\n${message}`);
			buttons?.[0]?.onPress?.();
		}
	} else {
		// For native, use React Native Alert
		Alert.alert(title, message, buttons);
	}
};
