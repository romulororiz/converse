import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: true,
	signOut: async () => {},
});

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

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
			} else {
				await AsyncStorage.removeItem('supabase.session.exists');
			}
		});

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
		} catch (error) {
			console.error('Error during sign out:', error);
		}
	}

	const value = {
		user,
		session,
		loading,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
