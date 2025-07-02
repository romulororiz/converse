import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { signInWithGoogleDirect } from '../../services/googleAuth';
import { useAuth } from '../../components/AuthProvider';
import { validateSignUp } from '../../utils/validation';
import { useTheme } from '../../contexts/ThemeContext';

type AuthNavigationProp = {
	navigate: (screen: 'Login' | 'SignUp' | 'ForgotPassword') => void;
};

export default function SignUpScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [fullName, setFullName] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation<AuthNavigationProp>();
	const { refreshSession } = useAuth();
	const { theme } = useTheme();
	const currentColors = colors[theme];

	const handleSignUp = async () => {
		if (!email || !password || !confirmPassword || !fullName) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		// Validate inputs using Zod
		try {
			validateSignUp(fullName, email, password, confirmPassword);
		} catch (error) {
			Alert.alert('Validation Error', error.message);
			return;
		}

		try {
			setLoading(true);

			// Sign up the user - the database trigger will automatically create the profile
			const { error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName,
					},
				},
			});

			if (signUpError) throw signUpError;

			Alert.alert(
				'Account Created Successfully!',
				'Please check your email and click the confirmation link to verify your account. You can then login with your email and password.',
				[
					{
						text: 'OK',
						onPress: () => navigation.navigate('Login'),
					},
					{
						text: 'Resend Email',
						onPress: async () => {
							try {
								const { error } = await supabase.auth.resend({
									type: 'signup',
									email: email,
								});
								if (error) throw error;
								Alert.alert('Success', 'Confirmation email resent!');
							} catch (error) {
								Alert.alert(
									'Error',
									'Failed to resend email: ' + error.message
								);
							}
						},
					},
				]
			);
		} catch (error) {
			console.error('Signup error:', error);
			Alert.alert('Error', error.message || 'Failed to create account');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignUp = async () => {
		try {
			setLoading(true);
			console.log('Starting Google sign up...');

			const result = await signInWithGoogleDirect();
			console.log('Google sign up result:', result);

			if (!result.success) {
				console.error('Google sign up failed:', result.error);
				Alert.alert(
					'Google Sign Up Failed',
					result.error || 'Unable to sign up with Google. Please try again.'
				);
			} else {
				console.log('Google sign up successful!');
				// Manually refresh the session to trigger navigation
				await refreshSession();
			}
		} catch (error) {
			console.error('Google sign up error:', error);
			Alert.alert('Error', 'An unexpected error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={[styles.container, { backgroundColor: currentColors.background }]}
		>
			<ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{ backgroundColor: currentColors.background },
				]}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: currentColors.foreground }]}>
						Create Account
					</Text>
					<Text
						style={[styles.subtitle, { color: currentColors.mutedForeground }]}
					>
						Join our community of book lovers
					</Text>
				</View>

				<View style={styles.form}>
					<View
						style={[
							styles.inputContainer,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
						]}
					>
						<Ionicons
							name="person-outline"
							size={20}
							color={currentColors.mutedForeground}
							style={styles.inputIcon}
						/>
						<TextInput
							style={[styles.input, { color: currentColors.foreground }]}
							placeholder="Full Name"
							placeholderTextColor={currentColors.mutedForeground}
							value={fullName}
							onChangeText={setFullName}
						/>
					</View>

					<View
						style={[
							styles.inputContainer,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
						]}
					>
						<Ionicons
							name="mail-outline"
							size={20}
							color={currentColors.mutedForeground}
							style={styles.inputIcon}
						/>
						<TextInput
							style={[styles.input, { color: currentColors.foreground }]}
							placeholder="Email"
							placeholderTextColor={currentColors.mutedForeground}
							keyboardType="email-address"
							autoCapitalize="none"
							value={email}
							onChangeText={setEmail}
						/>
					</View>

					<View
						style={[
							styles.inputContainer,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
						]}
					>
						<Ionicons
							name="lock-closed-outline"
							size={20}
							color={currentColors.mutedForeground}
							style={styles.inputIcon}
						/>
						<TextInput
							style={[styles.input, { color: currentColors.foreground }]}
							placeholder="Password"
							placeholderTextColor={currentColors.mutedForeground}
							secureTextEntry={!showPassword}
							value={password}
							onChangeText={setPassword}
						/>
						<TouchableOpacity
							onPress={() => setShowPassword(!showPassword)}
							style={styles.showPasswordButton}
						>
							<Ionicons
								name={showPassword ? 'eye-off-outline' : 'eye-outline'}
								size={20}
								color={currentColors.mutedForeground}
							/>
						</TouchableOpacity>
					</View>

					<View
						style={[
							styles.inputContainer,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
						]}
					>
						<Ionicons
							name="lock-closed-outline"
							size={20}
							color={currentColors.mutedForeground}
							style={styles.inputIcon}
						/>
						<TextInput
							style={[styles.input, { color: currentColors.foreground }]}
							placeholder="Confirm Password"
							placeholderTextColor={currentColors.mutedForeground}
							secureTextEntry={!showConfirmPassword}
							value={confirmPassword}
							onChangeText={setConfirmPassword}
						/>
						<TouchableOpacity
							onPress={() => setShowConfirmPassword(!showConfirmPassword)}
							style={styles.showPasswordButton}
						>
							<Ionicons
								name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
								size={20}
								color={currentColors.mutedForeground}
							/>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[
							styles.button,
							loading && styles.buttonDisabled,
							{ backgroundColor: currentColors.primary },
						]}
						onPress={handleSignUp}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color={currentColors.primaryForeground} />
						) : (
							<Text
								style={[
									styles.buttonText,
									{ color: currentColors.primaryForeground },
								]}
							>
								Create Account
							</Text>
						)}
					</TouchableOpacity>

					<View style={styles.divider}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>or</Text>
						<View style={styles.dividerLine} />
					</View>

					<TouchableOpacity
						style={[
							styles.socialButton,
							loading && styles.buttonDisabled,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
						]}
						onPress={handleGoogleSignUp}
						disabled={loading}
					>
						<Ionicons
							name="logo-google"
							size={20}
							color={currentColors.foreground}
						/>
						<Text
							style={[
								styles.socialButtonText,
								{ color: currentColors.foreground },
							]}
						>
							Continue with Google
						</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Already have an account? </Text>
					<TouchableOpacity onPress={() => navigation.navigate('Login')}>
						<Text style={styles.footerLink}>Sign In</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	scrollContent: {
		flexGrow: 1,
		padding: 20,
		paddingTop: 60,
		justifyContent: 'center',
		minHeight: '100%',
	},
	header: {
		marginBottom: 40,
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
	form: {
		gap: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.light.card,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.light.border,
		paddingHorizontal: 16,
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		height: 50,
		color: colors.light.foreground,
		fontSize: 16,
	},
	showPasswordButton: {
		padding: 8,
	},
	button: {
		backgroundColor: colors.light.primary,
		height: 50,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: colors.light.primaryForeground,
		fontSize: 16,
		fontWeight: '600',
	},
	divider: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: colors.light.border,
	},
	dividerText: {
		color: colors.light.mutedForeground,
		paddingHorizontal: 16,
	},
	socialButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.light.card,
		height: 50,
		borderRadius: 12,
		borderWidth: 1,
		gap: 12,
	},
	socialButtonText: {
		color: colors.light.foreground,
		fontSize: 16,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 32,
	},
	footerText: {
		color: colors.light.mutedForeground,
		fontSize: 14,
	},
	footerLink: {
		color: colors.light.primary,
		fontSize: 14,
		fontWeight: '600',
	},
});
