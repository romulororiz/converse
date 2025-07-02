import React, { useState, useEffect, useMemo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	ActivityIndicator,
	Dimensions,
	RefreshControl,
	StatusBar,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategoriesWithCounts, Category } from '../services/categories';
import { showAlert } from '../utils/alert';
import { useTheme } from '../contexts/ThemeContext';
import { SearchBar } from '../components/SearchBar';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';

const { width } = Dimensions.get('window');

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

type SortOption = 'name' | 'count' | 'alphabetical';

export default function CategoriesScreen() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<SortOption>('count');
	const [error, setError] = useState<string | null>(null);

	const navigation = useNavigation<NavigationProp>();
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];

	// Filter and sort categories based on search and sort options
	const filteredAndSortedCategories = useMemo(() => {
		let filtered = categories.filter(
			category =>
				category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				category.description.toLowerCase().includes(searchQuery.toLowerCase())
		);

		switch (sortBy) {
			case 'name':
			case 'alphabetical':
				return filtered.sort((a, b) => a.name.localeCompare(b.name));
			case 'count':
				return filtered.sort((a, b) => (b.count || 0) - (a.count || 0));
			default:
				return filtered;
		}
	}, [categories, searchQuery, sortBy]);

	useEffect(() => {
		loadCategories();
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			if (categories.length === 0) {
				loadCategories();
			}
		}, [])
	);

	const loadCategories = async (showRefreshLoader = false) => {
		try {
			if (showRefreshLoader) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}
			setError(null);

			const categoriesData = await getCategoriesWithCounts();
			setCategories(categoriesData);
		} catch (error) {
			console.error('Error loading categories:', error);
			setError('Failed to load categories. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const handleRefresh = () => {
		loadCategories(true);
	};

	const handleCategoryPress = (category: Category) => {
		navigation.navigate('BooksList', {
			category: category.name,
			title: category.name,
		});
	};

	const handleSortPress = () => {
		const sortOptions = [
			{ label: 'Most Books', value: 'count' },
			{ label: 'Alphabetical', value: 'alphabetical' },
		];

		// Simple toggle between sort options for now
		setSortBy(current => (current === 'count' ? 'alphabetical' : 'count'));
	};

	const renderSkeletonGrid = () => (
		<View style={styles.categoriesGrid}>
			{Array.from({ length: 6 }).map((_, index) => (
				<View
					key={index}
					style={[styles.categoryCard, { backgroundColor: currentColors.card }]}
				>
					<SkeletonLoader
						width={64}
						height={64}
						borderRadius={32}
						style={{ marginBottom: 12 }}
					/>
					<SkeletonLoader width={80} height={16} style={{ marginBottom: 6 }} />
					<SkeletonLoader
						width={100}
						height={32}
						style={{ marginBottom: 12 }}
					/>
					<SkeletonLoader width={40} height={20} />
				</View>
			))}
		</View>
	);

	const renderCategoryCard = (category: Category, index: number) => {
		const cardWidth = (width - 48) / 2; // 2 columns with padding

		return (
			<TouchableOpacity
				key={category.name}
				style={[
					styles.categoryCard,
					{
						width: cardWidth,
						backgroundColor: currentColors.card,
						borderColor: currentColors.border,
					},
				]}
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
				<Text
					style={[styles.categoryName, { color: currentColors.foreground }]}
				>
					{category.name}
				</Text>
				<Text
					style={[
						styles.categoryDescription,
						{ color: currentColors.mutedForeground },
					]}
					numberOfLines={2}
				>
					{category.description}
				</Text>
				<View style={styles.bookCountContainer}>
					<Text style={[styles.bookCount, { color: currentColors.primary }]}>
						{category.count || 0}
					</Text>
					<Text
						style={[
							styles.bookCountLabel,
							{ color: currentColors.mutedForeground },
						]}
					>
						{(category.count || 0) === 1 ? 'book' : 'books'}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	const renderPopularSection = () => {
		const topCategories = filteredAndSortedCategories.slice(0, 5);

		if (topCategories.length === 0) return null;

		return (
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Text
						style={[styles.sectionTitle, { color: currentColors.foreground }]}
					>
						Most Popular
					</Text>
					<Text
						style={[
							styles.sectionSubtitle,
							{ color: currentColors.mutedForeground },
						]}
					>
						Categories with the most books
					</Text>
				</View>

				<View
					style={[
						styles.popularList,
						{
							backgroundColor: currentColors.card,
							borderColor: currentColors.border,
						},
					]}
				>
					{topCategories.map((category, index) => (
						<TouchableOpacity
							key={category.name}
							style={[
								styles.popularItem,
								index < topCategories.length - 1 && {
									borderBottomColor: currentColors.border,
								},
							]}
							onPress={() => handleCategoryPress(category)}
						>
							<View style={styles.popularRank}>
								<Text
									style={[
										styles.rankNumber,
										{ color: currentColors.primaryForeground },
									]}
								>
									{index + 1}
								</Text>
							</View>
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
								<Text
									style={[
										styles.popularName,
										{ color: currentColors.foreground },
									]}
								>
									{category.name}
								</Text>
								<Text
									style={[
										styles.popularCount,
										{ color: currentColors.mutedForeground },
									]}
								>
									{category.count || 0}{' '}
									{(category.count || 0) === 1 ? 'book' : 'books'}
								</Text>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={currentColors.mutedForeground}
							/>
						</TouchableOpacity>
					))}
				</View>
			</View>
		);
	};

	if (loading && categories.length === 0) {
		return (
			<SafeAreaView
				style={[styles.safeArea, { backgroundColor: currentColors.background }]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>

				{/* Header */}
				<View
					style={[
						styles.header,
						{
							backgroundColor: currentColors.card,
							borderBottomColor: currentColors.border,
						},
					]}
				>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Ionicons
							name="arrow-back"
							size={24}
							color={currentColors.foreground}
						/>
					</TouchableOpacity>
					<Text
						style={[styles.headerTitle, { color: currentColors.foreground }]}
					>
						Browse Categories
					</Text>
					<View style={styles.headerRight} />
				</View>

				<ScrollView
					style={[
						styles.container,
						{ backgroundColor: currentColors.background },
					]}
				>
					{/* Description */}
					<View style={styles.descriptionContainer}>
						<SkeletonLoader
							width={200}
							height={24}
							style={{ marginBottom: 8 }}
						/>
						<SkeletonLoader width={width - 32} height={44} />
					</View>

					{/* Search Bar Skeleton */}
					<View style={styles.searchContainer}>
						<SkeletonLoader width={width - 32} height={48} borderRadius={12} />
					</View>

					{/* Categories Grid Skeleton */}
					{renderSkeletonGrid()}
				</ScrollView>
			</SafeAreaView>
		);
	}

	if (error && categories.length === 0) {
		return (
			<SafeAreaView
				style={[styles.safeArea, { backgroundColor: currentColors.background }]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>

				{/* Header */}
				<View
					style={[
						styles.header,
						{
							backgroundColor: currentColors.card,
							borderBottomColor: currentColors.border,
						},
					]}
				>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Ionicons
							name="arrow-back"
							size={24}
							color={currentColors.foreground}
						/>
					</TouchableOpacity>
					<Text
						style={[styles.headerTitle, { color: currentColors.foreground }]}
					>
						Browse Categories
					</Text>
					<View style={styles.headerRight} />
				</View>

				<View
					style={[
						styles.container,
						{ backgroundColor: currentColors.background },
					]}
				>
					<EmptyState
						icon={{
							name: 'library-outline',
							size: 64,
							color: currentColors.mutedForeground,
						}}
						title="Unable to load categories"
						subtitle={error}
						button={{
							text: 'Try Again',
							onPress: () => loadCategories(),
							style: 'primary',
						}}
					/>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.safeArea, { backgroundColor: currentColors.background }]}
		>
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor={currentColors.background}
			/>

			{/* Header */}
			<View
				style={[
					styles.header,
					{
						backgroundColor: currentColors.card,
						borderBottomColor: currentColors.border,
					},
				]}
			>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name="arrow-back"
						size={24}
						color={currentColors.foreground}
					/>
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: currentColors.foreground }]}>
					Browse Categories
				</Text>
				<TouchableOpacity style={styles.sortButton} onPress={handleSortPress}>
					<Ionicons
						name={sortBy === 'count' ? 'trending-up' : 'text'}
						size={20}
						color={currentColors.primary}
					/>
				</TouchableOpacity>
			</View>

			<ScrollView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={[currentColors.primary]}
						tintColor={currentColors.primary}
					/>
				}
			>
				{/* Page Description */}
				<View style={styles.descriptionContainer}>
					<Text
						style={[
							styles.descriptionTitle,
							{ color: currentColors.foreground },
						]}
					>
						Explore by Genre
					</Text>
					<Text
						style={[
							styles.descriptionText,
							{ color: currentColors.mutedForeground },
						]}
					>
						Discover books organized by categories. Find your next great read
						based on your interests.
					</Text>
				</View>

				{/* Search Bar */}
				<SearchBar
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholder="Search categories..."
					containerStyle={[
						styles.searchContainer,
						{ backgroundColor: currentColors.background },
					]}
					inputStyle={{ color: currentColors.foreground }}
					iconColor={currentColors.mutedForeground}
				/>

				{/* Categories Grid */}
				{filteredAndSortedCategories.length > 0 ? (
					<>
						<View style={styles.categoriesGrid}>
							{filteredAndSortedCategories.map(renderCategoryCard)}
						</View>

						{/* Popular Categories Section - only show if not searching */}
						{!searchQuery && renderPopularSection()}
					</>
				) : (
					<EmptyState
						icon={{
							name: 'search-outline',
							size: 48,
							color: currentColors.mutedForeground,
						}}
						title="No categories found"
						subtitle={
							searchQuery
								? `No categories match "${searchQuery}"`
								: 'No categories available'
						}
						button={
							searchQuery
								? {
										text: 'Clear Search',
										onPress: () => setSearchQuery(''),
										style: 'secondary',
								  }
								: undefined
						}
					/>
				)}

				{/* Results Info */}
				{filteredAndSortedCategories.length > 0 && (
					<View style={styles.resultsInfo}>
						<Text
							style={[
								styles.resultsText,
								{ color: currentColors.mutedForeground },
							]}
						>
							{searchQuery
								? `${filteredAndSortedCategories.length} result${
										filteredAndSortedCategories.length === 1 ? '' : 's'
								  } for "${searchQuery}"`
								: `${categories.length} categor${
										categories.length === 1 ? 'y' : 'ies'
								  } available`}
						</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 16,
		borderBottomWidth: 1,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	headerRight: {
		width: 40,
	},
	sortButton: {
		padding: 8,
		marginRight: -8,
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	descriptionContainer: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20,
	},
	descriptionTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 14,
	},
	searchContainer: {
		paddingHorizontal: 16,
		paddingBottom: 30,
		paddingTop: -10,
	},
	categoriesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},
	categoryCard: {
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		alignItems: 'center',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
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
		marginBottom: 6,
		textAlign: 'center',
	},
	categoryDescription: {
		fontSize: 12,
		textAlign: 'center',
		lineHeight: 16,
		marginBottom: 12,
		minHeight: 32,
	},
	bookCountContainer: {
		alignItems: 'center',
	},
	bookCount: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	bookCountLabel: {
		fontSize: 12,
	},
	section: {
		paddingHorizontal: 16,
		paddingTop: 32,
	},
	sectionHeader: {
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	sectionSubtitle: {
		fontSize: 14,
	},
	popularList: {
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
	},
	popularItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
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
		marginBottom: 2,
	},
	popularCount: {
		fontSize: 14,
	},
	resultsInfo: {
		paddingHorizontal: 16,
		paddingTop: 16,
		alignItems: 'center',
	},
	resultsText: {
		fontSize: 14,
		fontStyle: 'italic',
	},
});
