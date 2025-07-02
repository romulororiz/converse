import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior with platform-specific settings
Notifications.setNotificationHandler({
	handleNotification: async () => {
		return {
			shouldShowAlert: true,
			shouldPlaySound: true,
			shouldSetBadge: false,
			shouldShowBanner: true,
			shouldShowList: true,
		};
	},
});

export interface NotificationSettings {
	enabled: boolean;
	readingReminders: boolean;
	newBooks: boolean;
	chatResponses: boolean;
	achievements: boolean;
}

const NOTIFICATION_TOKEN_KEY = 'notification_token';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export class NotificationService {
	static async requestPermissions(): Promise<boolean> {
		try {
			console.log('Requesting notification permissions...');

			if (!Device.isDevice) {
				console.log('Must use physical device for Push Notifications');
				return false;
			}

			// Check permissions directly without isSupportedAsync
			const { status: existingStatus } =
				await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;

			console.log('Current notification permission status:', existingStatus);

			if (existingStatus !== 'granted') {
				console.log('Requesting notification permissions...');
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
				console.log('New notification permission status:', status);
			}

			if (finalStatus !== 'granted') {
				console.log('Failed to get push token for push notification!');
				return false;
			}

			console.log('Notification permissions granted');
			return true;
		} catch (error) {
			console.error('Error requesting notification permissions:', error);
			return false;
		}
	}

	static async getExpoPushToken(): Promise<string | null> {
		try {
			console.log('Getting Expo push token...');

			const hasPermission = await this.requestPermissions();
			if (!hasPermission) {
				console.log('No notification permission, skipping token generation');
				return null;
			}

			console.log('Getting Expo push token...');

			// Use platform-specific configuration
			const tokenConfig = {
				projectId: 'b99dbb50-1f88-4251-9fe3-48b3534a313f', // Your Expo project ID
			};

			// Add Android-specific configuration
			if (Platform.OS === 'android') {
				tokenConfig['android'] = {
					channelId: 'default',
				};
			}

			console.log('Token config:', tokenConfig);

			const token = await Notifications.getExpoPushTokenAsync(tokenConfig);

			console.log('Push token generated successfully:', token.data);

			// Save token to AsyncStorage
			await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);
			return token.data;
		} catch (error) {
			console.error('Error getting push token:', error);

			// Provide more specific error information
			if (error instanceof Error) {
				if (error.message.includes('FCM')) {
					console.error(
						'Firebase Cloud Messaging error - check your FCM configuration'
					);
				} else if (error.message.includes('project')) {
					console.error(
						'Project ID error - check your Expo project configuration'
					);
				} else if (error.message.includes('permission')) {
					console.error('Permission error - check notification permissions');
				}
			}

			return null;
		}
	}

	static async getStoredToken(): Promise<string | null> {
		try {
			return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
		} catch (error) {
			console.error('Error getting stored token:', error);
			return null;
		}
	}

	static async saveTokenToServer(
		token: string,
		userId: string
	): Promise<boolean> {
		try {
			// TODO: Implement API call to save token to your backend
			// Example:
			// await supabase
			//   .from('user_notifications')
			//   .upsert({ user_id: userId, push_token: token })

			console.log('Token saved to server:', token);
			return true;
		} catch (error) {
			console.error('Error saving token to server:', error);
			return false;
		}
	}

	static async getNotificationSettings(): Promise<NotificationSettings> {
		try {
			const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
			if (settings) {
				return JSON.parse(settings);
			}
		} catch (error) {
			console.error('Error getting notification settings:', error);
		}

		// Default settings
		return {
			enabled: true,
			readingReminders: true,
			newBooks: true,
			chatResponses: true,
			achievements: true,
		};
	}

	static async updateNotificationSettings(
		settings: Partial<NotificationSettings>
	): Promise<void> {
		try {
			const currentSettings = await this.getNotificationSettings();
			const newSettings = { ...currentSettings, ...settings };
			await AsyncStorage.setItem(
				NOTIFICATION_SETTINGS_KEY,
				JSON.stringify(newSettings)
			);
		} catch (error) {
			console.error('Error updating notification settings:', error);
		}
	}

	static async scheduleLocalNotification(
		title: string,
		body: string,
		trigger?: Notifications.NotificationTriggerInput
	): Promise<string | null> {
		try {
			const settings = await this.getNotificationSettings();
			if (!settings.enabled) {
				return null;
			}

			const identifier = await Notifications.scheduleNotificationAsync({
				content: {
					title,
					body,
					sound: true,
				},
				trigger: trigger || null,
			});

			return identifier;
		} catch (error) {
			console.error('Error scheduling notification:', error);
			return null;
		}
	}

	static async cancelNotification(identifier: string): Promise<void> {
		try {
			await Notifications.cancelScheduledNotificationAsync(identifier);
		} catch (error) {
			console.error('Error canceling notification:', error);
		}
	}

	static async cancelAllNotifications(): Promise<void> {
		try {
			await Notifications.cancelAllScheduledNotificationsAsync();
		} catch (error) {
			console.error('Error canceling all notifications:', error);
		}
	}

	static async createNotificationChannel(): Promise<void> {
		if (Platform.OS === 'android') {
			try {
				await Notifications.setNotificationChannelAsync('default', {
					name: 'Default',
					importance: Notifications.AndroidImportance.MAX,
					vibrationPattern: [0, 250, 250, 250],
					lightColor: '#FF231F7C',
					sound: 'default',
				});
				console.log('Android notification channel created');
			} catch (error) {
				console.error('Error creating notification channel:', error);
			}
		}
	}

	// Convenience methods for specific notification types
	static async scheduleReadingReminder(
		hours: number = 24
	): Promise<string | null> {
		const settings = await this.getNotificationSettings();
		if (!settings.readingReminders) {
			return null;
		}

		return this.scheduleLocalNotification(
			'Time to Read! 📚',
			'Your books are waiting for you. Continue your reading journey!',
			{
				type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
				seconds: hours * 3600,
				repeats: false,
			}
		);
	}

	static async scheduleNewBookNotification(
		bookTitle: string
	): Promise<string | null> {
		const settings = await this.getNotificationSettings();
		if (!settings.newBooks) {
			return null;
		}

		return this.scheduleLocalNotification(
			'New Book Available! 🎉',
			`"${bookTitle}" is now available in your library.`,
			{
				type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
				seconds: 1,
				repeats: false,
			}
		);
	}

	static async scheduleChatResponseNotification(
		bookTitle: string
	): Promise<string | null> {
		const settings = await this.getNotificationSettings();
		if (!settings.chatResponses) {
			return null;
		}

		return this.scheduleLocalNotification(
			'New Response! 💬',
			`"${bookTitle}" has responded to your message.`,
			{
				type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
				seconds: 1,
				repeats: false,
			}
		);
	}

	static async scheduleAchievementNotification(
		achievement: string
	): Promise<string | null> {
		const settings = await this.getNotificationSettings();
		if (!settings.achievements) {
			return null;
		}

		return this.scheduleLocalNotification(
			'Achievement Unlocked! 🏆',
			`Congratulations! You've earned: ${achievement}`,
			{
				type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
				seconds: 1,
				repeats: false,
			}
		);
	}
}
