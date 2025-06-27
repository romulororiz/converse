import React, { useState, useEffect, useMemo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Image,
	ActivityIndicator,
	TextInput,
	SafeAreaView,
	StatusBar,
	RefreshControl,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import {
	getAllBooks,
	searchBooks,
	searchBooksInCategory,
} from '../services/books';
import {
	searchBooksByCategory,
	searchBooksByCategorySimple,
} from '../services/categories';
import { Book } from '../types/supabase';
import { BookCover } from '../components/BookCover';
import { EmptyState } from '../components/EmptyState';
import { SearchBar } from '../components/SearchBar';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { MessageCounterBadge } from '../components/MessageCounterBadge';
import { PremiumPaywallDrawer } from '../components/PremiumPaywallDrawer';
import { ScreenHeader } from '../components';
import { useSubscription } from '../contexts/SubscriptionContext';

const { width } = Dimensions.get('window');

type SortOption = 'title' | 'author' | 'rating' | 'year' | 'newest';

export default function BooksListScreen({ navigation, route }: any) {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<SortOption>('title');
	const [error, setError] = useState<string | null>(null);
	const [badgeRefreshKey, setBadgeRefreshKey] = useState(0);
	const [showPaywall, setShowPaywall] = useState(false);

	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];
	const {
		subscription,
		loading: subLoading,
		refreshSubscription,
	} = useSubscription();

	// Get route parameters
	const { category, categoryId, categories, tags, title } = route?.params || {};
	const screenTitle = title || category || 'All Books';

	// Filter and sort books based on search and sort options
	const filteredAndSortedBooks = useMemo(() => {
		let filtered = books;

		// Apply search filter
		if (searchQuery.trim()) {
			filtered = books.filter(
				book =>
					book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(book.author &&
						book.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
					(book.description &&
						book.description.toLowerCase().includes(searchQuery.toLowerCase()))
			);
		}

		// Apply sorting
		switch (sortBy) {
			case 'title':
				return filtered.sort((a, b) => a.title.localeCompare(b.title));
			case 'author':
				return filtered.sort((a, b) =>
					(a.author || '').localeCompare(b.author || '')
				);
			case 'rating':
				return filtered.sort((a, b) => {
					const ratingA = (a.metadata as any)?.rating || 0;
					const ratingB = (b.metadata as any)?.rating || 0;
					return ratingB - ratingA;
				});
			case 'year':
				return filtered.sort((a, b) => {
					const yearA = (a.metadata as any)?.year || 0;
					const yearB = (b.metadata as any)?.year || 0;
					return yearB - yearA;
				});
			case 'newest':
				return filtered.sort(
					(a, b) =>
						new Date(b.created_at || 0).getTime() -
						new Date(a.created_at || 0).getTime()
				);
			default:
				return filtered;
		}
	}, [books, searchQuery, sortBy]);

	useEffect(() => {
		loadBooks();
	}, [category, categories]);

	useFocusEffect(
		React.useCallback(() => {
			if (books.length === 0) {
				loadBooks();
			}
			setBadgeRefreshKey(k => k + 1); // Force badge refresh on focus
		}, [])
	);

	const loadBooks = async (showRefreshLoader = false) => {
		try {
			if (showRefreshLoader) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}
			setError(null);

			let booksToShow: Book[];

			// Debug logging
			console.log(
				'🔍 BooksListScreen loadBooks - Route params:',
				route?.params
			);
			console.log('🔍 Category:', category);
			console.log('🔍 Categories:', categories);

			if (category) {
				console.log('🔍 Searching by single category:', category);
				// Temporarily use the simpler approach for testing
				booksToShow = await searchBooksByCategorySimple(category);
				console.log('🔍 Single category results:', booksToShow.length, 'books');
			} else if (categories && categories.length > 0) {
				console.log('🔍 Searching by multiple categories:', categories);
				// For multiple categories, search each one and combine results
				const allBooks = await Promise.all(
					categories.map((cat: string) => {
						console.log('🔍 Searching category:', cat);
						// Temporarily use the simpler approach for testing
						return searchBooksByCategorySimple(cat);
					})
				);
				console.log(
					'🔍 Individual category results:',
					allBooks.map(books => books.length)
				);
				// Flatten the results and remove duplicates based on book ID
				const flatBooks = allBooks.flat();
				const uniqueBooks = flatBooks.filter(
					(book, index, self) => index === self.findIndex(b => b.id === book.id)
				);
				booksToShow = uniqueBooks;
				console.log('🔍 Combined unique results:', booksToShow.length, 'books');
			} else {
				console.log('🔍 Loading all books (no category filter)');
				booksToShow = await getAllBooks();
				console.log('🔍 All books results:', booksToShow.length, 'books');
			}

			setBooks(booksToShow);
		} catch (error) {
			console.error('Error loading books:', error);
			setError('Failed to load books. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const handleRefresh = () => {
		loadBooks(true);
	};

	const handleSortPress = () => {
		const sortOptions: SortOption[] = [
			'title',
			'author',
			'rating',
			'year',
			'newest',
		];
		const currentIndex = sortOptions.indexOf(sortBy);
		const nextIndex = (currentIndex + 1) % sortOptions.length;
		setSortBy(sortOptions[nextIndex]);
	};

	const getSortIcon = () => {
		switch (sortBy) {
			case 'title':
			case 'author':
				return 'text';
			case 'rating':
				return 'star';
			case 'year':
				return 'calendar';
			case 'newest':
				return 'time';
			default:
				return 'swap-vertical';
		}
	};

	const getDescription = () => {
		if (category) {
			return {
				title: `${category} Books`,
				text: `Discover amazing ${category.toLowerCase()} books from our curated collection. Find your next great read in this genre.`,
			};
		}
		if (categories && categories.length > 0) {
			return {
				title: `Books by Genre${categories.length > 1 ? 's' : ''}`,
				text: `Explore books in ${categories.join(', ')}. Curated selections based on your selected genres.`,
			};
		}
		if (tags && tags.length > 0) {
			return {
				title: 'Books by Topic',
				text: `Explore books related to ${tags.join(', ')}. Curated selections based on your interests.`,
			};
		}
		return {
			title: 'Discover Books',
			text: 'Browse our complete library of books. Search by title, author, or explore by categories to find your perfect read.',
		};
	};

	const renderSkeletonList = () => (
		<View style={styles.skeletonContainer}>
			{Array.from({ length: 5 }).map((_, index) => (
				<View key={index} style={styles.bookItem}>
					<SkeletonLoader
						width={90}
						height={120}
						borderRadius={2}
						style={{ marginRight: 16 }}
					/>
					<View style={styles.bookInfo}>
						<SkeletonLoader
							width={200}
							height={20}
							style={{ marginBottom: 8 }}
						/>
						<SkeletonLoader
							width={150}
							height={16}
							style={{ marginBottom: 12 }}
						/>
						<SkeletonLoader
							width={100}
							height={14}
							style={{ marginBottom: 8 }}
						/>
						<SkeletonLoader width={250} height={32} />
					</View>
				</View>
			))}
		</View>
	);

	const renderBookItem = ({ item }: { item: Book }) => (
		<TouchableOpacity
			style={[styles.bookItem]}
			onPress={() => {
				navigation.navigate('ChatDetail', { bookId: item.id });
			}}
			activeOpacity={0.7}
		>
			<BookCover
				uri={item.cover_url}
				style={styles.bookCover}
				placeholderIcon="book-outline"
				placeholderSize={24}
			/>
			<View style={[styles.bookInfo, { borderColor: currentColors.border }]}>
				<Text
					style={[
						styles.bookTitle,
						{
							color: currentColors.foreground,
						},
					]}
					numberOfLines={2}
				>
					{item.title}
				</Text>
				<Text
					style={[styles.bookAuthor, { color: currentColors.mutedForeground }]}
					numberOfLines={1}
				>
					{item?.author || 'Unknown Author'}
				</Text>
				<View style={styles.bookMeta}>
					<View style={styles.ratingContainer}>
						<Ionicons name="star" size={12} color={currentColors.primary} />
						<Text
							style={[styles.ratingText, { color: currentColors.foreground }]}
						>
							{(item.metadata as any)?.rating || 'N/A'}
						</Text>
					</View>
					<Text
						style={[styles.yearText, { color: currentColors.mutedForeground }]}
					>
						{(item.metadata as any)?.year || 'N/A'}
					</Text>
				</View>
				<Text
					style={[
						styles.bookDescription,
						{ color: currentColors.mutedForeground },
					]}
					numberOfLines={2}
				>
					{item.description}
				</Text>
			</View>
		</TouchableOpacity>
	);

	const description = getDescription();

	const handleBadgePress = () => {
		if (subscription?.subscription_plan === 'free') {
			setShowPaywall(true);
		}
		// else: optionally show a toast "You're already premium!"
	};

	const handlePaywallPurchase = () => {
		setShowPaywall(false);
		refreshSubscription();
	};

	if (loading && books.length === 0) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
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
						{screenTitle}
					</Text>
					<View style={styles.headerRight}>
						<MessageCounterBadge
							variant="pill"
							label="FREE MESSAGES"
							refreshKey={badgeRefreshKey}
							onPress={handleBadgePress}
							style={{ marginRight: 8 }}
						/>
						<TouchableOpacity
							style={styles.sortButton}
							onPress={handleSortPress}
						>
							<Ionicons
								name={getSortIcon()}
								size={20}
								color={currentColors.primary}
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* Fixed Content */}
				<View
					style={[
						styles.fixedContent,
						{ backgroundColor: currentColors.background },
					]}
				>
					{/* Description Skeleton */}
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
				</View>

				{/* Scrollable Books List Skeleton */}
				<View style={styles.scrollableContent}>{renderSkeletonList()}</View>
			</SafeAreaView>
		);
	}

	if (error && books.length === 0) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
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
						{screenTitle}
					</Text>
					<View style={styles.headerRight}>
						<MessageCounterBadge
							variant="pill"
							label="FREE MESSAGES"
							refreshKey={badgeRefreshKey}
							onPress={handleBadgePress}
							style={{ marginRight: 8 }}
						/>
						<TouchableOpacity
							style={styles.sortButton}
							onPress={handleSortPress}
						>
							<Ionicons
								name={getSortIcon()}
								size={20}
								color={currentColors.primary}
							/>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.errorContainer}>
					<EmptyState
						icon={{
							name: 'library-outline',
							size: 64,
							color: currentColors.mutedForeground,
						}}
						title="Unable to load books"
						subtitle={error}
						button={{
							text: 'Try Again',
							onPress: () => loadBooks(),
							style: 'primary',
						}}
					/>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: currentColors.background }]}
		>
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor={currentColors.background}
			/>

			{/* Header */}
			<ScreenHeader
				title={screenTitle}
				showBackButton={true}
				onBackPress={() => navigation.goBack()}
				rightComponent={
					<MessageCounterBadge
						variant="pill"
						label="FREE MESSAGES"
						refreshKey={badgeRefreshKey}
						onPress={handleBadgePress}
						style={{ marginRight: 8 }}
					/>
				}
			/>

			{/* Fixed Content */}
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
						{description.title}
					</Text>
					<Text
						style={[
							styles.descriptionText,
							{ color: currentColors.mutedForeground },
						]}
					>
						{description.text}
					</Text>
				</View>

				{/* Search Bar */}
				<SearchBar
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholder="Search books, authors or topics..."
					containerStyle={[
						styles.searchContainer,
						{ backgroundColor: currentColors.background },
					]}
					inputStyle={{ color: currentColors.foreground }}
					iconColor={currentColors.mutedForeground}
				/>

				{/* Category Filter */}
				{category && (
					<View style={styles.tagsContainer}>
						<Text
							style={[styles.tagsTitle, { color: currentColors.foreground }]}
						>
							Browsing Category:
						</Text>
						<View style={styles.tagsWrapper}>
							<View
								style={[
									styles.tagChip,
									{ backgroundColor: currentColors.primary + '20' },
								]}
							>
								<Text
									style={[styles.tagChipText, { color: currentColors.primary }]}
								>
									{category}
								</Text>
							</View>
							<View
								style={[
									styles.tagChip,
									{ backgroundColor: currentColors.muted },
								]}
							>
								<Text
									style={[
										styles.tagChipText,
										{ color: currentColors.mutedForeground },
									]}
								>
									{filteredAndSortedBooks.length} book
									{filteredAndSortedBooks.length === 1 ? '' : 's'}
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* Selected Categories */}
				{categories && categories.length > 0 && (
					<View style={styles.tagsContainer}>
						<Text
							style={[styles.tagsTitle, { color: currentColors.foreground }]}
						>
							Selected Genres:
						</Text>
						<View style={styles.tagsWrapper}>
							{categories.map((categoryName: string, index: number) => (
								<View
									key={index}
									style={[
										styles.tagChip,
										{ backgroundColor: currentColors.primary + '20' },
									]}
								>
									<Text
										style={[
											styles.tagChipText,
											{ color: currentColors.primary },
										]}
									>
										{categoryName}
									</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Selected Tags */}
				{tags && tags.length > 0 && (
					<View style={styles.tagsContainer}>
						<Text
							style={[styles.tagsTitle, { color: currentColors.foreground }]}
						>
							Selected Topics:
						</Text>
						<View style={styles.tagsWrapper}>
							{tags.map((tag: string, index: number) => (
								<View
									key={index}
									style={[
										styles.tagChip,
										{ backgroundColor: currentColors.primary + '20' },
									]}
								>
									<Text
										style={[
											styles.tagChipText,
											{ color: currentColors.primary },
										]}
									>
										{tag}
									</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Sort Info */}
				<View style={styles.sortInfoContainer}>
					<Text
						style={[
							styles.sortInfoText,
							{ color: currentColors.mutedForeground },
						]}
					>
						{filteredAndSortedBooks.length} book
						{filteredAndSortedBooks.length === 1 ? '' : 's'}
						{searchQuery ? ` matching "${searchQuery}"` : ''} • Sorted by{' '}
						{sortBy}
					</Text>
				</View>
			</View>

			{/* Scrollable Books List */}
			<FlatList
				style={styles.scrollableContent}
				data={filteredAndSortedBooks}
				renderItem={renderBookItem}
				keyExtractor={item => item.id}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={[currentColors.primary]}
						tintColor={currentColors.primary}
					/>
				}
				ListEmptyComponent={
					<EmptyState
						icon={{
							name: searchQuery ? 'search-outline' : 'library-outline',
							size: 48,
							color: currentColors.mutedForeground,
						}}
						title={
							searchQuery
								? 'No books found'
								: category
									? `No ${category} books`
									: 'No books available'
						}
						subtitle={
							searchQuery
								? 'Try adjusting your search terms or browse by category'
								: category
									? 'Try exploring other categories or check back later for new additions'
									: 'Check back later for new book additions'
						}
						button={
							searchQuery || category
								? {
										text: searchQuery
											? 'Clear Search'
											: 'Browse All Categories',
										onPress: () => {
											if (searchQuery) {
												setSearchQuery('');
											} else {
												navigation.navigate('Categories');
											}
										},
										style: 'secondary',
									}
								: undefined
						}
						containerStyle={styles.emptyContainer}
					/>
				}
				contentContainerStyle={
					filteredAndSortedBooks.length === 0
						? { flex: 1 }
						: styles.listContainer
				}
			/>

			{/* Add PremiumPaywallDrawer at the end of the component */}
			<PremiumPaywallDrawer
				visible={showPaywall}
				onClose={() => setShowPaywall(false)}
				onPurchase={handlePaywallPurchase}
				onRestore={() => setShowPaywall(false)}
				onPrivacyPolicy={() => setShowPaywall(false)}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		maxHeight: 70,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
		flex: 0.3,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		flex: 0.75,
	},
	headerRight: {
		width: 40,
		flex: 0.55,
	},
	sortButton: {
		padding: 8,
		marginRight: -8,
	},
	fixedContent: {
		// Fixed content that doesn't scroll
	},
	scrollableContent: {
		flex: 1,
	},
	skeletonContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
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
		paddingBottom: 15,
		paddingTop: -10,
	},
	sortInfoContainer: {
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	sortInfoText: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 20,
	},
	bookItem: {
		flexDirection: 'row',
		padding: 12,
		marginBottom: 16,
		borderRadius: 12,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 2,
	},
	bookCover: {
		width: 90,
		height: 120,
		marginRight: 16,
		borderRadius: 2,
	},
	bookInfo: {
		flex: 1,
		justifyContent: 'space-between',
		paddingBottom: 8,
		borderBottomWidth: 1,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
		lineHeight: 20,
	},
	bookAuthor: {
		fontSize: 14,
		marginBottom: 8,
	},
	bookMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 16,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	ratingText: {
		fontSize: 12,
		fontWeight: '500',
	},
	yearText: {
		fontSize: 12,
	},
	bookDescription: {
		fontSize: 12,
		lineHeight: 16,
	},
	tagsContainer: {
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	tagsTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
	tagsWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	tagChip: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	tagChipText: {
		fontSize: 12,
		fontWeight: '500',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
		paddingVertical: 60,
	},
});
