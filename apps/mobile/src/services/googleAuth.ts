import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
// const GOOGLE_CLIENT_ID =
// 	process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id';
// const GOOGLE_CLIENT_SECRET =
// 	process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || 'your-google-client-secret';

export interface GoogleAuthResult {
	success: boolean;
	error?: string;
	user?: any;
}

// Direct OAuth approach without relying on Supabase's OAuth URL generation
export async function signInWithGoogleDirect(): Promise<GoogleAuthResult> {
	try {
		console.log('Starting direct Google OAuth...');

		// Get Supabase URL
		const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
		if (!supabaseUrl) {
			throw new Error('Supabase URL not configured');
		}

		// Create redirect URI
		const redirectUri = 'interactive-library://auth';

		// Construct the direct OAuth URL to Supabase
		const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
			redirectUri
		)}`;

		console.log('Direct auth URL:', authUrl);
		console.log('Redirect URI:', redirectUri);

		// Open the auth session
		const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

		console.log('Direct OAuth result:', result);

		if (result.type === 'success') {
			console.log('Direct OAuth success, result URL:', result.url);

			// Wait for Supabase to process the callback
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Check for session multiple times with increasing delays
			for (let attempt = 1; attempt <= 3; attempt++) {
				console.log(`Checking for session, attempt ${attempt}...`);

				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (session?.user) {
					console.log('Session found:', session.user.email);

					return {
						success: true,
						user: session.user,
					};
				}

				if (attempt < 3) {
					await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
				}
			}

			// If still no session, try to extract from URL manually
			console.log('No session found, trying to extract tokens from URL...');

			try {
				const url = new URL(result.url!);
				const fragment = url.hash.substring(1);
				const params = new URLSearchParams(fragment);

				const accessToken = params.get('access_token');
				const refreshToken = params.get('refresh_token');

				if (accessToken && refreshToken) {
					console.log('Found tokens in URL, setting session...');

					const { data, error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});

					if (error) {
						console.error('Error setting session:', error);
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
			} catch (urlError) {
				console.error('Error parsing URL:', urlError);
			}

			return {
				success: false,
				error: 'Authentication completed but session could not be established',
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
	} catch (error) {
		console.error('Direct Google Auth Error:', error);
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
				const url = new URL(result.url!);

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
		const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
			fallbackRedirectUri
		)}`;

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
			const url = new URL(result.url!);
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
		const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
			redirectUri
		)}`;

		console.log('OAuth URL:', oauthUrl);

		// Open the OAuth URL in a web browser
		const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);

		if (result.type === 'success') {
			// Extract the URL parameters
			const url = new URL(result.url!);
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
