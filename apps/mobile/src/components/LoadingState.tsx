import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';

type LoadingStateProps = {
	size?: 'small' | 'large';
	text?: string;
	style?: 'centered' | 'inline';
	containerStyle?: any;
	color?: string;
	textStyle?: any;
	hideText?: boolean;
};

export const LoadingState: React.FC<LoadingStateProps> = ({
	size = 'large',
	text = 'Loading...',
	style = 'centered',
	containerStyle,
	color,
	textStyle,
	hideText = false,
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];
	const isInline = style === 'inline';

	// Use theme color if not explicitly provided
	const indicatorColor = color || currentColors.primary;

	return (
		<View
			style={[
				isInline ? styles.inlineContainer : styles.centeredContainer,
				{ backgroundColor: currentColors.background },
				containerStyle,
			]}
		>
			<ActivityIndicator size={size} color={indicatorColor} />
			{!hideText && text && (
				<Text
					style={[
						isInline ? styles.inlineText : styles.centeredText,
						{ color: currentColors.mutedForeground },
						textStyle,
					]}
				>
					{text}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	centeredContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 20,
	},
	inlineContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
	},
	centeredText: {
		marginTop: 12,
		fontSize: 16,
		color: colors.light.mutedForeground,
		textAlign: 'center',
	},
	inlineText: {
		marginLeft: 12,
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
});
