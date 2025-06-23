import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

type ScreenHeaderProps = {
	title: string;
	showBackButton?: boolean;
	onBackPress?: () => void;
	rightComponent?: React.ReactNode;
	containerStyle?: any;
	titleStyle?: any;
	backButtonStyle?: any;
	backgroundColor?: string;
	backButtonIconName?: keyof typeof Ionicons.glyphMap;
	backButtonIconSize?: number;
	backButtonIconColor?: string;
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
	title,
	showBackButton = true,
	onBackPress,
	rightComponent,
	containerStyle,
	titleStyle,
	backButtonStyle,
	backgroundColor = colors.light.cardForeground,
	backButtonIconName = 'arrow-back',
	backButtonIconSize = 24,
	backButtonIconColor = colors.light.foreground,
}) => {
	return (
		<View style={[styles.header, { backgroundColor }, containerStyle]}>
			{showBackButton ? (
				<TouchableOpacity
					style={[styles.backButton, backButtonStyle]}
					onPress={onBackPress}
				>
					<Ionicons
						name={backButtonIconName}
						size={backButtonIconSize}
						color={backButtonIconColor}
					/>
				</TouchableOpacity>
			) : (
				<View style={styles.backButton} />
			)}

			<Text style={[styles.headerTitle, titleStyle]}>{title}</Text>

			{rightComponent ? (
				<View style={styles.rightComponent}>{rightComponent}</View>
			) : (
				<View style={styles.rightComponent} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		paddingTop: 20,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	backButton: {
		padding: 4,
		minWidth: 32,
		alignItems: 'flex-start',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.light.foreground,
		textAlign: 'center',
		flex: 1,
	},
	rightComponent: {
		minWidth: 32,
		alignItems: 'flex-end',
	},
});
