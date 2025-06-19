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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const [preferences, setPreferences] = useState({
		notifications: true,
		darkMode: false,
		emailUpdates: true,
		readingGoals: true,
	});
	const navigation = useNavigation();

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

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<View style={styles.profileSection}>
					<View style={styles.avatarContainer}>
						{profile?.avatar_url ? (
							<Image
								source={{ uri: profile.avatar_url }}
								style={styles.avatar}
							/>
						) : (
							<View style={styles.avatarPlaceholder}>
								<Text style={styles.avatarText}>
									{profile?.full_name?.[0]?.toUpperCase() || '?'}
								</Text>
							</View>
						)}
						<TouchableOpacity style={styles.editAvatarButton}>
							<Ionicons
								name='camera-outline'
								size={20}
								color={colors.light.primaryForeground}
							/>
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
				<Text style={styles.sectionTitle}>Account</Text>
				<TouchableOpacity style={styles.menuItem}>
					<View style={styles.menuInfo}>
						<Ionicons
							name='person-outline'
							size={24}
							color={colors.light.foreground}
						/>
						<Text style={styles.menuText}>Edit Profile</Text>
					</View>
					<Ionicons
						name='chevron-forward'
						size={24}
						color={colors.light.mutedForeground}
					/>
				</TouchableOpacity>

				<TouchableOpacity style={styles.menuItem}>
					<View style={styles.menuInfo}>
						<Ionicons
							name='key-outline'
							size={24}
							color={colors.light.foreground}
						/>
						<Text style={styles.menuText}>Change Password</Text>
					</View>
					<Ionicons
						name='chevron-forward'
						size={24}
						color={colors.light.mutedForeground}
					/>
				</TouchableOpacity>

				<TouchableOpacity style={styles.menuItem}>
					<View style={styles.menuInfo}>
						<Ionicons
							name='shield-outline'
							size={24}
							color={colors.light.foreground}
						/>
						<Text style={styles.menuText}>Privacy Settings</Text>
					</View>
					<Ionicons
						name='chevron-forward'
						size={24}
						color={colors.light.mutedForeground}
					/>
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
				<Ionicons
					name='log-out-outline'
					size={24}
					color={colors.light.destructive}
				/>
				<Text style={styles.signOutText}>Sign Out</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.light.background,
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
		paddingTop: 60,
	},
	profileSection: {
		alignItems: 'center',
	},
	avatarContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
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
	signOutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: 20,
		marginBottom: 40,
		paddingVertical: 12,
	},
	signOutText: {
		fontSize: 16,
		color: colors.light.destructive,
		fontWeight: '600',
	},
});
