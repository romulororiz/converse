import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	withRepeat,
	interpolate,
	runOnJS,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { colors } from '../utils/colors';

// Import the Lottie animation
const voicePulseAnimation = require('../lib/lottie/voice-pulse.json');

interface ModernVoiceVisualizerProps {
	isRecording: boolean;
	onVolumeChange?: (volume: number) => void;
	size?: number;
	color?: string;
	isProcessing?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ModernVoiceVisualizer: React.FC<ModernVoiceVisualizerProps> = ({
	isRecording,
	onVolumeChange,
	size = 200,
	color = colors.light.primary,
	isProcessing = false,
}) => {
	const lottieRef = useRef<LottieView>(null);
	const [currentVolume, setCurrentVolume] = useState(0);

	// Animated values for Reanimated 3
	const scale = useSharedValue(1);
	const opacity = useSharedValue(0.7);
	const rotateZ = useSharedValue(0);
	const audioLevel = useSharedValue(0);

	// Initialize audio visualization
	useEffect(() => {
		let animationInterval: ReturnType<typeof setInterval> | null = null;

		if (isRecording) {
			// Start Lottie animation
			lottieRef.current?.play();

			// Start entrance animation
			scale.value = withSpring(1.1, { damping: 6, stiffness: 120 });
			opacity.value = withTiming(1, { duration: 300 });
			rotateZ.value = withRepeat(
				withTiming(360, { duration: 8000 }),
				-1,
				false
			);

			// Create appropriate animation pattern based on state
			let time = 0;
			animationInterval = setInterval(() => {
				time += 0.1;

				let simulatedVolume = 0;

				if (isProcessing) {
					// Processing: steady pulse animation
					const pulse = Math.sin(time * 3) * 0.15 + 0.25; // Steady pulse between 0.1-0.4
					simulatedVolume = Math.max(0.1, Math.min(0.4, pulse));
				} else {
					// Listening/Speaking: more subtle voice pattern
					const baseLevel = 0.15; // Lower base level
					const voice1 = Math.sin(time * 1.5) * 0.1; // Gentler main frequency
					const voice2 = Math.sin(time * 3) * 0.05; // Subtle overlay
					const breathing = Math.sin(time * 0.5) * 0.08; // Slow breathing
					const randomNoise = (Math.random() - 0.5) * 0.03; // Less random noise

					simulatedVolume = Math.max(
						0,
						Math.min(0.6, baseLevel + voice1 + voice2 + breathing + randomNoise)
					);
				}

				setCurrentVolume(simulatedVolume);
				audioLevel.value = withSpring(simulatedVolume, {
					damping: 12,
					stiffness: 80,
				});

				if (onVolumeChange) {
					onVolumeChange(simulatedVolume);
				}
			}, 80); // Slower update rate for smoother feel

			return () => {
				if (animationInterval) {
					clearInterval(animationInterval);
				}
			};
		} else {
			// Stop recording - exit animation
			scale.value = withSpring(1, { damping: 8, stiffness: 100 });
			opacity.value = withTiming(0.7, { duration: 200 });
			rotateZ.value = withTiming(0, { duration: 500 });
			audioLevel.value = withTiming(0, { duration: 300 });

			// Stop Lottie animation
			lottieRef.current?.pause();
		}
	}, [isRecording]);

	// Animated styles for the container
	const containerAnimatedStyle = useAnimatedStyle(() => {
		const audioScale = interpolate(
			audioLevel.value,
			[0, 0.5, 1],
			[1, 1.15, 1.3]
		);

		return {
			transform: [{ scale: scale.value * audioScale }],
			opacity: opacity.value,
		};
	});

	// Animated styles for the outer glow effect
	const glowAnimatedStyle = useAnimatedStyle(() => {
		const glowIntensity = interpolate(
			audioLevel.value,
			[0, 0.3, 0.7, 1],
			[0.3, 0.6, 0.8, 1]
		);

		const glowScale = interpolate(
			audioLevel.value,
			[0, 0.5, 1],
			[1.2, 1.5, 1.8]
		);

		return {
			transform: [{ scale: glowScale }],
			opacity: glowIntensity * 0.4,
		};
	});

	// Animated styles for the pulsing background
	const pulseAnimatedStyle = useAnimatedStyle(() => {
		const pulseScale = interpolate(
			audioLevel.value,
			[0, 0.5, 1],
			[1, 1.3, 1.6]
		);

		return {
			transform: [{ scale: pulseScale }],
			opacity: audioLevel.value * 0.2,
		};
	});

	return (
		<View style={[styles.container, { width: size, height: size }]}>
			{/* Pulsing background circle */}
			<Animated.View
				style={[
					styles.pulseBackground,
					{
						width: size * 1.5,
						height: size * 1.5,
						borderRadius: (size * 1.5) / 2,
						backgroundColor: color,
					},
					pulseAnimatedStyle,
				]}
			/>

			{/* Outer glow effect */}
			<Animated.View
				style={[
					styles.glowEffect,
					{
						width: size,
						height: size,
						borderRadius: size / 2,
						borderColor: color,
					},
					glowAnimatedStyle,
				]}
			/>

			{/* Main Lottie animation container */}
			<Animated.View
				style={[
					styles.lottieContainer,
					{
						width: size,
						height: size,
					},
					containerAnimatedStyle,
				]}
			>
				<LottieView
					ref={lottieRef}
					source={voicePulseAnimation}
					style={styles.lottie}
					loop={true}
					speed={isRecording ? 1 + currentVolume * 0.8 : 0.5}
					colorFilters={[
						{
							keypath: 'Outer Ring',
							color: color,
						},
						{
							keypath: 'Middle Ring',
							color: color,
						},
						{
							keypath: 'Center Circle',
							color: color,
						},
					]}
				/>
			</Animated.View>

			{/* Audio level indicator bars */}
			{isRecording && (
				<View style={styles.audioLevelContainer}>
					{Array.from({ length: 5 }).map((_, index) => (
						<AudioLevelBar
							key={index}
							level={audioLevel}
							index={index}
							color={color}
						/>
					))}
				</View>
			)}
		</View>
	);
};

// Individual audio level bar component
const AudioLevelBar: React.FC<{
	level: Animated.SharedValue<number>;
	index: number;
	color: string;
}> = ({ level, index, color }) => {
	const animatedStyle = useAnimatedStyle(() => {
		const threshold = index * 0.2; // 0, 0.2, 0.4, 0.6, 0.8
		const isActive = level.value > threshold;

		const height = interpolate(
			level.value,
			[threshold, threshold + 0.2],
			[8, 24],
			'clamp'
		);

		const opacity = withSpring(isActive ? 1 : 0.3, {
			damping: 12,
			stiffness: 150,
		});

		return {
			height: withSpring(height, { damping: 8, stiffness: 120 }),
			opacity,
		};
	});

	return (
		<Animated.View
			style={[
				styles.audioBar,
				{
					backgroundColor: color,
				},
				animatedStyle,
			]}
		/>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	pulseBackground: {
		position: 'absolute',
		borderRadius: 1000,
	},
	glowEffect: {
		position: 'absolute',
		borderWidth: 2,
		borderRadius: 1000,
	},
	lottieContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	lottie: {
		width: '100%',
		height: '100%',
	},
	audioLevelContainer: {
		position: 'absolute',
		bottom: -40,
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'center',
		gap: 4,
		zIndex: 3,
	},
	audioBar: {
		width: 4,
		borderRadius: 2,
		minHeight: 8,
	},
});

export default ModernVoiceVisualizer;
