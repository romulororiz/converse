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

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation();

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Error', 'Please fill in all fields');
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

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps='handled'
			>
				<View style={styles.header}>
					<Text style={styles.title}>Welcome Back</Text>
					<Text style={styles.subtitle}>
						Sign in to continue your reading journey
					</Text>
				</View>

				<View style={styles.form}>
					<View style={styles.inputContainer}>
						<Ionicons
							name='mail-outline'
							size={20}
							color={colors.light.mutedForeground}
							style={styles.inputIcon}
						/>
						<TextInput
							style={styles.input}
							placeholder='Email'
							placeholderTextColor={colors.light.mutedForeground}
							keyboardType='email-address'
							autoCapitalize='none'
							value={email}
							onChangeText={setEmail}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Ionicons
							name='lock-closed-outline'
							size={20}
							color={colors.light.mutedForeground}
							style={styles.inputIcon}
						/>
						<TextInput
							style={styles.input}
							placeholder='Password'
							placeholderTextColor={colors.light.mutedForeground}
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
								color={colors.light.mutedForeground}
							/>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						onPress={() => navigation.navigate('ForgotPassword')}
						style={styles.forgotPasswordButton}
					>
						<Text style={styles.forgotPasswordText}>Forgot Password?</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleLogin}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color={colors.light.primaryForeground} />
						) : (
							<Text style={styles.buttonText}>Sign In</Text>
						)}
					</TouchableOpacity>

					<View style={styles.divider}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>or</Text>
						<View style={styles.dividerLine} />
					</View>

					<TouchableOpacity
						style={styles.socialButton}
						onPress={() => {
							// Handle Google Sign In
						}}
					>
						<Ionicons
							name='logo-google'
							size={20}
							color={colors.light.foreground}
						/>
						<Text style={styles.socialButtonText}>Continue with Google</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Don't have an account? </Text>
					<TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
						<Text style={styles.footerLink}>Sign Up</Text>
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
	forgotPasswordButton: {
		alignSelf: 'flex-end',
	},
	forgotPasswordText: {
		color: colors.light.primary,
		fontSize: 14,
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
		borderColor: colors.light.border,
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
