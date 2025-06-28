import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { validateSearchQuery } from '../utils/validation';

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
	validateInput?: boolean;
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
	validateInput = true,
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];

	const handleClear = () => {
		onChangeText('');
	};

	const handleChangeText = (text: string) => {
		if (validateInput && text.trim()) {
			try {
				validateSearchQuery(text);
				onChangeText(text);
			} catch (error) {
				// Silently ignore validation errors for search input
				// as users should be able to type freely
				onChangeText(text);
			}
		} else {
			onChangeText(text);
		}
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
					onChangeText={handleChangeText}
					textAlignVertical={Platform.OS === 'android' ? 'center' : undefined}
				/>
				{showClearButton && value.length > 0 && (
					<TouchableOpacity onPress={handleClear} style={styles.clearButton}>
						<Ionicons
							name="close-circle"
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
		height: Platform.OS === 'android' ? 32 : 24,
		paddingVertical: Platform.OS === 'android' ? 4 : 0,
	},
	clearButton: {
		padding: 4,
	},
});
