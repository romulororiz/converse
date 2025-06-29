import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Image,
	Switch,
	Alert,
	ActivityIndicator,
	SafeAreaView,
	StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '../utils/colors';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { PremiumPaywallDrawer } from '../components/PremiumPaywallDrawer';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ElevenLabsTest } from '../components/ElevenLabsTest';
import { useTheme } from '../contexts/ThemeContext';
import {
	NotificationService,
	NotificationSettings,
} from '../services/notifications';

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

export default function ProfileScreen() {
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [imageLoading, setImageLoading] = useState(false);
	const [profile, setProfile] = useState(null);
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>({
			enabled: true,
			readingReminders: true,
			newBooks: true,
			chatResponses: true,
			achievements: true,
		});
	const [preferences, setPreferences] = useState({
		notifications: true,
		darkMode: false,
		emailUpdates: true,
		readingGoals: true,
	});
	const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
	const navigation = useNavigation<NavigationProp>();
	const { theme, toggleTheme, isDark } = useTheme();

	// Get current colors based on theme
	const currentColors = colors[theme];

	useEffect(() => {
		loadProfile();
		loadNotificationSettings();
	}, []);

	// Update preferences when theme changes
	useEffect(() => {
		handlePreferenceChange('darkMode', isDark);
	}, [isDark]);

	const loadProfile = async () => {
		try {
			setLoading(true);
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) throw new Error('No user found');

			const { data: profile, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();

			if (error) throw error;

			setProfile(profile);
			if (profile.preferences) {
				setPreferences(prev => ({
					...prev,
					...profile.preferences,
				}));
			}
		} catch (error) {
			console.error('Error loading profile:', error);
			Alert.alert('Error', 'Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const loadNotificationSettings = async () => {
		try {
			const settings = await NotificationService.getNotificationSettings();
			setNotificationSettings(settings);
		} catch (error) {
			console.error('Error loading notification settings:', error);
		}
	};

	const handlePreferenceChange = async (key, value) => {
		try {
			const newPreferences = {
				...preferences,
				[key]: value,
			};
			setPreferences(newPreferences);

			// Handle special cases
			if (key === 'darkMode') {
				// Theme is handled by ThemeContext
				return;
			}

			if (key === 'notifications') {
				if (value) {
					const hasPermission = await NotificationService.requestPermissions();
					if (!hasPermission) {
						Alert.alert(
							'Permission Required',
							'Please enable notifications in your device settings to receive push notifications.',
							[{ text: 'OK' }]
						);
						// Revert the change if permission denied
						setPreferences(prev => ({ ...prev, notifications: false }));
						return;
					}
					// Get and save push token
					const token = await NotificationService.getExpoPushToken();
					if (token && profile?.id) {
						await NotificationService.saveTokenToServer(token, profile.id);
					}
				} else {
					// Disable notifications
					await NotificationService.cancelAllNotifications();
				}
			}

			const { error } = await supabase
				.from('profiles')
				.update({ preferences: newPreferences })
				.eq('id', profile.id);

			if (error) throw error;
		} catch (error) {
			console.error('Error updating preferences:', error);
			Alert.alert('Error', 'Failed to update preferences');
		}
	};

	const handleNotificationSettingChange = async (
		key: keyof NotificationSettings,
		value: boolean
	) => {
		try {
			const newSettings = {
				...notificationSettings,
				[key]: value,
			};
			setNotificationSettings(newSettings);
			await NotificationService.updateNotificationSettings(newSettings);
		} catch (error) {
			console.error('Error updating notification settings:', error);
			Alert.alert('Error', 'Failed to update notification settings');
		}
	};

	const pickImage = async () => {
		try {
			// Request permissions
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert(
					'Permission needed',
					'Sorry, we need camera roll permissions to upload your profile picture.'
				);
				return;
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]) {
				await uploadImage(result.assets[0].uri);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Failed to pick image');
		}
	};

	const uploadImage = async uri => {
		try {
			setUploading(true);
			setImageLoading(true);
			console.log('Starting image upload from URI:', uri);

			// Get file info to validate
			const fileInfo = await FileSystem.getInfoAsync(uri);
			console.log('File info:', fileInfo);

			if (!fileInfo.exists) {
				throw new Error('File does not exist');
			}

			if (fileInfo.size === 0) {
				throw new Error('File is empty');
			}

			// Create a unique filename with user ID as folder
			const fileExtension = uri.split('.').pop() || 'jpg';
			const fileName = `${profile.id}/avatar-${Date.now()}.${fileExtension}`;

			console.log('Uploading file:', fileName);

			// Read the file as base64
			const base64 = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			console.log('File read as base64, length:', base64.length);

			if (base64.length === 0) {
				throw new Error('Failed to read file as base64');
			}

			// Convert base64 to ArrayBuffer (this is the key fix!)
			const binaryString = atob(base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			console.log('Converted to bytes array, length:', bytes.length);

			// Upload using Supabase storage with ArrayBuffer
			const { data, error } = await supabase.storage
				.from('avatars')
				.upload(fileName, bytes.buffer, {
					cacheControl: '3600',
					upsert: false,
					contentType: `image/${fileExtension}`,
				});

			if (error) {
				console.error('Supabase upload error:', error);
				throw new Error(error.message);
			}

			console.log('Upload successful, data:', data);

			// Get the public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from('avatars').getPublicUrl(fileName);

			console.log('Generated public URL:', publicUrl);

			// Update profile with new avatar URL (store clean URL without timestamp)
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ avatar_url: publicUrl })
				.eq('id', profile.id);

			if (updateError) {
				console.error('Profile update error:', updateError);
				throw updateError;
			}

			// Update local state immediately with a cache-busting timestamp
			const finalUrl = `${publicUrl}?t=${Date.now()}`;
			setProfile(prev => ({
				...prev,
				avatar_url: finalUrl,
			}));
		} catch (error) {
			console.error('Error uploading image:', error);

			// Provide more specific error messages
			if (error.message?.includes('Bucket not found')) {
				Alert.alert(
					'Storage Setup Required',
					'Please create the "avatars" bucket in your Supabase dashboard:\n\n1. Go to Storage in your Supabase dashboard\n2. Click "Create a new bucket"\n3. Name it "avatars"\n4. Make it public\n5. Set file size limit to 50MB\n6. Allow image/* MIME types',
					[{ text: 'OK' }]
				);
			} else if (error.message?.includes('empty')) {
				Alert.alert(
					'Error',
					'The selected image appears to be empty or corrupted. Please try selecting a different image.'
				);
			} else {
				Alert.alert('Error', 'Failed to upload image: ' + error.message);
			}
		} finally {
			setUploading(false);
			setImageLoading(false);
		}
	};

	const handleSignOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			// Navigation will be handled by the auth listener
		} catch (error) {
			console.error('Error signing out:', error);
			Alert.alert('Error', 'Failed to sign out');
		}
	};

	const navigateToAccountSettings = () => {
		navigation.navigate('AccountSettings');
	};

	const handleGetFullAccess = () => {
		setShowPremiumPaywall(true);
	};

	const handlePremiumPurchase = plan => {
		console.log('Premium purchase:', plan);
		// Implement premium purchase logic here
		setShowPremiumPaywall(false);
		Alert.alert('Success', 'Premium features activated!');
	};

	const handlePremiumRestore = () => {
		console.log('Restoring premium purchase');
		// Implement restore logic here
		setShowPremiumPaywall(false);
		Alert.alert('Success', 'Premium features restored!');
	};

	const handlePrivacyPolicy = () => {
		// Navigate to privacy policy or open web view
		Alert.alert('Privacy Policy', 'Privacy policy would open here');
	};

	const handleImageLoadStart = () => {
		setImageLoading(true);
	};

	const handleImageLoadEnd = () => {
		setImageLoading(false);
	};

	if (loading) {
		return (
			<View
				style={[
					styles.loadingContainer,
					{ backgroundColor: currentColors.background },
				]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>
				<ActivityIndicator size="large" color={currentColors.primary} />
				<Text
					style={[styles.loadingText, { color: currentColors.mutedForeground }]}
				>
					Loading profile...
				</Text>
			</View>
		);
	}

	return (
		<SafeAreaView
			style={[styles.safeArea, { backgroundColor: currentColors.background }]}
		>
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor={currentColors.background}
			/>
			<ScrollView style={styles.container}>
				<View style={[styles.header, { backgroundColor: currentColors.card }]}>
					<View style={styles.profileSection}>
						<View style={styles.avatarContainer}>
							{profile?.avatar_url ? (
								<View style={styles.avatarWrapper}>
									{imageLoading && (
										<Animated.View
											entering={FadeIn}
											exiting={FadeOut}
											style={styles.skeletonOverlay}
										>
											<SkeletonLoader
												width={140}
												height={140}
												borderRadius={70}
											/>
										</Animated.View>
									)}
									<Image
										source={{
											uri: profile.avatar_url,
											cache: 'reload',
										}}
										style={styles.avatar}
										onLoadStart={handleImageLoadStart}
										onLoadEnd={handleImageLoadEnd}
										onError={error => {
											console.error('Image loading error:', error);
											console.log('Failed URL:', profile.avatar_url);
											setImageLoading(false);
										}}
									/>
								</View>
							) : (
								<View
									style={[
										styles.avatarPlaceholder,
										{ backgroundColor: currentColors.primary },
									]}
								>
									<Text
										style={[
											styles.avatarText,
											{ color: currentColors.primaryForeground },
										]}
									>
										{profile?.full_name?.[0]?.toUpperCase() || '?'}
									</Text>
								</View>
							)}
							<TouchableOpacity
								style={[
									styles.editAvatarButton,
									{ backgroundColor: currentColors.primary },
								]}
								onPress={pickImage}
								disabled={uploading}
							>
								{uploading ? (
									<ActivityIndicator
										size={16}
										color={currentColors.primaryForeground}
									/>
								) : (
									<Ionicons
										name="camera-outline"
										size={20}
										color={currentColors.primaryForeground}
									/>
								)}
							</TouchableOpacity>
						</View>
						<Text style={[styles.name, { color: currentColors.foreground }]}>
							{profile?.full_name || 'Anonymous'}
						</Text>
						<Text
							style={[styles.email, { color: currentColors.mutedForeground }]}
						>
							{profile?.email}
						</Text>
					</View>
				</View>

				<View style={[styles.section, { backgroundColor: currentColors.card }]}>
					<Text
						style={[
							styles.sectionTitle,
							{ color: currentColors.mutedForeground },
						]}
					>
						App Preferences
					</Text>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name="notifications-outline"
								size={24}
								color={currentColors.foreground}
							/>
							<Text
								style={[
									styles.preferenceText,
									{ color: currentColors.foreground },
								]}
							>
								Push Notifications
							</Text>
						</View>
						<Switch
							value={preferences.notifications}
							onValueChange={value =>
								handlePreferenceChange('notifications', value)
							}
							trackColor={{
								false: currentColors.border,
								true: currentColors.primary,
							}}
							thumbColor={currentColors.background}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name="moon-outline"
								size={24}
								color={currentColors.foreground}
							/>
							<Text
								style={[
									styles.preferenceText,
									{ color: currentColors.foreground },
								]}
							>
								Dark Mode
							</Text>
						</View>
						<Switch
							value={isDark}
							onValueChange={toggleTheme}
							trackColor={{
								false: currentColors.border,
								true: currentColors.primary,
							}}
							thumbColor={currentColors.background}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name="mail-outline"
								size={24}
								color={currentColors.foreground}
							/>
							<Text
								style={[
									styles.preferenceText,
									{ color: currentColors.foreground },
								]}
							>
								Email Updates
							</Text>
						</View>
						<Switch
							value={preferences.emailUpdates}
							onValueChange={value =>
								handlePreferenceChange('emailUpdates', value)
							}
							trackColor={{
								false: currentColors.border,
								true: currentColors.primary,
							}}
							thumbColor={currentColors.background}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name="trophy-outline"
								size={24}
								color={currentColors.foreground}
							/>
							<Text
								style={[
									styles.preferenceText,
									{ color: currentColors.foreground },
								]}
							>
								Reading Goals
							</Text>
						</View>
						<Switch
							value={preferences.readingGoals}
							onValueChange={value =>
								handlePreferenceChange('readingGoals', value)
							}
							trackColor={{
								false: currentColors.border,
								true: currentColors.primary,
							}}
							thumbColor={currentColors.background}
						/>
					</View>
				</View>

				{preferences.notifications && (
					<View
						style={[styles.section, { backgroundColor: currentColors.card }]}
					>
						<Text
							style={[
								styles.sectionTitle,
								{ color: currentColors.mutedForeground },
							]}
						>
							Notification Settings
						</Text>

						<View style={styles.preferenceItem}>
							<View style={styles.preferenceInfo}>
								<Ionicons
									name="book-outline"
									size={24}
									color={currentColors.foreground}
								/>
								<Text
									style={[
										styles.preferenceText,
										{ color: currentColors.foreground },
									]}
								>
									Reading Reminders
								</Text>
							</View>
							<Switch
								value={notificationSettings.readingReminders}
								onValueChange={value =>
									handleNotificationSettingChange('readingReminders', value)
								}
								trackColor={{
									false: currentColors.border,
									true: currentColors.primary,
								}}
								thumbColor={currentColors.background}
							/>
						</View>

						<View style={styles.preferenceItem}>
							<View style={styles.preferenceInfo}>
								<Ionicons
									name="add-circle-outline"
									size={24}
									color={currentColors.foreground}
								/>
								<Text
									style={[
										styles.preferenceText,
										{ color: currentColors.foreground },
									]}
								>
									New Books
								</Text>
							</View>
							<Switch
								value={notificationSettings.newBooks}
								onValueChange={value =>
									handleNotificationSettingChange('newBooks', value)
								}
								trackColor={{
									false: currentColors.border,
									true: currentColors.primary,
								}}
								thumbColor={currentColors.background}
							/>
						</View>
						<View style={styles.preferenceItem}>
							<View style={styles.preferenceInfo}>
								<Ionicons
									name="star-outline"
									size={24}
									color={currentColors.foreground}
								/>
								<Text
									style={[
										styles.preferenceText,
										{ color: currentColors.foreground },
									]}
								>
									Achievements
								</Text>
							</View>
							<Switch
								value={notificationSettings.achievements}
								onValueChange={value =>
									handleNotificationSettingChange('achievements', value)
								}
								trackColor={{
									false: currentColors.border,
									true: currentColors.primary,
								}}
								thumbColor={currentColors.background}
							/>
						</View>
					</View>
				)}

				<View style={[styles.section, { backgroundColor: currentColors.card }]}>
					<TouchableOpacity
						style={styles.menuItem}
						onPress={navigateToAccountSettings}
					>
						<View style={styles.menuInfo}>
							<Ionicons
								name="settings-outline"
								size={24}
								color={currentColors.foreground}
							/>
							<Text
								style={[styles.menuText, { color: currentColors.foreground }]}
							>
								Account Settings
							</Text>
						</View>
						<Ionicons
							name="chevron-forward"
							size={24}
							color={currentColors.mutedForeground}
						/>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={[
						styles.premiumButton,
						{ backgroundColor: currentColors.primary },
					]}
					onPress={handleGetFullAccess}
				>
					<View style={styles.premiumButtonContent}>
						<Text
							style={[
								styles.premiumButtonText,
								{ color: currentColors.primaryForeground },
							]}
						>
							Get Full Access
						</Text>
					</View>
				</TouchableOpacity>
			</ScrollView>

			<PremiumPaywallDrawer
				visible={showPremiumPaywall}
				onClose={() => setShowPremiumPaywall(false)}
				onPurchase={handlePremiumPurchase}
				onRestore={handlePremiumRestore}
				onPrivacyPolicy={handlePrivacyPolicy}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 16,
	},
	header: {
		padding: 20,
		paddingTop: 20,
	},
	profileSection: {
		alignItems: 'center',
	},
	avatarContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	avatarWrapper: {
		position: 'relative',
	},
	skeletonOverlay: {
		position: 'absolute',
		top: 20,
		left: 0,
		zIndex: 1,
	},
	avatar: {
		width: 140,
		height: 140,
		borderRadius: 70,
		marginTop: 20,
		marginBottom: -10,
	},
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20,
		marginBottom: -10,
	},
	avatarText: {
		fontSize: 36,
		fontWeight: 'bold',
	},
	editAvatarButton: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: 'white',
	},
	name: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	email: {
		fontSize: 16,
	},
	section: {
		marginTop: 20,
		paddingVertical: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	preferenceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	preferenceInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	preferenceText: {
		fontSize: 16,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	menuInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	menuText: {
		fontSize: 16,
	},
	premiumButton: {
		marginHorizontal: 20,
		marginTop: 40,
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 30,
	},
	premiumButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	premiumButtonText: {
		fontSize: 18,
		fontWeight: '600',
	},
});
