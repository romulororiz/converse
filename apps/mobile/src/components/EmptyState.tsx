import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';

type EmptyStateProps = {
	icon: {
		name: keyof typeof Ionicons.glyphMap;
		size: number;
		color: string;
	};
	title: string;
	subtitle: string;
	button?: {
		text: string;
		onPress: () => void;
		style?: 'primary' | 'secondary';
	};
	containerStyle?: any;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
	icon,
	title,
	subtitle,
	button,
	containerStyle,
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: currentColors.background },
				containerStyle,
			]}
		>
			<Ionicons name={icon.name} size={icon.size} color={icon.color} />
			<Text style={[styles.title, { color: currentColors.foreground }]}>
				{title}
			</Text>
			<Text style={[styles.subtitle, { color: currentColors.mutedForeground }]}>
				{subtitle}
			</Text>

			{button && (
				<TouchableOpacity
					style={[
						styles.button,
						button.style === 'secondary'
							? [
									styles.buttonSecondary,
									{
										backgroundColor: currentColors.secondary,
										borderColor: currentColors.border,
									},
								]
							: [
									styles.buttonPrimary,
									{ backgroundColor: currentColors.primary },
								],
					]}
					onPress={button.onPress}
				>
					<Text
						style={[
							styles.buttonText,
							button.style === 'secondary'
								? [
										styles.buttonTextSecondary,
										{ color: currentColors.foreground },
									]
								: [
										styles.buttonTextPrimary,
										{ color: currentColors.primaryForeground },
									],
						]}
					>
						{button.text}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		paddingVertical: 40,
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 20,
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	buttonPrimary: {
		backgroundColor: colors.light.primary,
	},
	buttonSecondary: {
		backgroundColor: colors.light.secondary,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	buttonTextPrimary: {
		color: colors.light.primaryForeground,
	},
	buttonTextSecondary: {
		color: colors.light.foreground,
	},
});
