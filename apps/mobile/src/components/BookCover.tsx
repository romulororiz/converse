import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

interface BookCoverProps {
	uri?: string | null;
	style?: any;
	placeholderIcon?: string;
	placeholderSize?: number;
}

export function BookCover({
	uri,
	style,
	placeholderIcon = 'book-outline',
	placeholderSize = 24,
}: BookCoverProps) {
	const [loading, setLoading] = useState(!!uri);
	const [error, setError] = useState(false);
	const [fadeAnim] = useState(new Animated.Value(uri ? 0 : 1));
	const [shimmerAnim] = useState(new Animated.Value(0));

	useEffect(() => {
		if (uri) {
			setLoading(true);
			setError(false);
			fadeAnim.setValue(0);
		} else {
			setLoading(false);
			setError(false);
			fadeAnim.setValue(1);
		}
	}, [uri]);

	const handleLoadStart = () => {
		setLoading(true);
		setError(false);
		// Start shimmer animation
		Animated.loop(
			Animated.timing(shimmerAnim, {
				toValue: 1,
				duration: 1500,
				useNativeDriver: true,
			})
		).start();
	};

	const handleLoad = () => {
		setLoading(false);
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start();
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
	};

	const showPlaceholder = !uri || error;

	return (
		<View style={[styles.container, style]}>
			{/* Loading skeleton */}
			{loading && !showPlaceholder && (
				<View style={[styles.skeleton, style]}>
					<Animated.View
						style={[
							styles.skeletonShimmer,
							{
								opacity: shimmerAnim.interpolate({
									inputRange: [0, 0.5, 1],
									outputRange: [0.3, 0.7, 0.3],
								}),
							},
						]}
					/>
				</View>
			)}

			{/* Image */}
			{uri && !error && (
				<Animated.Image
					source={{ uri }}
					style={[styles.image, style, { opacity: fadeAnim }]}
					onLoadStart={handleLoadStart}
					onLoad={handleLoad}
					onError={handleError}
					resizeMode="cover"
				/>
			)}

			{/* Placeholder */}
			{showPlaceholder && (
				<View style={[styles.placeholder, style]}>
					<Ionicons
						name={placeholderIcon as any}
						size={placeholderSize}
						color={colors.light.mutedForeground}
					/>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden',
		borderRadius: 2,
	},
	image: {
		width: '100%',
		height: '100%',
		borderRadius: 2,
	},
	skeleton: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: colors.light.muted,
		borderRadius: 2,
		overflow: 'hidden',
	},
	skeletonShimmer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'colors.light.card',
		opacity: 0.6,
	},
	placeholder: {
		backgroundColor: colors.light.muted,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 2,
	},
});
