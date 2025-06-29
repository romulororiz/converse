import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration - use platform-specific client IDs
const getGoogleClientId = () => {
	if (Platform.OS === 'android') {
		return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
	} else if (Platform.OS === 'ios') {
		return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
	} else {
		return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
	}
};

export interface GoogleAuthResult {
	success: boolean;
	error?: string;
	user?: any;
}

// Improved Google OAuth with better error handling
export async function signInWithGoogleDirect(): Promise<GoogleAuthResult> {
	try {
		console.log('Starting Google OAuth for platform:', Platform.OS);

		// Check if we have the required client ID
		const clientId = getGoogleClientId();
		if (!clientId) {
			const error = `Google Client ID not configured for ${Platform.OS}. Please check your environment variables.`;
			console.error(error);
			return {
				success: false,
				error: error,
			};
		}

		// Get Supabase URL
		const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
		if (!supabaseUrl) {
			throw new Error('Supabase URL not configured');
		}

		// Create redirect URI - use a simpler format for better compatibility
		const redirectUri = 'interactive-library://auth';

		// Construct the OAuth URL with additional parameters for better Android compatibility
		const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}&client_id=${clientId}`;

		console.log('OAuth URL:', authUrl);
		console.log('Redirect URI:', redirectUri);

		// Open the auth session with better options for Android
		const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
			dismissButtonStyle: 'cancel',
			preferEphemeralSession: true,
			showInRecents: false,
		});

		console.log('OAuth result type:', result.type);

		if (result.type === 'success' && result.url) {
			// Parse the result URL
			const url = new URL(result.url);

			// Check for error parameters
			const error = url.searchParams.get('error');
			const errorDescription = url.searchParams.get('error_description');

			if (error) {
				console.error('OAuth error:', error, errorDescription);
				return {
					success: false,
					error: errorDescription || error,
				};
			}

			// Extract tokens from URL parameters
			const accessToken = url.searchParams.get('access_token');
			const refreshToken = url.searchParams.get('refresh_token');

			if (accessToken && refreshToken) {
				console.log('Tokens found, setting session...');

				// Set the session in Supabase
				const { data, error: sessionError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken,
				});

				if (sessionError) {
					console.error('Session error:', sessionError);
					return {
						success: false,
						error: sessionError.message,
					};
				}

				if (data?.user) {
					console.log(
						'Google authentication successful for user:',
						data.user.email
					);
					return {
						success: true,
						user: data.user,
					};
				}
			}

			// If no tokens in URL params, check hash fragment
			const hashParams = new URLSearchParams(url.hash.substring(1));
			const hashAccessToken = hashParams.get('access_token');
			const hashRefreshToken = hashParams.get('refresh_token');

			if (hashAccessToken && hashRefreshToken) {
				console.log('Tokens found in hash, setting session...');

				const { data, error: sessionError } = await supabase.auth.setSession({
					access_token: hashAccessToken,
					refresh_token: hashRefreshToken,
				});

				if (sessionError) {
					return {
						success: false,
						error: sessionError.message,
					};
				}

				if (data?.user) {
					return {
						success: true,
						user: data.user,
					};
				}
			}

			// If we get here, try to wait a moment and check if Supabase processed the auth
			console.log('No tokens found, waiting for Supabase to process...');
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Check current session
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData?.session?.user) {
				console.log(
					'Session found after waiting:',
					sessionData.session.user.email
				);
				return {
					success: true,
					user: sessionData.session.user,
				};
			}

			return {
				success: false,
				error:
					'Authentication completed but no session was established. Please try again.',
			};
		} else if (result.type === 'cancel') {
			return {
				success: false,
				error: 'Authentication cancelled by user',
			};
		} else {
			return {
				success: false,
				error: 'Authentication failed - unexpected result type',
			};
		}
	} catch (error) {
		console.error('Google Auth Error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

// Simpler approach using Supabase's built-in OAuth
export async function signInWithGoogleSimple(): Promise<GoogleAuthResult> {
	try {
		console.log('Starting simple Google OAuth...');

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: 'interactive-library://auth',
				queryParams: {
					access_type: 'offline',
					prompt: 'consent',
				},
			},
		});

		console.log('Simple OAuth result:', { data, error });

		if (error) {
			console.error('Simple OAuth error:', error);
			return {
				success: false,
				error: error.message,
			};
		}

		if (data?.url) {
			console.log('Opening OAuth URL:', data.url);

			// Open the OAuth URL
			const result = await WebBrowser.openAuthSessionAsync(
				data.url,
				'interactive-library://auth',
				{
					dismissButtonStyle: 'cancel',
					preferEphemeralSession: true,
				}
			);

			console.log('WebBrowser result:', result);

			if (result.type === 'success') {
				console.log('OAuth success, parsing result URL...');
				console.log('Result URL:', result.url);

				// Parse the result URL to extract tokens
				const url = new URL(result.url);

				// Check for tokens in query parameters
				const accessToken = url.searchParams.get('access_token');
				const refreshToken = url.searchParams.get('refresh_token');
				const tokenType = url.searchParams.get('token_type');
				const expiresIn = url.searchParams.get('expires_in');

				// Also check in hash fragment (common for OAuth)
				const hashParams = new URLSearchParams(url.hash.substring(1));
				const hashAccessToken = hashParams.get('access_token');
				const hashRefreshToken = hashParams.get('refresh_token');
				const hashTokenType = hashParams.get('token_type');
				const hashExpiresIn = hashParams.get('expires_in');

				const finalAccessToken = accessToken || hashAccessToken;
				const finalRefreshToken = refreshToken || hashRefreshToken;

				console.log('Extracted tokens:', {
					accessToken: finalAccessToken ? 'present' : 'missing',
					refreshToken: finalRefreshToken ? 'present' : 'missing',
					tokenType: tokenType || hashTokenType,
					expiresIn: expiresIn || hashExpiresIn,
				});

				if (finalAccessToken && finalRefreshToken) {
					console.log('Setting session with extracted tokens...');

					// Set the session manually
					const { data, error } = await supabase.auth.setSession({
						access_token: finalAccessToken,
						refresh_token: finalRefreshToken,
					});

					console.log(
						'Set session result:',
						data?.user?.email || 'No user',
						error
					);

					if (error) {
						return {
							success: false,
							error: `Failed to set session: ${error.message}`,
						};
					}

					if (data?.user) {
						return {
							success: true,
							user: data.user,
						};
					}
				}

				// If no tokens found, try to wait and check for session
				console.log(
					'No tokens found in URL, waiting for Supabase to process...'
				);
				await new Promise(resolve => setTimeout(resolve, 2000));

				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();
				console.log(
					'Session after wait:',
					session?.user?.email || 'No session',
					sessionError
				);

				if (session?.user) {
					return {
						success: true,
						user: session.user,
					};
				}

				return {
					success: false,
					error:
						'Authentication completed but no session could be established. Please try again.',
				};
			} else if (result.type === 'cancel') {
				return {
					success: false,
					error: 'Authentication cancelled by user',
				};
			} else {
				return {
					success: false,
					error: 'Authentication failed',
				};
			}
		}

		return {
			success: false,
			error: 'No OAuth URL received from Supabase',
		};
	} catch (error) {
		console.error('Simple Google Auth Error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

export async function signInWithGoogleSupabase(): Promise<GoogleAuthResult> {
	try {
		// Create the redirect URI for the OAuth flow
		const redirectUri = makeRedirectUri({
			scheme: 'interactive-library',
			path: 'auth',
		});

		// Alternative redirect URI format for better compatibility
		const fallbackRedirectUri = 'interactive-library://auth';

		console.log('Redirect URI:', redirectUri);
		console.log('Fallback Redirect URI:', fallbackRedirectUri);

		// Get the Supabase URL to construct the OAuth URL manually
		const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
		if (!supabaseUrl) {
			throw new Error('Supabase URL not configured');
		}

		// Try the fallback redirect URI first (simpler format)
		const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(fallbackRedirectUri)}`;

		console.log('Opening OAuth URL:', oauthUrl);
		console.log('Expected redirect URI:', fallbackRedirectUri);

		// Use WebBrowser to open the OAuth flow with better options
		const result = await WebBrowser.openAuthSessionAsync(
			oauthUrl,
			fallbackRedirectUri,
			{
				dismissButtonStyle: 'cancel',
				preferEphemeralSession: true,
				showInRecents: false,
			}
		);

		console.log('WebBrowser result:', result);

		if (result.type === 'success') {
			// The redirect should contain auth tokens in the URL
			const url = new URL(result.url);
			const accessToken = url.searchParams.get('access_token');
			const refreshToken = url.searchParams.get('refresh_token');
			const error = url.searchParams.get('error');
			const errorDescription = url.searchParams.get('error_description');

			if (error) {
				return {
					success: false,
					error: errorDescription || error,
				};
			}

			if (accessToken && refreshToken) {
				// Set the session in Supabase
				const { data, error: sessionError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken,
				});

				if (sessionError) {
					console.error('Session error:', sessionError);
					return {
						success: false,
						error: sessionError.message,
					};
				}

				console.log('Successfully set session:', data);
				return {
					success: true,
					user: data.user,
				};
			} else {
				// Sometimes the tokens are in a different format, let's check the hash
				const hashParams = new URLSearchParams(url.hash.substring(1));
				const hashAccessToken = hashParams.get('access_token');
				const hashRefreshToken = hashParams.get('refresh_token');

				if (hashAccessToken && hashRefreshToken) {
					const { data, error: sessionError } = await supabase.auth.setSession({
						access_token: hashAccessToken,
						refresh_token: hashRefreshToken,
					});

					if (sessionError) {
						return {
							success: false,
							error: sessionError.message,
						};
					}

					return {
						success: true,
						user: data.user,
					};
				}

				return {
					success: false,
					error: 'No authentication tokens received',
				};
			}
		} else if (result.type === 'cancel') {
			return {
				success: false,
				error: 'Authentication cancelled by user',
			};
		} else {
			return {
				success: false,
				error: 'Authentication failed',
			};
		}
	} catch (error) {
		console.error('Google Auth Error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

// Alternative simpler approach using WebBrowser directly
export async function signInWithGoogleWeb(): Promise<GoogleAuthResult> {
	try {
		// Get the Supabase URL and construct the OAuth URL
		const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
		if (!supabaseUrl) {
			throw new Error('Supabase URL not configured');
		}

		console.log('Supabase URL:', supabaseUrl);

		const redirectUri = makeRedirectUri({
			scheme: 'interactive-library',
			path: 'auth',
		});

		// Construct the OAuth URL
		const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

		console.log('OAuth URL:', oauthUrl);

		// Open the OAuth URL in a web browser
		const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);

		if (result.type === 'success') {
			// Extract the URL parameters
			const url = new URL(result.url);
			const accessToken = url.searchParams.get('access_token');
			const refreshToken = url.searchParams.get('refresh_token');

			if (accessToken && refreshToken) {
				// Set the session in Supabase
				const { data, error } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken,
				});

				if (error) {
					return {
						success: false,
						error: error.message,
					};
				}

				return {
					success: true,
					user: data.user,
				};
			} else {
				return {
					success: false,
					error: 'Failed to get authentication tokens',
				};
			}
		} else if (result.type === 'cancel') {
			return {
				success: false,
				error: 'Authentication cancelled',
			};
		} else {
			return {
				success: false,
				error: 'Authentication failed',
			};
		}
	} catch (error) {
		console.error('Google Auth Error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}
