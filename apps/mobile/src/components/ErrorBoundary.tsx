import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	showErrorDetails?: boolean;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);

		this.setState({
			error,
			errorInfo,
		});

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Log error for production monitoring
		this.logError(error, errorInfo);
	}

	private logError = (error: Error, errorInfo: React.ErrorInfo) => {
		// In production, you would send this to a crash reporting service
		// like Sentry, Bugsnag, or Crashlytics
		const errorReport = {
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack,
			},
			errorInfo: {
				componentStack: errorInfo.componentStack,
			},
			timestamp: new Date().toISOString(),
			appVersion: '1.0.0', // Get from app.json in real implementation
			platform: 'mobile',
		};

		// For now, just log to console
		console.error('Error Report:', JSON.stringify(errorReport, null, 2));

		// TODO: In production, send to error reporting service
		// Example: Sentry.captureException(error, { extra: errorInfo });
	};

	private handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	private handleReportBug = () => {
		// In production, this could open a bug report form or email
		console.log('Bug report requested');
		// TODO: Implement bug reporting flow
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<View style={styles.container}>
					<View style={styles.iconContainer}>
						<Ionicons
							name='warning-outline'
							size={64}
							color={colors.light.destructive}
						/>
					</View>

					<Text style={styles.title}>Oops! Something went wrong</Text>
					<Text style={styles.subtitle}>
						We're sorry for the inconvenience. The app encountered an unexpected
						error.
					</Text>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={this.handleRetry}
						>
							<Ionicons
								name='refresh-outline'
								size={20}
								color={colors.light.primaryForeground}
								style={styles.buttonIcon}
							/>
							<Text style={styles.primaryButtonText}>Try Again</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={this.handleReportBug}
						>
							<Ionicons
								name='bug-outline'
								size={20}
								color={colors.light.primary}
								style={styles.buttonIcon}
							/>
							<Text style={styles.secondaryButtonText}>Report Bug</Text>
						</TouchableOpacity>
					</View>

					{this.props.showErrorDetails && this.state.error && (
						<View style={styles.errorDetails}>
							<Text style={styles.errorTitle}>Error Details:</Text>
							<Text style={styles.errorText}>
								{this.state.error.name}: {this.state.error.message}
							</Text>
							{this.state.error.stack && (
								<Text style={styles.stackTrace}>{this.state.error.stack}</Text>
							)}
						</View>
					)}
				</View>
			);
		}

		return this.props.children;
	}
}

// Specialized error boundaries for different parts of the app
export class ChatErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: null };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Chat Error:', error, errorInfo);
		this.setState({ error, errorInfo });
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.chatErrorContainer}>
					<Ionicons
						name='chatbubble-outline'
						size={32}
						color={colors.light.mutedForeground}
					/>
					<Text style={styles.chatErrorText}>Chat temporarily unavailable</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() =>
							this.setState({ hasError: false, error: null, errorInfo: null })
						}
					>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

export class VoiceErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: null };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Voice Error:', error, errorInfo);
		this.setState({ error, errorInfo });
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.voiceErrorContainer}>
					<Ionicons
						name='mic-off-outline'
						size={32}
						color={colors.light.mutedForeground}
					/>
					<Text style={styles.voiceErrorText}>
						Voice feature temporarily unavailable
					</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() =>
							this.setState({ hasError: false, error: null, errorInfo: null })
						}
					>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		backgroundColor: colors.light.background,
	},
	iconContainer: {
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
		color: colors.light.foreground,
		textAlign: 'center',
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 24,
		marginBottom: 32,
	},
	buttonContainer: {
		width: '100%',
		gap: 12,
	},
	primaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.light.primary,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	secondaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: colors.light.border,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	buttonIcon: {
		marginRight: 8,
	},
	primaryButtonText: {
		color: colors.light.primaryForeground,
		fontSize: 16,
		fontWeight: '600',
	},
	secondaryButtonText: {
		color: colors.light.primary,
		fontSize: 16,
		fontWeight: '600',
	},
	errorDetails: {
		marginTop: 32,
		padding: 16,
		backgroundColor: colors.light.muted,
		borderRadius: 8,
		width: '100%',
	},
	errorTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 8,
	},
	errorText: {
		fontSize: 12,
		color: colors.light.mutedForeground,
		marginBottom: 8,
	},
	stackTrace: {
		fontSize: 10,
		color: colors.light.mutedForeground,
		fontFamily: 'monospace',
	},
	chatErrorContainer: {
		padding: 20,
		alignItems: 'center',
		backgroundColor: colors.light.muted,
		borderRadius: 8,
		margin: 16,
	},
	chatErrorText: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginTop: 8,
		marginBottom: 12,
	},
	voiceErrorContainer: {
		padding: 20,
		alignItems: 'center',
		backgroundColor: colors.light.muted,
		borderRadius: 8,
		margin: 16,
	},
	voiceErrorText: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginTop: 8,
		marginBottom: 12,
	},
	retryButton: {
		backgroundColor: colors.light.primary,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
	},
	retryButtonText: {
		color: colors.light.primaryForeground,
		fontSize: 14,
		fontWeight: '600',
	},
});
