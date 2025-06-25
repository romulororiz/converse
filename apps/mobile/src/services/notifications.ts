import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
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
			if (!Device.isDevice) {
				console.log('Must use physical device for Push Notifications');
				return false;
			}

			const { status: existingStatus } =
				await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;

			if (existingStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}

			if (finalStatus !== 'granted') {
				console.log('Failed to get push token for push notification!');
				return false;
			}

			return true;
		} catch (error) {
			console.error('Error requesting notification permissions:', error);
			return false;
		}
	}

	static async getExpoPushToken(): Promise<string | null> {
		try {
			const hasPermission = await this.requestPermissions();
			if (!hasPermission) {
				return null;
			}

			const token = await Notifications.getExpoPushTokenAsync({
				projectId: '90bb907f-379f-4ca6-829a-b0d45fff7d06', // Your Expo project ID
			});

			// Save token to AsyncStorage
			await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);
			return token.data;
		} catch (error) {
			console.error('Error getting push token:', error);
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

	static async cancelAllNotifications(): Promise<void> {
		try {
			await Notifications.cancelAllScheduledNotificationsAsync();
		} catch (error) {
			console.error('Error canceling notifications:', error);
		}
	}

	static async cancelNotification(identifier: string): Promise<void> {
		try {
			await Notifications.cancelScheduledNotificationAsync(identifier);
		} catch (error) {
			console.error('Error canceling notification:', error);
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
				seconds: 1,
				repeats: false,
			}
		);
	}
}
