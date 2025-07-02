// Will be a round component with a plus sign that will
// be used as the last carousel item in the home screen for seeing all books / categories
// will also have the color variation based on current theme

import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../utils/colors';
import { useNavigation } from '@react-navigation/native';

export const SeeMore = ({
	variant = 'books',
}: {
	variant?: 'books' | 'categories';
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];
	const navigation = useNavigation<any>();

	const handlePress = () => {
		if (variant === 'categories') {
			navigation.navigate('Categories');
		} else {
			navigation.navigate('BooksList');
		}
	};

	return (
		<View
			style={
				variant === 'categories'
					? styles.categoriesWrapper
					: styles.booksWrapper
			}
		>
			<TouchableOpacity
				style={[styles.container, { backgroundColor: currentColors.card }]}
				onPress={handlePress}
			>
				<Ionicons name="add" size={24} color={currentColors.primary} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	booksWrapper: {
		width: 50,
		height: 160, // Match book cover height
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16, // Match book card margin
	},
	categoriesWrapper: {
		width: 50,
		height: 100, // Match category card height
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16, // Match category card margin
	},
});
