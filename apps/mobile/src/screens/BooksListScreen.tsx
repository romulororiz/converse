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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
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
			style={styles.bookItem}
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
			<View style={styles.bookInfo}>
				<Text style={styles.bookTitle} numberOfLines={2}>
					{item.title}
				</Text>
				<Text style={styles.bookAuthor} numberOfLines={1}>
					{item?.author || 'Unknown Author'}
				</Text>
				<View style={styles.bookMeta}>
					<View style={styles.ratingContainer}>
						<Ionicons name='star' size={12} color={colors.light.primary} />
						<Text style={styles.ratingText}>
							{(item.metadata as any)?.rating || 'N/A'}
						</Text>
					</View>
					<Text style={styles.yearText}>
						{(item.metadata as any)?.year || 'N/A'}
					</Text>
				</View>
				<Text style={styles.bookDescription} numberOfLines={2}>
					{item.description}
				</Text>
			</View>
		</TouchableOpacity>
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
				<Text style={styles.loadingText}>Loading books...</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
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
				<Text style={styles.headerTitle}>{screenTitle}</Text>
				<View style={styles.headerRight} />
			</View>

			{/* Search Bar */}
			<View style={styles.searchContainer}>
				<View style={styles.searchBar}>
					<Ionicons
						name='search'
						size={20}
						color={colors.light.mutedForeground}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder='Search books or authors...'
						placeholderTextColor={colors.light.mutedForeground}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity onPress={() => setSearchQuery('')}>
							<Ionicons
								name='close-circle'
								size={20}
								color={colors.light.mutedForeground}
							/>
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* Category Filter */}
			{category && (
				<View style={styles.tagsContainer}>
					<Text style={styles.tagsTitle}>Browsing Category:</Text>
					<View style={styles.tagsWrapper}>
						<View style={styles.tagChip}>
							<Text style={styles.tagChipText}>{category}</Text>
						</View>
						<View style={styles.tagChip}>
							<Text style={styles.tagChipText}>
								{filteredBooks.length} books
							</Text>
						</View>
					</View>
				</View>
			)}

			{/* Selected Tags */}
			{tags && tags.length > 0 && (
				<View style={styles.tagsContainer}>
					<Text style={styles.tagsTitle}>Selected Topics:</Text>
					<View style={styles.tagsWrapper}>
						{tags.map((tag: string, index: number) => (
							<View key={index} style={styles.tagChip}>
								<Text style={styles.tagChipText}>{tag}</Text>
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
							color: colors.light.mutedForeground,
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
		backgroundColor: colors.light.background,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		paddingTop: 20,
		backgroundColor: colors.light.cardForeground,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.accentForeground,
	},
	headerRight: {
		width: 32,
	},
	searchContainer: {
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
	},
	searchInput: {
		flex: 1,
		marginLeft: 12,
		fontSize: 16,
		color: colors.light.cardForeground,
	},
	listContainer: {
		paddingHorizontal: 20,
	},
	bookItem: {
		flexDirection: 'row',
		padding: 10,
		marginBottom: 16,
	},
	bookCover: {
		width: 90,
		height: 120,
		marginRight: 16,
	},
	bookImage: {
		width: '100%',
		height: '100%',
		borderRadius: 2,
	},
	bookPlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: colors.light.secondary,
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
		borderColor: colors.light.border,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	bookAuthor: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginBottom: 8,
	},
	bookMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 16,
	},
	ratingText: {
		fontSize: 12,
		color: colors.light.foreground,
		marginLeft: 4,
	},
	yearText: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	bookDescription: {
		fontSize: 12,
		color: colors.light.mutedForeground,
		lineHeight: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.light.background,
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	tagsContainer: {
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	tagsTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 8,
	},
	tagsWrapper: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		flexWrap: 'wrap',
		gap: 8,
	},
	tagChip: {
		backgroundColor: colors.light.cardForeground,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	tagChipText: {
		fontSize: 12,
		fontWeight: '500',
		color: colors.light.primaryForeground,
	},
});
