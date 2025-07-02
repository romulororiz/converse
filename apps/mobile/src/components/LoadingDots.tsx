import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

interface LoadingDotsProps {
	color?: string;
	size?: number;
}

export function LoadingDots({
	color = colors.light.foreground,
	size = 6,
}: LoadingDotsProps) {
	const dot1 = useRef(new Animated.Value(0)).current;
	const dot2 = useRef(new Animated.Value(0)).current;
	const dot3 = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const animateDot = (dot: Animated.Value, delay: number) => {
			return Animated.loop(
				Animated.sequence([
					Animated.delay(delay),
					Animated.timing(dot, {
						toValue: 1,
						duration: 600,
						useNativeDriver: true,
					}),
					Animated.timing(dot, {
						toValue: 0,
						duration: 600,
						useNativeDriver: true,
					}),
				])
			);
		};

		const animation = Animated.parallel([
			animateDot(dot1, 0),
			animateDot(dot2, 200),
			animateDot(dot3, 400),
		]);

		animation.start();

		return () => animation.stop();
	}, [dot1, dot2, dot3]);

	const getDotStyle = (dot: Animated.Value) => ({
		transform: [
			{
				translateY: dot.interpolate({
					inputRange: [0, 1],
					outputRange: [0, -6],
				}),
			},
		],
		opacity: dot.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: [0.3, 1, 0.3],
		}),
	});

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.dot,
					{
						backgroundColor: color,
						width: size,
						height: size,
						borderRadius: size / 2,
					},
					getDotStyle(dot1),
				]}
			/>
			<Animated.View
				style={[
					styles.dot,
					{
						backgroundColor: color,
						width: size,
						height: size,
						borderRadius: size / 2,
					},
					getDotStyle(dot2),
				]}
			/>
			<Animated.View
				style={[
					styles.dot,
					{
						backgroundColor: color,
						width: size,
						height: size,
						borderRadius: size / 2,
					},
					getDotStyle(dot3),
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
	},
	dot: {
		marginHorizontal: 2,
	},
});
