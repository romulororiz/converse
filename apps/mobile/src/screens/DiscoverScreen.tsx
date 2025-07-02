import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
	StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { getCategoriesWithCounts, type Category } from '../services/categories';
import { ScreenHeader } from '../components';

const { width } = Dimensions.get('window');

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

export default function DiscoverScreen() {
	const navigation = useNavigation<NavigationProp>();
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadCategories();
	}, []);

	const loadCategories = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await getCategoriesWithCounts();
			setCategories(data);
		} catch (err) {
			console.error('Error loading categories:', err);
			setError('Failed to load categories. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const toggleCategory = (categoryName: string) => {
		setSelectedCategories(prev =>
			prev.includes(categoryName)
				? prev.filter(c => c !== categoryName)
				: [...prev, categoryName]
		);
	};

	const handleFindBooks = () => {
		if (selectedCategories.length === 0) return;

		console.log('🔍 DiscoverScreen - Selected categories:', selectedCategories);
		console.log('🔍 DiscoverScreen - Navigation params:', {
			categories: selectedCategories,
			title: 'Discover Results',
		});

		// Navigate to BooksList with selected categories as filter
		navigation.navigate('BooksList', {
			categories: selectedCategories,
			title: 'Discover Results',
		});
	};

	const clearAllCategories = () => {
		setSelectedCategories([]);
	};

	const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
		const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
			heart: 'heart',
			library: 'library',
			search: 'search',
			map: 'map',
			rocket: 'rocket',
			skull: 'skull',
			time: 'time',
			bulb: 'bulb',
			happy: 'happy',
			sparkles: 'sparkles',
			videocam: 'videocam',
			star: 'star',
			'trending-up': 'trending-up',
			flag: 'flag',
			shield: 'shield',
			people: 'people',
			eye: 'eye',
			'happy-outline': 'happy-outline',
			home: 'home',
			leaf: 'leaf',
		};
		return iconMap[iconName] || 'book';
	};

	const renderSkeletonCategories = () => (
		<View style={styles.categoriesContainer}>
			{Array.from({ length: 8 }).map((_, index) => (
				<View key={index} style={styles.categoryCard}>
					<SkeletonLoader width={60} height={60} borderRadius={30} />
					<SkeletonLoader
						width={100}
						height={16}
						borderRadius={8}
						style={{ marginTop: 12 }}
					/>
					<SkeletonLoader
						width={80}
						height={12}
						borderRadius={6}
						style={{ marginTop: 4 }}
					/>
					<SkeletonLoader
						width={40}
						height={12}
						borderRadius={6}
						style={{ marginTop: 8 }}
					/>
				</View>
			))}
		</View>
	);

	const renderCategory = (category: Category) => {
		const isSelected = selectedCategories.includes(category.name);

		return (
			<TouchableOpacity
				key={category.name}
				style={[
					styles.categoryCard,
					isSelected
						? [
								styles.categoryCardSelected,
								{
									backgroundColor: currentColors.primary + '15',
									borderColor: currentColors.primary,
								},
						  ]
						: [
								styles.categoryCardDefault,
								{
									backgroundColor: currentColors.card,
									borderColor: currentColors.border,
								},
						  ],
				]}
				onPress={() => toggleCategory(category.name)}
				activeOpacity={0.7}
			>
				<View
					style={[
						styles.categoryIcon,
						{
							backgroundColor: isSelected
								? currentColors.primary
								: category.color + '20',
						},
					]}
				>
					<Ionicons
						name={getIconName(category.icon)}
						size={24}
						color={
							isSelected ? currentColors.primaryForeground : category.color
						}
					/>
				</View>

				<Text
					style={[styles.categoryName, { color: currentColors.foreground }]}
					numberOfLines={2}
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

				<Text style={[styles.categoryCount, { color: currentColors.primary }]}>
					{category.count} book{category.count !== 1 ? 's' : ''}
				</Text>
			</TouchableOpacity>
		);
	};

	if (error) {
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
						Discover Books
					</Text>
					<View style={styles.headerRight} />
				</View>

				{/* Error State */}
				<View style={styles.errorContainer}>
					<Ionicons
						name="alert-circle"
						size={48}
						color={currentColors.mutedForeground}
					/>
					<Text
						style={[styles.errorTitle, { color: currentColors.foreground }]}
					>
						Oops! Something went wrong
					</Text>
					<Text
						style={[styles.errorText, { color: currentColors.mutedForeground }]}
					>
						{error}
					</Text>
					<TouchableOpacity
						style={[
							styles.retryButton,
							{ backgroundColor: currentColors.primary },
						]}
						onPress={loadCategories}
					>
						<Text
							style={[
								styles.retryButtonText,
								{ color: currentColors.primaryForeground },
							]}
						>
							Try Again
						</Text>
					</TouchableOpacity>
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
			{/* <ScreenHeader
				title="Discover Books"
				showBackButton={true}
				onBackPress={() => navigation.goBack()}
			/> */}
			{/* Fixed Header */}
			<View
				style={[
					styles.fixedContent,
					{ backgroundColor: currentColors.background },
				]}
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
						Choose your favorite genres to discover amazing books. Each category
						shows the number of available books.
					</Text>
				</View>

				{/* Selected count and clear button */}
				{selectedCategories.length > 0 && (
					<View
						style={[
							styles.selectedInfo,
							{ borderTopColor: currentColors.border },
						]}
					>
						<Text
							style={[
								styles.selectedCount,
								{ color: currentColors.foreground },
							]}
						>
							{selectedCategories.length} genre
							{selectedCategories.length !== 1 ? 's' : ''} selected
						</Text>
						<TouchableOpacity
							onPress={clearAllCategories}
							style={styles.clearButton}
						>
							<Text
								style={[
									styles.clearButtonText,
									{ color: currentColors.primary },
								]}
							>
								Clear All
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{/* Scrollable Categories Content */}
			<ScrollView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Categories Grid */}
				{isLoading ? (
					renderSkeletonCategories()
				) : (
					<View style={styles.categoriesContainer}>
						{categories.map(renderCategory)}
					</View>
				)}

				{/* Bottom spacing for find books button */}
				<View style={styles.bottomSpacing} />
			</ScrollView>

			{/* Fixed Find Books Button */}
			<View
				style={[
					styles.bottomContainer,
					{
						backgroundColor: currentColors.background,
						borderTopColor: currentColors.border,
					},
				]}
			>
				<TouchableOpacity
					style={[
						styles.findBooksButton,
						selectedCategories.length > 0
							? { backgroundColor: currentColors.primary }
							: { backgroundColor: currentColors.muted, opacity: 0.5 },
					]}
					onPress={handleFindBooks}
					disabled={selectedCategories.length === 0}
					activeOpacity={0.8}
				>
					<Text
						style={[
							styles.findBooksButtonText,
							{
								color:
									selectedCategories.length > 0
										? currentColors.primaryForeground
										: currentColors.mutedForeground,
							},
						]}
					>
						Find Books ({selectedCategories.length})
					</Text>
					<Ionicons
						name="arrow-forward"
						size={20}
						color={
							selectedCategories.length > 0
								? currentColors.primaryForeground
								: currentColors.mutedForeground
						}
					/>
				</TouchableOpacity>
			</View>
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
	fixedContent: {
		// Fixed content that doesn't scroll
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 8,
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
		lineHeight: 20,
	},
	selectedInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
	},
	selectedCount: {
		fontSize: 14,
		fontWeight: '500',
	},
	clearButton: {
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	clearButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	categoriesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
		marginBottom: 20,
	},
	categoryCard: {
		width: (width - 48) / 2, // 2 columns with 16px margins and 16px gap
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		alignItems: 'center',
		minHeight: 160,
	},
	categoryCardDefault: {
		// backgroundColor and borderColor will be set dynamically
	},
	categoryCardSelected: {
		// backgroundColor and borderColor will be set dynamically
		borderWidth: 2,
	},
	categoryIcon: {
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	categoryName: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 8,
		lineHeight: 20,
	},
	categoryDescription: {
		fontSize: 12,
		textAlign: 'center',
		lineHeight: 16,
		marginBottom: 8,
		flex: 1,
	},
	categoryCount: {
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	errorTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	errorText: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 24,
	},
	retryButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	retryButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	bottomSpacing: {
		height: 20,
	},
	bottomContainer: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: 1,
	},
	findBooksButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
	},
	findBooksButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
