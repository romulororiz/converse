import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	TextInput,
	Alert,
	ActivityIndicator,
	SafeAreaView,
	KeyboardAvoidingView,
	Platform,
	StyleProp,
	TextStyle,
	StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { updateUserProfile } from '../services/profile';
import {
	validateProfileUpdate,
	validatePasswordChange,
} from '../utils/validation';

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

export default function AccountSettingsScreen() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [profile, setProfile] = useState(null);
	const [editingProfile, setEditingProfile] = useState(false);
	const [changingPassword, setChangingPassword] = useState(false);

	// Profile form fields
	const [fullName, setFullName] = useState('');
	const [bio, setBio] = useState('');
	const [readingPreferences, setReadingPreferences] = useState('');
	const [favoriteGenres, setFavoriteGenres] = useState('');
	const [readingGoals, setReadingGoals] = useState('');

	// Password form fields
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const navigation = useNavigation<NavigationProp>();
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];

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
			setFullName(profile.full_name || '');
			setBio(profile.bio || '');
			setReadingPreferences(profile.reading_preferences || '');
			setFavoriteGenres(profile.favorite_genres || '');
			setReadingGoals(profile.reading_goals || '');
		} catch (error) {
			console.error('Error loading profile:', error);
			Alert.alert('Error', 'Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const handleSaveProfile = async () => {
		if (!fullName.trim()) {
			Alert.alert('Error', 'Full name is required');
			return;
		}

		// Validate profile data using Zod
		try {
			validateProfileUpdate({
				full_name: fullName,
				bio: bio,
				reading_preferences: readingPreferences,
				favorite_genres: favoriteGenres,
				reading_goals: readingGoals,
			});
		} catch (error) {
			Alert.alert('Validation Error', error.message);
			return;
		}

		setSaving(true);
		try {
			await updateUserProfile({
				full_name: fullName,
				bio: bio,
				reading_preferences: readingPreferences,
				favorite_genres: favoriteGenres,
				reading_goals: readingGoals,
			});
			setEditingProfile(false);
			Alert.alert('Success', 'Profile updated successfully');
		} catch (error) {
			console.error('Error updating profile:', error);
			Alert.alert('Error', 'Failed to update profile');
		} finally {
			setSaving(false);
		}
	};

	const handleChangePassword = async () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			Alert.alert('Error', 'All password fields are required');
			return;
		}

		// Validate password change using Zod
		try {
			validatePasswordChange(currentPassword, newPassword, confirmPassword);
		} catch (error) {
			Alert.alert('Validation Error', error.message);
			return;
		}

		setSaving(true);
		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) throw error;

			setChangingPassword(false);
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			Alert.alert('Success', 'Password updated successfully');
		} catch (error) {
			console.error('Error changing password:', error);
			Alert.alert('Error', 'Failed to update password');
		} finally {
			setSaving(false);
		}
	};

	const handleSignOut = async () => {
		Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Sign Out',
				style: 'destructive',
				onPress: async () => {
					await supabase.auth.signOut();
				},
			},
		]);
	};

	const ProfileField = ({
		label,
		value,
		onChangeText,
		placeholder,
		multiline = false,
		required = false,
		secureTextEntry = false,
		labelStyle = {},
	}: {
		label: string;
		value: string;
		onChangeText: (text: string) => void;
		placeholder: string;
		multiline?: boolean;
		required?: boolean;
		secureTextEntry?: boolean;
		labelStyle?: StyleProp<TextStyle>;
	}) => (
		<View style={styles.fieldContainer}>
			<View style={styles.fieldHeader}>
				<Text
					style={[
						styles.fieldLabel,
						{ color: currentColors.foreground },
						label === 'Full Name' && { marginTop: 10 },
					]}
				>
					{label}
				</Text>
				{required && (
					<Text style={[styles.required, { color: currentColors.destructive }]}>
						*
					</Text>
				)}
			</View>
			<TextInput
				style={[
					styles.textInput,
					{
						borderColor: currentColors.border,
						color: currentColors.foreground,
						backgroundColor: currentColors.background,
					},
					multiline && styles.multilineInput,
					labelStyle,
				]}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={currentColors.mutedForeground}
				multiline={multiline}
				numberOfLines={multiline ? 3 : 1}
				textAlignVertical={multiline ? 'top' : 'center'}
				secureTextEntry={secureTextEntry}
			/>
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView
				style={[styles.safeArea, { backgroundColor: currentColors.background }]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>
				<View
					style={[
						styles.loadingContainer,
						{ backgroundColor: currentColors.background },
					]}
				>
					<ActivityIndicator size="large" color={currentColors.primary} />
				</View>
			</SafeAreaView>
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
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					{/* Edit Profile Section */}
					<View
						style={[styles.section, { backgroundColor: currentColors.card }]}
					>
						<View style={styles.sectionHeader}>
							<View style={styles.sectionTitleContainer}>
								<Ionicons
									name="person-outline"
									size={24}
									color={currentColors.primary}
								/>
								<Text
									style={[
										styles.sectionTitle,
										{ color: currentColors.foreground },
									]}
								>
									Profile Information
								</Text>
							</View>
							<TouchableOpacity
								style={[
									styles.editButton,
									{ backgroundColor: currentColors.primary + '10' },
								]}
								onPress={() => setEditingProfile(!editingProfile)}
								disabled={loading}
							>
								<Text
									style={[
										styles.editButtonText,
										{ color: currentColors.primary },
									]}
								>
									{editingProfile ? 'Cancel' : 'Edit'}
								</Text>
							</TouchableOpacity>
						</View>

						{editingProfile ? (
							<View style={styles.editForm}>
								<ProfileField
									label="Full Name"
									value={fullName}
									onChangeText={setFullName}
									placeholder="Enter your full name"
									labelStyle={styles.fieldLabelFullName}
									required
								/>

								<ProfileField
									label="Bio"
									value={bio}
									onChangeText={setBio}
									placeholder="Tell us about yourself..."
									multiline
								/>

								<ProfileField
									label="Reading Preferences"
									value={readingPreferences}
									onChangeText={setReadingPreferences}
									placeholder="e.g., Fiction, Non-fiction, Mystery..."
									multiline
								/>

								<ProfileField
									label="Reading Goals"
									value={readingGoals}
									onChangeText={setReadingGoals}
									placeholder="e.g., Read 20 books this year..."
									multiline
								/>

								<TouchableOpacity
									style={[
										styles.saveButton,
										{
											backgroundColor: currentColors.primary,
										},
										saving && { opacity: 0.6 },
									]}
									onPress={handleSaveProfile}
									disabled={saving}
								>
									<Text
										style={[
											styles.saveButtonText,
											{ color: currentColors.primaryForeground },
										]}
									>
										{saving ? 'Saving...' : 'Save Changes'}
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<View style={styles.profileDisplay}>
								<View style={styles.profileRow}>
									<Text
										style={[
											styles.profileLabel,
											{ color: currentColors.mutedForeground },
										]}
									>
										Full Name
									</Text>
									<Text
										style={[
											styles.profileValue,
											{ color: currentColors.foreground },
										]}
									>
										{fullName || 'Not set'}
									</Text>
								</View>

								{bio && (
									<View style={styles.profileRow}>
										<Text
											style={[
												styles.profileLabel,
												{ color: currentColors.mutedForeground },
											]}
										>
											Bio
										</Text>
										<Text
											style={[
												styles.profileValue,
												{ color: currentColors.foreground },
											]}
										>
											{bio}
										</Text>
									</View>
								)}

								{readingPreferences && (
									<View style={styles.profileRow}>
										<Text
											style={[
												styles.profileLabel,
												{ color: currentColors.mutedForeground },
											]}
										>
											Reading Preferences
										</Text>
										<Text
											style={[
												styles.profileValue,
												{ color: currentColors.foreground },
											]}
										>
											{readingPreferences}
										</Text>
									</View>
								)}

								{favoriteGenres && (
									<View style={styles.profileRow}>
										<Text
											style={[
												styles.profileLabel,
												{ color: currentColors.mutedForeground },
											]}
										>
											Favorite Genres
										</Text>
										<Text
											style={[
												styles.profileValue,
												{ color: currentColors.foreground },
											]}
										>
											{favoriteGenres}
										</Text>
									</View>
								)}

								{readingGoals && (
									<View style={styles.profileRow}>
										<Text
											style={[
												styles.profileLabel,
												{ color: currentColors.mutedForeground },
											]}
										>
											Reading Goals
										</Text>
										<Text
											style={[
												styles.profileValue,
												{ color: currentColors.foreground },
											]}
										>
											{readingGoals}
										</Text>
									</View>
								)}
							</View>
						)}
					</View>

					{/* Change Password Section */}
					<View
						style={[styles.section, { backgroundColor: currentColors.card }]}
					>
						<View style={styles.sectionHeader}>
							<View style={styles.sectionTitleContainer}>
								<Ionicons
									name="lock-closed-outline"
									size={24}
									color={currentColors.primary}
								/>
								<Text
									style={[
										styles.sectionTitle,
										{ color: currentColors.foreground },
									]}
								>
									Security
								</Text>
							</View>
							<TouchableOpacity
								style={[
									styles.editButton,
									{ backgroundColor: currentColors.primary + '10' },
								]}
								onPress={() => setChangingPassword(!changingPassword)}
								disabled={loading}
							>
								<Text
									style={[
										styles.editButtonText,
										{ color: currentColors.primary },
									]}
								>
									{changingPassword ? 'Cancel' : 'Change Password'}
								</Text>
							</TouchableOpacity>
						</View>

						{changingPassword && (
							<View style={styles.passwordForm}>
								<ProfileField
									label="Current Password"
									value={currentPassword}
									onChangeText={setCurrentPassword}
									placeholder="Enter current password"
									required
									secureTextEntry
								/>

								<ProfileField
									label="New Password"
									value={newPassword}
									onChangeText={setNewPassword}
									placeholder="Enter new password"
									required
									secureTextEntry
								/>

								<ProfileField
									label="Confirm New Password"
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									placeholder="Confirm new password"
									required
									secureTextEntry
								/>

								<TouchableOpacity
									style={[
										styles.saveButton,
										{
											backgroundColor: currentColors.primary,
										},
										saving && { opacity: 0.6 },
									]}
									onPress={handleChangePassword}
									disabled={saving}
								>
									<Text
										style={[
											styles.saveButtonText,
											{ color: currentColors.primaryForeground },
										]}
									>
										{saving ? 'Updating...' : 'Update Password'}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>

					{/* Sign Out Section */}
					<View style={styles.signOutSection}>
						<TouchableOpacity
							style={[
								styles.signOutButton,
								{
									backgroundColor: currentColors.destructive + '10',
									borderColor: currentColors.destructive + '40',
								},
							]}
							onPress={handleSignOut}
							disabled={saving}
						>
							<Ionicons
								name="log-out-outline"
								size={20}
								color={currentColors.destructive}
							/>
							<Text
								style={[
									styles.signOutText,
									{ color: currentColors.destructive },
								]}
							>
								Sign Out
							</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
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
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		paddingTop: 20,
		borderBottomWidth: 1,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	headerRight: {
		width: 32,
	},
	content: {
		flex: 1,
	},
	section: {
		marginTop: 20,
		marginHorizontal: 20,
		borderRadius: 12,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sectionTitleContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	editButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	editButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	editForm: {
		gap: 20,
	},
	fieldContainer: {
		gap: 8,
	},
	fieldHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	fieldLabelFullName: {
		fontSize: 14,
		fontWeight: '500',
	},
	required: {
		fontSize: 14,
		fontWeight: '500',
	},
	textInput: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
	},
	multilineInput: {
		paddingTop: 12,
		paddingBottom: 12,
		minHeight: 80,
	},
	saveButton: {
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 8,
	},
	saveButtonDisabled: {
		opacity: 0.6,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	profileDisplay: {
		gap: 16,
	},
	profileRow: {
		gap: 4,
	},
	profileLabel: {
		fontSize: 12,
		fontWeight: '500',
		textTransform: 'uppercase',
		marginTop: 10,
	},
	profileValue: {
		fontSize: 16,
		lineHeight: 22,
	},
	passwordForm: {
		gap: 20,
	},
	signOutSection: {
		marginTop: 20,
		marginHorizontal: 20,
		borderRadius: 12,
		padding: 20,
	},
	signOutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 16,
		borderRadius: 8,
		borderWidth: 1,
	},
	signOutText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
