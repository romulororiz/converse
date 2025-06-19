import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get user session
export async function getSession() {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();
	if (error) {
		throw error;
	}
	return session;
}

// Helper function to get current user
export async function getCurrentUser() {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error) {
		throw error;
	}
	return user;
}
