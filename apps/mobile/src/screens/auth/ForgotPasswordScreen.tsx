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

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation();

	const handleResetPassword = async () => {
		if (!email) {
			Alert.alert('Error', 'Please enter your email address');
			return;
		}

		try {
			setLoading(true);
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: 'io.supabase.interactive-library://reset-password',
			});

			if (error) throw error;

			Alert.alert(
				'Success',
				'Please check your email for password reset instructions',
				[{ text: 'OK', onPress: () => navigation.navigate('Login') }]
			);
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

				<View style={styles.header}>
					<Text style={styles.title}>Reset Password</Text>
					<Text style={styles.subtitle}>
						Enter your email address and we'll send you instructions to reset
						your password
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

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleResetPassword}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color={colors.light.primaryForeground} />
						) : (
							<Text style={styles.buttonText}>Send Reset Instructions</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>Remember your password? </Text>
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
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
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
		lineHeight: 22,
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
