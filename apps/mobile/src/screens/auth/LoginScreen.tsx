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
	StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { signInWithGoogleDirect } from '../../services/googleAuth';
import { useAuth } from '../../components/AuthProvider';
import { validateLogin } from '../../utils/validation';

type AuthNavigationProp = {
	navigate: (screen: 'Login' | 'SignUp' | 'ForgotPassword') => void;
};

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];
	const navigation = useNavigation<AuthNavigationProp>();
	const { refreshSession } = useAuth();

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		// Validate inputs using Zod
		try {
			validateLogin(email, password);
		} catch (error) {
			Alert.alert('Validation Error', error.message);
			return;
		}

		try {
			setLoading(true);
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;

			// Navigation will be handled by the auth listener in AuthProvider
		} catch (error) {
			Alert.alert('Error', error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			setLoading(true);
			console.log('Starting Google login...');

			const result = await signInWithGoogleDirect();
			console.log('Google login result:', result);

			if (!result.success) {
				console.error('Google login failed:', result.error);
				Alert.alert(
					'Google Sign In Failed',
					result.error || 'Unable to sign in with Google. Please try again.'
				);
			} else {
				console.log('Google login successful!');
				// Manually refresh the session to trigger navigation
				await refreshSession();
			}
		} catch (error) {
			console.error('Google login error:', error);
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
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor={currentColors.background}
			/>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: currentColors.foreground }]}>
						Welcome
					</Text>
					<Text
						style={[styles.subtitle, { color: currentColors.mutedForeground }]}
					>
						Sign in to continue your chat journey
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

					<TouchableOpacity
						onPress={() => navigation.navigate('ForgotPassword')}
						style={styles.forgotPasswordButton}
					>
						<Text
							style={[
								styles.forgotPasswordText,
								{ color: currentColors.primary },
							]}
						>
							Forgot Password?
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: currentColors.primary },
							loading && { opacity: 0.6 },
						]}
						onPress={handleLogin}
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
								Sign In
							</Text>
						)}
					</TouchableOpacity>

					<View style={styles.divider}>
						<View
							style={[
								styles.dividerLine,
								{ backgroundColor: currentColors.border },
							]}
						/>
						<Text
							style={[
								styles.dividerText,
								{ color: currentColors.mutedForeground },
							]}
						>
							or
						</Text>
						<View
							style={[
								styles.dividerLine,
								{ backgroundColor: currentColors.border },
							]}
						/>
					</View>

					<TouchableOpacity
						style={[
							styles.socialButton,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
							loading && { opacity: 0.6 },
						]}
						onPress={handleGoogleLogin}
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
					<Text
						style={[
							styles.footerText,
							{ color: currentColors.mutedForeground },
						]}
					>
						Don't have an account?{' '}
					</Text>
					<TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
						<Text style={[styles.footerLink, { color: currentColors.primary }]}>
							Sign Up
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
	},
	subtitle: {
		fontSize: 16,
	},
	form: {
		gap: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 16,
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		height: 50,
	},
	showPasswordButton: {
		padding: 8,
	},
	forgotPasswordButton: {
		alignSelf: 'flex-end',
	},
	forgotPasswordText: {
		fontSize: 14,
	},
	button: {
		height: 50,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
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
	},
	dividerText: {
		paddingHorizontal: 16,
	},
	socialButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 50,
		borderRadius: 12,
		borderWidth: 1,
		gap: 12,
	},
	socialButtonText: {
		fontSize: 16,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 32,
	},
	footerText: {
		fontSize: 14,
	},
	footerLink: {
		fontSize: 14,
		fontWeight: '600',
	},
});
