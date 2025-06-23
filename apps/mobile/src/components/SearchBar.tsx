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
	iconColor = colors.light.mutedForeground,
}) => {
	const handleClear = () => {
		onChangeText('');
	};

	return (
		<View style={[styles.container, containerStyle]}>
			<View style={styles.searchBar}>
				<Ionicons
					name={iconName}
					size={iconSize}
					color={iconColor}
					style={styles.searchIcon}
				/>
				<TextInput
					style={[styles.searchInput, inputStyle]}
					placeholder={placeholder}
					placeholderTextColor={colors.light.mutedForeground}
					value={value}
					onChangeText={onChangeText}
				/>
				{showClearButton && value.length > 0 && (
					<TouchableOpacity onPress={handleClear} style={styles.clearButton}>
						<Ionicons name='close-circle' size={iconSize} color={iconColor} />
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
		backgroundColor: colors.light.card,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	searchIcon: {
		marginRight: 12,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: colors.light.foreground,
		height: 24,
	},
	clearButton: {
		padding: 4,
	},
});
