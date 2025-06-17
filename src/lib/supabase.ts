import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
	throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createPagesBrowserClient<Database>();

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

// Helper function to get user profile
export async function getUserProfile(userId: string) {
	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId as string)
		.single();

	if (error) {
		throw error;
	}
	return data;
}

// Helper function to update user profile
export async function updateUserProfile(
	userId: string,
	updates: Partial<Database['public']['Tables']['profiles']['Update']>
) {
	const { data, error } = await supabase
		.from('profiles')
		.update(updates as Database['public']['Tables']['profiles']['Update'])
		.eq('id', userId as string)
		.select()
		.single();

	if (error) {
		throw error;
	}
	return data;
}
 