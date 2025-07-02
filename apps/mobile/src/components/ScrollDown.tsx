import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
	useAnimatedStyle,
	withTiming,
	useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../utils/colors';

interface ScrollDownProps {
	visible: boolean;
	onPress: () => void;
	unreadCount?: number;
}

export function ScrollDown({
	visible,
	onPress,
	unreadCount = 0,
}: ScrollDownProps) {
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];

	const opacity = useSharedValue(0);
	const translateY = useSharedValue(20);

	useEffect(() => {
		if (visible) {
			opacity.value = withTiming(1, { duration: 200 });
			translateY.value = withTiming(0, { duration: 200 });
		} else {
			opacity.value = withTiming(0, { duration: 200 });
			translateY.value = withTiming(20, { duration: 200 });
		}
	}, [visible]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Animated.View style={[styles.container, animatedStyle]}>
			<TouchableOpacity
				style={[
					styles.button,
					{
						backgroundColor: currentColors.card,
						borderColor: currentColors.border,
						shadowColor: isDark ? '#000' : '#000',
					},
				]}
				onPress={onPress}
				activeOpacity={0.8}
			>
				<LinearGradient
					colors={
						isDark
							? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
							: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)']
					}
					style={styles.gradient}
				>
					{unreadCount > 0 && (
						<Animated.View
							style={[styles.badge, { backgroundColor: currentColors.primary }]}
						>
							<Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
								{unreadCount > 99 ? '99+' : unreadCount}
							</Text>
						</Animated.View>
					)}
					<Ionicons
						name="chevron-down"
						size={24}
						color={currentColors.foreground}
						style={styles.icon}
					/>
				</LinearGradient>
			</TouchableOpacity>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 95,
		zIndex: 1000,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	button: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 0.5,
		overflow: 'hidden',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	gradient: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	icon: {
		opacity: 0.8,
	},
	badge: {
		position: 'absolute',
		top: -2,
		right: -2,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 6,
		zIndex: 1,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: '600',
		textAlign: 'center',
	},
});
