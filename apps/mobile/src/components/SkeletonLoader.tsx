import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
	width: number;
	height: number;
	borderRadius?: number;
	style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
	width,
	height,
	borderRadius = 8,
	style,
}) => {
	const opacity = useSharedValue(0.3);
	const { theme } = useTheme();
	const currentColors = colors[theme];

	useEffect(() => {
		opacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
	}, [opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={[
				styles.skeleton,
				{
					width,
					height,
					borderRadius,
					backgroundColor: currentColors.border,
				},
				animatedStyle,
				style,
			]}
		/>
	);
};

const styles = StyleSheet.create({
	skeleton: {
		// backgroundColor will be set dynamically based on theme
	},
});
