import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	ActivityIndicator,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { getCategoriesWithCounts, Category } from '../services/categories';
import { showAlert } from '../utils/alert';

const { width } = Dimensions.get('window');

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

export default function CategoriesScreen() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const navigation = useNavigation<NavigationProp>();

	useEffect(() => {
		loadCategories();
	}, []);

	const loadCategories = async () => {
		try {
			setLoading(true);
			const categoriesData = await getCategoriesWithCounts();
			setCategories(categoriesData);
		} catch (error) {
			console.error('Error loading categories:', error);
			showAlert('Error', 'Failed to load categories');
		} finally {
			setLoading(false);
		}
	};

	const handleCategoryPress = (category: Category) => {
		// Navigate to books list filtered by category
		navigation.navigate('BooksList', {
			category: category.name,
			title: category.name,
		});
	};

	const renderCategoryCard = (category: Category, index: number) => {
		const cardWidth = (width - 48) / 2; // 2 columns with padding

		return (
			<TouchableOpacity
				key={category.name}
				style={[styles.categoryCard, { width: cardWidth }]}
				onPress={() => handleCategoryPress(category)}
				activeOpacity={0.7}
			>
				<View
					style={[
						styles.categoryIcon,
						{ backgroundColor: category.color + '20' },
					]}
				>
					<Ionicons
						name={category.icon as any}
						size={32}
						color={category.color}
					/>
				</View>
				<Text style={styles.categoryName}>{category.name}</Text>
				<Text style={styles.categoryDescription} numberOfLines={2}>
					{category.description}
				</Text>
				<View style={styles.bookCountContainer}>
					<Text style={styles.bookCount}>{category.count}</Text>
					<Text style={styles.bookCountLabel}>books</Text>
				</View>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
				<Text style={styles.loadingText}>Loading categories...</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name='arrow-back'
						size={24}
						color={colors.light.foreground}
					/>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Browse Categories</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Page Description */}
				<View style={styles.descriptionContainer}>
					<Text style={styles.descriptionTitle}>Explore by Genre</Text>
					<Text style={styles.descriptionText}>
						Discover books organized by categories. Find your next great read
						based on your interests.
					</Text>
				</View>

				{/* Categories Grid */}
				<View style={styles.categoriesGrid}>
					{categories.map(renderCategoryCard)}
				</View>

				{/* Popular Categories Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Most Popular</Text>
					<Text style={styles.sectionSubtitle}>
						Categories with the most books in our library
					</Text>

					<View style={styles.popularList}>
						{categories.slice(0, 5).map((category, index) => (
								<TouchableOpacity
								key={category.name}
									style={styles.popularItem}
									onPress={() => handleCategoryPress(category)}
								>
									<View
										style={[
											styles.popularIcon,
											{ backgroundColor: category.color + '20' },
										]}
									>
										<Ionicons
											name={category.icon as any}
											size={20}
											color={category.color}
										/>
									</View>
									<View style={styles.popularInfo}>
										<Text style={styles.popularName}>{category.name}</Text>
										<Text style={styles.popularCount}>
										{category.count} books
										</Text>
									</View>
									<Ionicons
										name='chevron-forward'
										size={20}
										color={colors.light.mutedForeground}
									/>
								</TouchableOpacity>
							))}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.light.background,
	},
	loadingText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.light.primary,
		marginTop: 10,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 16,
		backgroundColor: colors.light.card,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.light.foreground,
	},
	headerRight: {
		width: 40, // Balance the back button
	},
	container: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	descriptionContainer: {
		paddingHorizontal: 16,
		paddingVertical: 20,
	},
	descriptionTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 16,
		color: colors.light.mutedForeground,
		lineHeight: 22,
	},
	categoriesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},
	categoryCard: {
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
	categoryIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	categoryName: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 6,
		textAlign: 'center',
	},
	categoryDescription: {
		fontSize: 12,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 16,
		marginBottom: 12,
		minHeight: 32, // Consistent height for 2 lines
	},
	bookCountContainer: {
		alignItems: 'center',
	},
	bookCount: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.primary,
	},
	bookCountLabel: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	section: {
		paddingHorizontal: 16,
		paddingTop: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginBottom: 16,
	},
	popularList: {
		backgroundColor: colors.light.card,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.light.border,
		overflow: 'hidden',
	},
	popularItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	popularRank: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: colors.light.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	rankNumber: {
		fontSize: 12,
		fontWeight: 'bold',
		color: colors.light.primaryForeground,
	},
	popularIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	popularInfo: {
		flex: 1,
	},
	popularName: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.light.foreground,
		marginBottom: 2,
	},
	popularCount: {
		fontSize: 14,
		color: colors.light.mutedForeground,
	},
});
