import { create } from 'zustand';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
	user: User | null;
	profile: Profile | null;
	isLoading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	setUser: (user: User | null) => void;
	setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
	user: null,
	profile: null,
	isLoading: true,
	signIn: async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) throw error;
		set({ user: data.user });
	},
	signUp: async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});
		if (error) throw error;
		set({ user: data.user });
	},
	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		set({ user: null, profile: null });
	},
	setUser: user => set({ user, isLoading: false }),
	setProfile: profile => set({ profile }),
}));
