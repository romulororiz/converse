'use client';
import { useEffect } from 'react';
import { supabase, getUserProfile } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store/auth';

export default function AuthProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const setUser = useAuthStore(state => state.setUser);
	const setProfile = useAuthStore(state => state.setProfile);
	const user = useAuthStore(state => state.user);

	useEffect(() => {
		// Hydrate Zustand store with current user
		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user || null);
		});
		// Subscribe to auth state changes
		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setUser(session?.user || null);
			}
		);
		return () => {
			listener?.subscription.unsubscribe();
		};
	}, [setUser]);

	useEffect(() => {
		if (user?.id) {
			getUserProfile(user.id)
				.then(profile => setProfile(profile))
				.catch(() => setProfile(null));
		} else {
			setProfile(null);
		}
	}, [user, setProfile]);

	return <>{children}</>;
}
