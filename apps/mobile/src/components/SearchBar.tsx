import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';

type SearchBarProps = {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	showClearButton?: boolean;
	containerStyle?: any;
	inputStyle?: any;
	iconName?: keyof typeof Ionicons.glyphMap;
	iconSize?: number;
	iconColor?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
	value,
	onChangeText,
	placeholder = 'Search...',
	showClearButton = true,
	containerStyle,
	inputStyle,
	iconName = 'search',
	iconSize = 20,
	iconColor,
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];

	const handleClear = () => {
		onChangeText('');
	};

	const finalIconColor = iconColor || currentColors.mutedForeground;

	return (
		<View style={[styles.container, containerStyle]}>
			<View
				style={[
					styles.searchBar,
					{
						backgroundColor: currentColors.card,
						borderColor: currentColors.border,
					},
				]}
			>
				<Ionicons
					name={iconName}
					size={iconSize}
					color={finalIconColor}
					style={styles.searchIcon}
				/>
				<TextInput
					style={[
						styles.searchInput,
						{ color: currentColors.foreground },
						inputStyle,
					]}
					placeholder={placeholder}
					placeholderTextColor={currentColors.mutedForeground}
					value={value}
					onChangeText={onChangeText}
				/>
				{showClearButton && value.length > 0 && (
					<TouchableOpacity onPress={handleClear} style={styles.clearButton}>
						<Ionicons
							name='close-circle'
							size={iconSize}
							color={finalIconColor}
						/>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
	},
	searchIcon: {
		marginRight: 12,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		height: 24,
	},
	clearButton: {
		padding: 4,
	},
});
