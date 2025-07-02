import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<void>;
	// Rate limiting
	chatRateLimited: boolean;
	voiceRateLimited: boolean;
	apiRateLimited: boolean;
	rateLimitResetTime: Date | null;
	apiRateLimitResetTime: Date | null;
	setChatRateLimited: (limited: boolean) => void;
	setVoiceRateLimited: (limited: boolean) => void;
	setApiRateLimited: (limited: boolean) => void;
	setRateLimitResetTime: (time: Date | null) => void;
	setApiRateLimitResetTime: (time: Date | null) => void;
	getRemainingTime: (resetTime?: Date | null) => number;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: true,
	signOut: async () => {},
	refreshSession: async () => {},
	// Rate limiting defaults
	chatRateLimited: false,
	voiceRateLimited: false,
	apiRateLimited: false,
	rateLimitResetTime: null,
	apiRateLimitResetTime: null,
	setChatRateLimited: () => {},
	setVoiceRateLimited: () => {},
	setApiRateLimited: () => {},
	setRateLimitResetTime: () => {},
	setApiRateLimitResetTime: () => {},
	getRemainingTime: () => 0,
});

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	// Rate limiting state
	const [chatRateLimited, setChatRateLimited] = useState(false);
	const [voiceRateLimited, setVoiceRateLimited] = useState(false);
	const [apiRateLimited, setApiRateLimited] = useState(false);
	const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(
		null
	);
	const [apiRateLimitResetTime, setApiRateLimitResetTime] =
		useState<Date | null>(null);
	const [, setForceRender] = useState(0);

	// Calculate remaining time for rate limits
	const getRemainingTime = (resetTime?: Date | null) => {
		const targetResetTime = resetTime || rateLimitResetTime;
		if (!targetResetTime) return 0;
		const remaining = Math.max(
			0,
			Math.ceil((targetResetTime.getTime() - Date.now()) / 1000)
		);
		return remaining;
	};

	// Handle chat rate limit reset
	useEffect(() => {
		if (!chatRateLimited || !rateLimitResetTime) return;

		const interval = setInterval(() => {
			const remaining = getRemainingTime(rateLimitResetTime);
			if (remaining <= 0) {
				setChatRateLimited(false);
				setRateLimitResetTime(null);
				clearInterval(interval);
			} else {
				setForceRender(prev => prev + 1);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [chatRateLimited, rateLimitResetTime]);

	// Handle API rate limit reset
	useEffect(() => {
		if (!apiRateLimited || !apiRateLimitResetTime) return;

		const interval = setInterval(() => {
			const remaining = getRemainingTime(apiRateLimitResetTime);
			if (remaining <= 0) {
				setApiRateLimited(false);
				setApiRateLimitResetTime(null);
				clearInterval(interval);
			} else {
				setForceRender(prev => prev + 1);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [apiRateLimited, apiRateLimitResetTime]);

	// Handle voice rate limit reset
	useEffect(() => {
		if (!voiceRateLimited || !rateLimitResetTime) return;

		const interval = setInterval(() => {
			const remaining = getRemainingTime(rateLimitResetTime);
			if (remaining <= 0) {
				setVoiceRateLimited(false);
				setRateLimitResetTime(prev => {
					// Only clear if this was the voice rate limit
					if (voiceRateLimited && !chatRateLimited) {
						return null;
					}
					return prev;
				});
				clearInterval(interval);
			} else {
				setForceRender(prev => prev + 1);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [voiceRateLimited, rateLimitResetTime, chatRateLimited]);

	// Check existing rate limits on startup/login
	const checkExistingRateLimits = async (userId: string) => {
		try {
			// Import rate limit functions
			const { checkChatRateLimit, checkVoiceRateLimit, checkAIRateLimit } =
				await import('../utils/rateLimit');

			// Determine user tier (simple check)
			const userTier: 'basic' | 'premium' = 'basic'; // You can make this dynamic later

			// Check all rate limits
			const [chatResult, voiceResult, aiResult] = await Promise.all([
				checkChatRateLimit(userId, userTier),
				checkVoiceRateLimit(userId, userTier),
				checkAIRateLimit(userId, userTier),
			]);

			// Update states based on server response
			if (!chatResult.allowed) {
				setChatRateLimited(true);
				setRateLimitResetTime(chatResult.resetTime);
			}

			if (!voiceResult.allowed) {
				setVoiceRateLimited(true);
				setRateLimitResetTime(voiceResult.resetTime);
			}

			if (!aiResult.allowed) {
				setApiRateLimited(true);
				setApiRateLimitResetTime(aiResult.resetTime);
			}

			console.log('🔄 Rate limit status restored:', {
				chat: chatResult.allowed ? 'allowed' : 'limited',
				voice: voiceResult.allowed ? 'allowed' : 'limited',
				ai: aiResult.allowed ? 'allowed' : 'limited',
			});
		} catch (error) {
			console.log('⚠️ Could not check existing rate limits:', error);
			// Fail silently - rate limits will be checked when user tries to use features
		}
	};

	useEffect(() => {
		// Get initial session
		getInitialSession();

		// Listen for auth state changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log('Auth state change:', event, session?.user?.email);

			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);

			// Store session info for debugging
			if (session) {
				await AsyncStorage.setItem('supabase.session.exists', 'true');
				console.log('User logged in:', session.user.email);

				// Check existing rate limits when user logs in
				checkExistingRateLimits(session.user.id);
			} else {
				await AsyncStorage.removeItem('supabase.session.exists');
				console.log('User logged out');
			}
		});

		// // Also listen for URL changes (for OAuth callbacks)
		// const handleURLChange = (url: string) => {
		// 	console.log('URL changed:', url);
		// 	if (url.includes('interactive-library://auth')) {
		// 		console.log('OAuth callback detected, refreshing session...');
		// 		// Small delay to let Supabase process the OAuth callback
		// 		setTimeout(() => {
		// 			getInitialSession();
		// 		}, 500);
		// 	}
		// };

		// Note: In a real app, you'd use Linking.addEventListener
		// For now, we'll rely on the manual refresh calls

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	async function getInitialSession() {
		try {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error) {
				console.error('Error getting session:', error);
			}

			console.log('Initial session:', session?.user?.email || 'No session');
			setSession(session);
			setUser(session?.user ?? null);

			// Check existing rate limits on app startup if user is logged in
			if (session?.user) {
				checkExistingRateLimits(session.user.id);
			}
		} catch (error) {
			console.error('Error checking session:', error);
		} finally {
			setLoading(false);
		}
	}

	async function signOut() {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error('Error signing out:', error);
			}
			// Clear any additional stored data
			await AsyncStorage.removeItem('supabase.session.exists');

			// Clear rate limiting state on sign out
			setChatRateLimited(false);
			setVoiceRateLimited(false);
			setApiRateLimited(false);
			setRateLimitResetTime(null);
			setApiRateLimitResetTime(null);
		} catch (error) {
			console.error('Error during sign out:', error);
		}
	}

	async function refreshSession() {
		try {
			console.log('Manually refreshing session...');
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error) {
				console.error('Error refreshing session:', error);
				return;
			}

			console.log('Refreshed session:', session?.user?.email || 'No session');
			setSession(session);
			setUser(session?.user ?? null);
		} catch (error) {
			console.error('Error during session refresh:', error);
		}
	}

	const value = {
		user,
		session,
		loading,
		signOut,
		refreshSession,
		// Rate limiting
		chatRateLimited,
		voiceRateLimited,
		apiRateLimited,
		rateLimitResetTime,
		apiRateLimitResetTime,
		setChatRateLimited,
		setVoiceRateLimited,
		setApiRateLimited,
		setRateLimitResetTime,
		setApiRateLimitResetTime,
		getRemainingTime,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
