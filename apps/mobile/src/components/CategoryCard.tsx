import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

type CategoryCardProps = {
	name: string;
	icon: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
	variant?: 'simple' | 'detailed';
	color?: string;
	description?: string;
	count?: number;
	countLabel?: string;
	style?: any;
	activeOpacity?: number;
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
	name,
	icon,
	onPress,
	variant = 'simple',
	color = colors.light.primary,
	description,
	count,
	countLabel = 'books',
	style,
	activeOpacity = 0.7,
}) => {
	if (variant === 'detailed') {
		return (
			<TouchableOpacity
				style={[styles.detailedCard, style]}
				onPress={onPress}
				activeOpacity={activeOpacity}
			>
				<View
					style={[
						styles.detailedIconContainer,
						{ backgroundColor: color + '20' },
					]}
				>
					<Ionicons name={icon} size={32} color={color} />
				</View>
				<Text style={styles.detailedName}>{name}</Text>
				{description && (
					<Text style={styles.description} numberOfLines={2}>
						{description}
					</Text>
				)}
				{count !== undefined && (
					<View style={styles.countContainer}>
						<Text style={[styles.count, { color }]}>{count}</Text>
						<Text style={styles.countLabel}>{countLabel}</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			style={[styles.simpleCard, style]}
			onPress={onPress}
			activeOpacity={activeOpacity}
		>
			<View style={styles.simpleIconContainer}>
				<Ionicons name={icon} size={24} color={color} />
			</View>
			<Text style={styles.simpleName}>{name}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	// Simple variant styles
	simpleCard: {
		alignItems: 'center',
		backgroundColor: colors.light.card,
		padding: 16,
		borderRadius: 12,
		marginRight: 12,
		minWidth: 80,
		marginVertical: 6,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: 5,
	},
	simpleIconContainer: {
		marginBottom: 8,
	},
	simpleName: {
		fontSize: 12,
		fontWeight: '500',
		color: colors.light.foreground,
		textAlign: 'center',
	},

	// Detailed variant styles
	detailedCard: {
		backgroundColor: colors.light.card,
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: colors.light.border,
		alignItems: 'center',
		shadowOffset: { width: 0, height: 0.5 },
		shadowOpacity: 0.15,
		shadowRadius: 3.84,
		elevation: 5,
	},
	detailedIconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	detailedName: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 6,
		textAlign: 'center',
	},
	description: {
		fontSize: 12,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 16,
		marginBottom: 12,
		minHeight: 32,
	},
	countContainer: {
		alignItems: 'center',
	},
	count: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	countLabel: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
});
