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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { getAllBooks, searchBooks, Book } from '../services/books';

export default function BooksListScreen({ navigation }: any) {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

	useEffect(() => {
		loadBooks();
	}, []);

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
			const allBooks = await getAllBooks();
			setBooks(allBooks);
			setFilteredBooks(allBooks);
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
			const searchResults = await searchBooks(query);
			setFilteredBooks(searchResults);
		} catch (error) {
			console.error('Error searching books:', error);
		}
	};

	const renderBookItem = ({ item }: { item: Book }) => (
		<TouchableOpacity style={styles.bookItem}>
			<View style={styles.bookCover}>
				{item.cover_url ? (
					<Image source={{ uri: item.cover_url }} style={styles.bookImage} />
				) : (
					<View style={styles.bookPlaceholder}>
						<Text style={styles.bookPlaceholderText}>📚</Text>
					</View>
				)}
			</View>
			<View style={styles.bookInfo}>
				<Text style={styles.bookTitle} numberOfLines={2}>
					{item.title}
				</Text>
				<Text style={styles.bookAuthor} numberOfLines={1}>
					{item.author?.name || 'Unknown Author'}
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
		<View style={styles.container}>
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
				<Text style={styles.headerTitle}>All Books</Text>
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
						placeholder='Search books...'
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

			{/* Books List */}
			<FlatList
				data={filteredBooks}
				renderItem={renderBookItem}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Ionicons
							name='library'
							size={48}
							color={colors.light.mutedForeground}
						/>
						<Text style={styles.emptyText}>
							{searchQuery ? 'No books found' : 'No books available'}
						</Text>
					</View>
				}
			/>
		</View>
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
		paddingTop: 40,
		backgroundColor: colors.light.card,
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
	},
	headerRight: {
		width: 32,
	},
	searchContainer: {
		padding: 20,
		paddingTop: 10,
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
		color: colors.light.foreground,
	},
	listContainer: {
		padding: 20,
	},
	bookItem: {
		flexDirection: 'row',
		backgroundColor: colors.light.card,
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	bookCover: {
		width: 60,
		height: 90,
		marginRight: 16,
	},
	bookImage: {
		width: '100%',
		height: '100%',
		borderRadius: 8,
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
	emptyText: {
		marginTop: 16,
		fontSize: 16,
		color: colors.light.mutedForeground,
		textAlign: 'center',
	},
});
 