import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { getUserSubscription } from '../services/subscription';

export type Subscription = {
	subscription_plan: 'free' | 'premium' | 'trial';
	subscription_status: 'active' | 'inactive' | 'cancelled';
	subscription_expires_at: string | null;
	message_count: number;
	message_limit: number;
	last_message_reset_date: string;
};

interface SubscriptionContextValue {
	subscription: Subscription | null;
	loading: boolean;
	refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
	undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [subscription, setSubscription] = useState<Subscription | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchSubscription = useCallback(async () => {
		setLoading(true);
		try {
			const sub = await getUserSubscription();
			setSubscription(sub);
		} catch {
			setSubscription(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSubscription();
	}, [fetchSubscription]);

	return (
		<SubscriptionContext.Provider
			value={{ subscription, loading, refreshSubscription: fetchSubscription }}
		>
			{children}
		</SubscriptionContext.Provider>
	);
};

export function useSubscription() {
	const ctx = useContext(SubscriptionContext);
	if (!ctx)
		throw new Error(
			'useSubscription must be used within a SubscriptionProvider'
		);
	return ctx;
}
