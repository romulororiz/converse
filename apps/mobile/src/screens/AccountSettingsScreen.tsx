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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { updateUserProfile } from '../services/profile';

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

		if (newPassword !== confirmPassword) {
			Alert.alert('Error', 'New passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			Alert.alert('Error', 'New password must be at least 6 characters');
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
	}: {
		label: string;
		value: string;
		onChangeText: (text: string) => void;
		placeholder: string;
		multiline?: boolean;
		required?: boolean;
		secureTextEntry?: boolean;
	}) => (
		<View style={styles.fieldContainer}>
			<View style={styles.fieldHeader}>
				<Text style={styles.fieldLabel}>{label}</Text>
				{required && <Text style={styles.required}>*</Text>}
			</View>
			<TextInput
				style={[styles.textInput, multiline && styles.multilineInput]}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.light.mutedForeground}
				multiline={multiline}
				numberOfLines={multiline ? 3 : 1}
				textAlignVertical={multiline ? 'top' : 'center'}
				secureTextEntry={secureTextEntry}
			/>
		</View>
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.container}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Ionicons
							name='arrow-back'
							size={24}
							color={colors.light.foreground}
						/>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Account Settings</Text>
					<View style={styles.headerRight} />
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					{/* Edit Profile Section */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<View style={styles.sectionTitleContainer}>
								<Ionicons
									name='person-outline'
									size={20}
									color={colors.light.primary}
								/>
								<Text style={styles.sectionTitle}>Profile Information</Text>
							</View>
							<TouchableOpacity
								style={styles.editButton}
								onPress={() => setEditingProfile(!editingProfile)}
								disabled={loading}
							>
								<Text style={styles.editButtonText}>
									{editingProfile ? 'Cancel' : 'Edit'}
								</Text>
							</TouchableOpacity>
						</View>

						{editingProfile ? (
							<View style={styles.editForm}>
								<ProfileField
									label='Full Name'
									value={fullName}
									onChangeText={setFullName}
									placeholder='Enter your full name'
									required
								/>

								<ProfileField
									label='Bio'
									value={bio}
									onChangeText={setBio}
									placeholder='Tell us about yourself...'
									multiline
								/>

								<ProfileField
									label='Reading Preferences'
									value={readingPreferences}
									onChangeText={setReadingPreferences}
									placeholder='e.g., Fiction, Non-fiction, Mystery...'
									multiline
								/>

								<ProfileField
									label='Favorite Genres'
									value={favoriteGenres}
									onChangeText={setFavoriteGenres}
									placeholder='e.g., Science Fiction, Romance, Thriller...'
									multiline
								/>

								<ProfileField
									label='Reading Goals'
									value={readingGoals}
									onChangeText={setReadingGoals}
									placeholder='e.g., Read 20 books this year...'
									multiline
								/>

								<TouchableOpacity
									style={[
										styles.saveButton,
										saving && styles.saveButtonDisabled,
									]}
									onPress={handleSaveProfile}
									disabled={saving}
								>
									<Text style={styles.saveButtonText}>
										{saving ? 'Saving...' : 'Save Changes'}
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<View style={styles.profileDisplay}>
								<View style={styles.profileRow}>
									<Text style={styles.profileLabel}>Full Name</Text>
									<Text style={styles.profileValue}>
										{fullName || 'Not set'}
									</Text>
								</View>

								{bio && (
									<View style={styles.profileRow}>
										<Text style={styles.profileLabel}>Bio</Text>
										<Text style={styles.profileValue}>{bio}</Text>
									</View>
								)}

								{readingPreferences && (
									<View style={styles.profileRow}>
										<Text style={styles.profileLabel}>Reading Preferences</Text>
										<Text style={styles.profileValue}>
											{readingPreferences}
										</Text>
									</View>
								)}

								{favoriteGenres && (
									<View style={styles.profileRow}>
										<Text style={styles.profileLabel}>Favorite Genres</Text>
										<Text style={styles.profileValue}>{favoriteGenres}</Text>
									</View>
								)}

								{readingGoals && (
									<View style={styles.profileRow}>
										<Text style={styles.profileLabel}>Reading Goals</Text>
										<Text style={styles.profileValue}>{readingGoals}</Text>
									</View>
								)}
							</View>
						)}
					</View>

					{/* Change Password Section */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<View style={styles.sectionTitleContainer}>
								<Ionicons
									name='lock-closed-outline'
									size={20}
									color={colors.light.primary}
								/>
								<Text style={styles.sectionTitle}>Security</Text>
							</View>
							<TouchableOpacity
								style={styles.editButton}
								onPress={() => setChangingPassword(!changingPassword)}
								disabled={loading}
							>
								<Text style={styles.editButtonText}>
									{changingPassword ? 'Cancel' : 'Change Password'}
								</Text>
							</TouchableOpacity>
						</View>

						{changingPassword && (
							<View style={styles.passwordForm}>
								<ProfileField
									label='Current Password'
									value={currentPassword}
									onChangeText={setCurrentPassword}
									placeholder='Enter current password'
									required
									secureTextEntry
								/>

								<ProfileField
									label='New Password'
									value={newPassword}
									onChangeText={setNewPassword}
									placeholder='Enter new password'
									required
									secureTextEntry
								/>

								<ProfileField
									label='Confirm New Password'
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									placeholder='Confirm new password'
									required
									secureTextEntry
								/>

								<TouchableOpacity
									style={[
										styles.saveButton,
										saving && styles.saveButtonDisabled,
									]}
									onPress={handleChangePassword}
									disabled={saving}
								>
									<Text style={styles.saveButtonText}>
										{saving ? 'Updating...' : 'Update Password'}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>

					{/* Sign Out Section */}
					<View style={styles.signOutSection}>
						<TouchableOpacity
							style={styles.signOutButton}
							onPress={handleSignOut}
							disabled={saving}
						>
							<Ionicons
								name='log-out-outline'
								size={20}
								color={colors.light.destructive}
							/>
							<Text style={styles.signOutText}>Sign Out</Text>
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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		paddingTop: 20,
		backgroundColor: colors.light.cardForeground,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.accentForeground,
	},
	headerRight: {
		width: 32,
	},
	content: {
		flex: 1,
	},
	section: {
		backgroundColor: colors.light.card,
		marginTop: 20,
		marginHorizontal: 20,
		borderRadius: 12,
		padding: 20,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sectionTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
	},
	editButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		backgroundColor: colors.light.primary + '10',
	},
	editButtonText: {
		fontSize: 14,
		color: colors.light.primary,
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
		marginTop: 4,
		fontSize: 14,
		fontWeight: '500',
		color: colors.light.foreground,
	},
	required: {
		color: colors.light.destructive,
		fontSize: 14,
		fontWeight: '500',
	},
	textInput: {
		borderWidth: 1,
		borderColor: colors.light.border,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: colors.light.foreground,
		backgroundColor: colors.light.background,
	},
	multilineInput: {
		paddingTop: 12,
		paddingBottom: 12,
		minHeight: 80,
	},
	saveButton: {
		backgroundColor: colors.light.primary,
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
		color: colors.light.primaryForeground,
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
		color: colors.light.mutedForeground,
		textTransform: 'uppercase',
		marginTop: 10,
	},
	profileValue: {
		fontSize: 16,
		color: colors.light.foreground,
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
		backgroundColor: colors.light.destructive + '10',
		borderWidth: 1,
		borderColor: colors.light.destructive + '40',
	},
	signOutText: {
		fontSize: 16,
		color: colors.light.destructive,
		fontWeight: '600',
	},
});
