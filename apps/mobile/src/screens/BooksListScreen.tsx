import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import {
	getAllBooks,
	searchBooks,
	searchBooksInCategory,
} from '../services/books';
import { searchBooksByCategory } from '../services/categories';
import { Book } from '../types/supabase';
import { BookCover } from '../components/BookCover';
import { EmptyState } from '../components/EmptyState';

export default function BooksListScreen({ navigation, route }: any) {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];

	// Get route parameters
	const { category, categoryId, tags, title } = route?.params || {};
	const screenTitle = title || category || 'All Books';

	useEffect(() => {
		loadBooks();
	}, [category]); // Reload when category changes

	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredBooks(books);
		} else {
			handleSearch(searchQuery);
		}
	}, [searchQuery, books]);

	const loadBooks = async () => {
		try {
			setLoading(true);
			let booksToShow: Book[];

			if (category) {
				// Load books filtered by category
				booksToShow = await searchBooksByCategory(category);
			} else {
				// Load all books
				booksToShow = await getAllBooks();
			}

			setBooks(booksToShow);
			setFilteredBooks(booksToShow);
		} catch (error) {
			console.error('Error loading books:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = async (query: string) => {
		if (query.trim() === '') {
			setFilteredBooks(books);
			return;
		}

		try {
			let searchResults: Book[];

			if (category) {
				// Search within the selected category
				searchResults = await searchBooksInCategory(query, category);
			} else {
				// Search all books
				searchResults = await searchBooks(query);
			}

			setFilteredBooks(searchResults);
		} catch (error) {
			console.error('Error searching books:', error);
		}
	};

	const renderBookItem = ({ item }: { item: Book }) => (
		<TouchableOpacity
			style={[styles.bookItem]}
			onPress={() => {
				navigation.navigate('ChatDetail', { bookId: item.id });
			}}
		>
			<BookCover
				uri={item.cover_url}
				style={styles.bookCover}
				placeholderIcon='book-outline'
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
						<Ionicons name='star' size={12} color={currentColors.primary} />
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

	if (loading) {
		return (
			<View
				style={[
					styles.loadingContainer,
					{ backgroundColor: currentColors.background },
				]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>
				<ActivityIndicator size='large' color={currentColors.primary} />
				<Text
					style={[styles.loadingText, { color: currentColors.mutedForeground }]}
				>
					Loading books...
				</Text>
			</View>
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
			<View style={[styles.header, { backgroundColor: currentColors.card }]}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name='arrow-back'
						size={24}
						color={currentColors.foreground}
					/>
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: currentColors.foreground }]}>
					{screenTitle}
				</Text>
				<View style={styles.headerRight} />
			</View>

			{/* Search Bar */}
			<View style={styles.searchContainer}>
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
						name='search'
						size={20}
						color={currentColors.mutedForeground}
					/>
					<TextInput
						style={[styles.searchInput, { color: currentColors.foreground }]}
						placeholder='Search books or authors...'
						placeholderTextColor={currentColors.mutedForeground}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity onPress={() => setSearchQuery('')}>
							<Ionicons
								name='close-circle'
								size={20}
								color={currentColors.mutedForeground}
							/>
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* Category Filter */}
			{category && (
				<View style={styles.tagsContainer}>
					<Text style={[styles.tagsTitle, { color: currentColors.foreground }]}>
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
							style={[styles.tagChip, { backgroundColor: currentColors.muted }]}
						>
							<Text
								style={[
									styles.tagChipText,
									{ color: currentColors.mutedForeground },
								]}
							>
								{filteredBooks.length} books
							</Text>
						</View>
					</View>
				</View>
			)}

			{/* Selected Tags */}
			{tags && tags.length > 0 && (
				<View style={styles.tagsContainer}>
					<Text style={[styles.tagsTitle, { color: currentColors.foreground }]}>
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
									style={[styles.tagChipText, { color: currentColors.primary }]}
								>
									{tag}
								</Text>
							</View>
						))}
					</View>
				</View>
			)}

			{/* Books List */}
			<FlatList
				data={filteredBooks}
				renderItem={renderBookItem}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
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
		padding: 20,
		paddingTop: 20,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	headerRight: {
		width: 32,
	},
	searchContainer: {
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
	},
	searchInput: {
		flex: 1,
		marginLeft: 12,
		fontSize: 16,
	},
	listContainer: {
		paddingHorizontal: 20,
	},
	bookItem: {
		flexDirection: 'row',
		padding: 10,
		marginBottom: 16,
		borderRadius: 8,
	},
	bookCover: {
		width: 90,
		height: 120,
		marginRight: 8,
	},
	bookImage: {
		width: '100%',
		height: '100%',
		borderRadius: 2,
	},
	bookPlaceholder: {
		width: '100%',
		height: '100%',
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bookPlaceholderText: {
		fontSize: 24,
	},
	bookInfo: {
		flex: 1,
		justifyContent: 'center',
		borderBottomWidth: 1,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
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
		paddingHorizontal: 20,
		paddingTop: 16,
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
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		fontWeight: '500',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
});
