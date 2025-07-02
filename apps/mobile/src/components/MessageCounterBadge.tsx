import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getUserSubscription, canSendMessage } from '../services/subscription';

interface MessageCounterBadgeProps {
	onPress?: () => void;
	variant?: 'pill' | 'circle';
	label?: string;
	style?: any;
	refreshKey?: any; // Used to force refresh
	showSkeleton?: boolean;
}

export const MessageCounterBadge: React.FC<MessageCounterBadgeProps> = ({
	onPress,
	variant = 'pill',
	label = 'FREE MESSAGES',
	style,
	refreshKey,
	showSkeleton = false,
}) => {
	const [messageInfo, setMessageInfo] = useState<{
		remainingMessages: number;
		limit: number;
		plan: string;
		canSend: boolean;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

	useEffect(() => {
		let isMounted = true;
		const loadMessageInfo = async () => {
			try {
				setLoading(true);
				const profile = await getUserSubscription();
				if (profile) {
					const info = await canSendMessage(profile.id);
					if (isMounted) {
						setMessageInfo(info);
						setHasLoadedOnce(true);
					}
				}
			} catch (error) {
				console.error('Error loading message info:', error);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadMessageInfo();
		return () => {
			isMounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshKey]);

	const shouldShowSkeleton =
		(showSkeleton || (loading && !hasLoadedOnce)) && !messageInfo;

	if (shouldShowSkeleton) {
		return <View style={[styles.pillContainer, styles.skeleton, style]} />;
	}

	if (variant === 'pill') {
		const pillText =
			messageInfo?.plan === 'premium'
				? 'UNLIMITED'
				: `${messageInfo?.remainingMessages ?? ''} ${label}`;
		return (
			//loading state
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={onPress ? 0.7 : 1}
				style={[
					styles.pillContainer,
					style,
					messageInfo && !messageInfo.canSend && styles.pillContainerDisabled,
				]}
			>
				<Text style={styles.pillText}>{loading ? '' : pillText}</Text>
			</TouchableOpacity>
		);
	}

	// fallback: circle (legacy)
	return (
		<View style={[styles.circleContainer, style]}>
			<Text style={styles.circleText}>
				{messageInfo?.plan === 'premium' ? '∞' : messageInfo?.remainingMessages}
			</Text>
		</View>
	);
};

const GOLD = '#BFA23A';
const SKELETON_BG = '#E5E2D6'; // neutral placeholder

const styles = StyleSheet.create({
	pillContainer: {
		backgroundColor: GOLD,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 6,
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
		minWidth: 140, // fixed min width for both skeleton and badge
		minHeight: 32,
		elevation: 2,
	},
	pillContainerDisabled: {
		opacity: 0.6,
	},
	pillText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 10,
		textTransform: 'uppercase',
	},
	skeleton: {
		backgroundColor: SKELETON_BG,
	},
	circleContainer: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: GOLD,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circleText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
});
