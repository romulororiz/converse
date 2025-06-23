import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';

type SectionHeaderProps = {
	title: string;
	subtitle?: string;
	actionText?: string;
	onActionPress?: () => void;
	titleStyle?: any;
	subtitleStyle?: any;
	actionTextStyle?: any;
	containerStyle?: any;
	showAction?: boolean;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
	title,
	subtitle,
	actionText = 'See All',
	onActionPress,
	titleStyle,
	subtitleStyle,
	actionTextStyle,
	containerStyle,
	showAction = true,
}) => {
	return (
		<View style={[styles.container, containerStyle]}>
			<View style={styles.titleContainer}>
				<Text style={[styles.title, titleStyle]}>{title}</Text>
				{subtitle && (
					<Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
				)}
			</View>

			{showAction && onActionPress && (
				<TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
					<Text style={[styles.actionText, actionTextStyle]}>{actionText}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
		paddingHorizontal: 4,
	},
	titleContainer: {
		flex: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 2,
	},
	subtitle: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		lineHeight: 18,
	},
	actionButton: {
		paddingVertical: 4,
		paddingLeft: 8,
	},
	actionText: {
		color: colors.light.primary,
		fontSize: 14,
		fontWeight: '500',
	},
});
