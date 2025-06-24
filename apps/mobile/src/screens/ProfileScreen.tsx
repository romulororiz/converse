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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../utils/colors';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { PremiumPaywallDrawer } from '../components/PremiumPaywallDrawer';

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

export default function ProfileScreen() {
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [profile, setProfile] = useState(null);
	const [preferences, setPreferences] = useState({
		notifications: true,
		darkMode: false,
		emailUpdates: true,
		readingGoals: true,
	});
	const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
	const navigation = useNavigation<NavigationProp>();

	useEffect(() => {
		loadProfile();
	}, []);

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

	const handlePreferenceChange = async (key, value) => {
		try {
			const newPreferences = {
				...preferences,
				[key]: value,
			};
			setPreferences(newPreferences);

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

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.container}>
				<View style={styles.header}>
					<View style={styles.profileSection}>
						<View style={styles.avatarContainer}>
							{profile?.avatar_url ? (
								<Image
									source={{
										uri: profile.avatar_url,
										cache: 'reload', // Force reload to avoid caching issues
									}}
									style={styles.avatar}
									onError={error => {
										console.error('Image loading error:', error);
										console.log('Failed URL:', profile.avatar_url);
									}}
								/>
							) : (
								<View style={styles.avatarPlaceholder}>
									<Text style={styles.avatarText}>
										{profile?.full_name?.[0]?.toUpperCase() || '?'}
									</Text>
								</View>
							)}
							<TouchableOpacity
								style={styles.editAvatarButton}
								onPress={pickImage}
								disabled={uploading}
							>
								{uploading ? (
									<ActivityIndicator
										size={16}
										color={colors.light.primaryForeground}
									/>
								) : (
									<Ionicons
										name='camera-outline'
										size={20}
										color={colors.light.primaryForeground}
									/>
								)}
							</TouchableOpacity>
						</View>
						<Text style={styles.name}>{profile?.full_name || 'Anonymous'}</Text>
						<Text style={styles.email}>{profile?.email}</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Reading Preferences</Text>
					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name='notifications-outline'
								size={24}
								color={colors.light.foreground}
							/>
							<Text style={styles.preferenceText}>Push Notifications</Text>
						</View>
						<Switch
							value={preferences.notifications}
							onValueChange={value =>
								handlePreferenceChange('notifications', value)
							}
							trackColor={{
								false: colors.light.border,
								true: colors.light.primary,
							}}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name='moon-outline'
								size={24}
								color={colors.light.foreground}
							/>
							<Text style={styles.preferenceText}>Dark Mode</Text>
						</View>
						<Switch
							value={preferences.darkMode}
							onValueChange={value => handlePreferenceChange('darkMode', value)}
							trackColor={{
								false: colors.light.border,
								true: colors.light.primary,
							}}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name='mail-outline'
								size={24}
								color={colors.light.foreground}
							/>
							<Text style={styles.preferenceText}>Email Updates</Text>
						</View>
						<Switch
							value={preferences.emailUpdates}
							onValueChange={value =>
								handlePreferenceChange('emailUpdates', value)
							}
							trackColor={{
								false: colors.light.border,
								true: colors.light.primary,
							}}
						/>
					</View>

					<View style={styles.preferenceItem}>
						<View style={styles.preferenceInfo}>
							<Ionicons
								name='trophy-outline'
								size={24}
								color={colors.light.foreground}
							/>
							<Text style={styles.preferenceText}>Reading Goals</Text>
						</View>
						<Switch
							value={preferences.readingGoals}
							onValueChange={value =>
								handlePreferenceChange('readingGoals', value)
							}
							trackColor={{
								false: colors.light.border,
								true: colors.light.primary,
							}}
						/>
					</View>
				</View>

				<View style={styles.section}>
					<TouchableOpacity
						style={styles.menuItem}
						onPress={navigateToAccountSettings}
					>
						<View style={styles.menuInfo}>
							<Ionicons
								name='settings-outline'
								size={24}
								color={colors.light.foreground}
							/>
							<Text style={styles.menuText}>Account Settings</Text>
						</View>
						<Ionicons
							name='chevron-forward'
							size={24}
							color={colors.light.mutedForeground}
						/>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.premiumButton}
					onPress={handleGetFullAccess}
				>
					<View style={styles.premiumButtonContent}>
						<Text style={styles.premiumButtonText}>Get Full Access</Text>
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
		backgroundColor: colors.light.background,
	},
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.light.background,
	},
	header: {
		backgroundColor: colors.light.card,
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
	avatar: {
		width: 140,
		height: 140,
		borderRadius: 90,
		marginTop: 20,
		marginBottom: -10,
	},
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: colors.light.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarText: {
		fontSize: 36,
		color: colors.light.primaryForeground,
		fontWeight: 'bold',
	},
	editAvatarButton: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		backgroundColor: colors.light.primary,
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: colors.light.background,
	},
	name: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	email: {
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
	section: {
		backgroundColor: colors.light.card,
		marginTop: 20,
		paddingVertical: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.mutedForeground,
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
		color: colors.light.foreground,
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
		color: colors.light.foreground,
	},
	premiumButton: {
		backgroundColor: colors.light.primary,
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
		color: colors.light.primaryForeground,
	},
});
