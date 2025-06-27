import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';

// Props for the header
// - showBackButton: show/hide back button
// - onBackPress: handler for back button
// - rightComponent: e.g., MessageCounterBadge
// - containerStyle, titleStyle, etc. for overrides
// - backgroundColor, backButtonIconName, etc. for customizations

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
	backButtonIconName = 'arrow-back',
	backButtonIconSize = 24,
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];

	return (
		<View
			style={[
				styles.header,
				{
					backgroundColor: currentColors.card,
					borderBottomColor: currentColors.border,
				},
				containerStyle,
			]}
		>
			{/* Left: Back button or placeholder */}
			{showBackButton ? (
				<TouchableOpacity
					style={[styles.backButton, backButtonStyle]}
					onPress={onBackPress}
				>
					<Ionicons
						name={backButtonIconName}
						size={backButtonIconSize}
						color={currentColors.foreground}
					/>
				</TouchableOpacity>
			) : (
				<View style={styles.backButton} />
			)}

			{/* Center: Title */}
			<Text
				style={[
					styles.headerTitle,
					titleStyle,
					{ color: currentColors.foreground },
				]}
				numberOfLines={1}
			>
				{title}
			</Text>

			{/* Right: Custom component or placeholder */}
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
	},
	backButton: {
		padding: 4,
		minWidth: 32,
		alignItems: 'flex-start',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		flex: 1,
	},
	rightComponent: {
		minWidth: 32,
		alignItems: 'flex-end',
	},
});
