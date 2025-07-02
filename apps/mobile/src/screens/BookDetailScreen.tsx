import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	StatusBar,
	SafeAreaView,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BookCover } from '../components/BookCover';
import { colors } from '../utils/colors';
import { Book } from '../types/supabase';
import { getBookById } from '../services/books';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { getFlagsForLanguages } from '../utils/flags';

type BookDetailRouteProp = RouteProp<{
	BookDetail: { bookId: string };
}>;

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

const { width: screenWidth } = Dimensions.get('window');

export default function BookDetailScreen() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<BookDetailRouteProp>();
	const { bookId } = route.params;
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];

	const [book, setBook] = useState<Book | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadBookDetails();
	}, [bookId]);

	const loadBookDetails = async () => {
		try {
			setLoading(true);
			setError(null);
			const bookData = await getBookById(bookId);
			setBook(bookData);
		} catch (err) {
			console.error('Error loading book details:', err);
			setError('Failed to load book details');
		} finally {
			setLoading(false);
		}
	};

	const handleStartChat = () => {
		if (book) {
			navigation.navigate('ChatDetail', { bookId: book.id });
		}
	};

	const handleGoBack = () => {
		navigation.goBack();
	};

	const formatYear = (year: number | null) => {
		return year ? year.toString() : 'Unknown';
	};

	const formatRating = (rating: number | null) => {
		if (!rating) return 'Not rated';
		return `${rating.toFixed(1)}`;
	};

	const formatPages = (pages: number | null) => {
		return pages ? `${pages} pages` : 'Unknown pages';
	};

	// const formatLanguage = (language: string | null) => {
	// 	if (!language) return 'Unknown';
	// 	// Show language code as fallback
	// 	return language;
	// };

	const renderStars = (rating: number | null) => {
		if (!rating) return null;

		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;

		for (let i = 0; i < 5; i++) {
			if (i < fullStars) {
				stars.push(
					<Ionicons
						key={i}
						name="star"
						size={14}
						color={currentColors.primary}
					/>
				);
			} else if (i === fullStars && hasHalfStar) {
				stars.push(
					<Ionicons
						key={i}
						name="star-half"
						size={14}
						color={currentColors.primary}
					/>
				);
			} else {
				stars.push(
					<Ionicons
						key={i}
						name="star-outline"
						size={14}
						color={currentColors.mutedForeground}
					/>
				);
			}
		}

		return <View style={styles.starsContainer}>{stars}</View>;
	};

	if (loading) {
		return <LoadingState text="Loading book details..." />;
	}

	if (error || !book) {
		return (
			<EmptyState
				icon={{
					name: 'alert-circle-outline',
					size: 64,
					color: currentColors.mutedForeground,
				}}
				title="Book Not Found"
				subtitle={error || "We couldn't find the book you're looking for"}
				button={{
					text: 'Go Back',
					onPress: handleGoBack,
				}}
			/>
		);
	}

	return (
		<SafeAreaView
			style={[styles.safeArea, { backgroundColor: currentColors.background }]}
		>
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor="transparent"
				translucent
			/>

			{/* Header */}

			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.contentContainer}
			>
				{/* Hero Section */}
				<View
					style={[styles.heroSection, { backgroundColor: currentColors.card }]}
				>
					<View style={styles.heroContent}>
						<View style={styles.coverContainer}>
							<BookCover
								uri={book.cover_url}
								style={styles.bookCover}
								placeholderIcon="book-outline"
								placeholderSize={32}
							/>
							<View
								style={[
									styles.coverShadow,
									{ backgroundColor: currentColors.foreground + '15' },
								]}
							/>
						</View>

						<View style={styles.basicInfo}>
							<Text
								style={[styles.bookTitle, { color: currentColors.foreground }]}
								numberOfLines={3}
							>
								{book.title}
							</Text>
							<Text
								style={[
									styles.bookAuthor,
									{ color: currentColors.mutedForeground },
								]}
								numberOfLines={2}
							>
								by {book.author || 'Unknown Author'}
							</Text>

							{/* Rating and Year */}
							<View style={styles.metaRow}>
								{book.metadata?.rating && (
									<View style={styles.ratingContainer}>
										{renderStars(book.metadata.rating)}
										<Text
											style={[
												styles.ratingText,
												{ color: currentColors.foreground },
											]}
										>
											{formatRating(book.metadata.rating)}
										</Text>
									</View>
								)}
								{book.year && (
									<View style={styles.yearContainer}>
										<Ionicons
											name="calendar-outline"
											size={14}
											color={currentColors.mutedForeground}
										/>
										<Text
											style={[
												styles.yearText,
												{ color: currentColors.mutedForeground },
											]}
										>
											{formatYear(book.year)}
										</Text>
									</View>
								)}
							</View>
						</View>
					</View>
				</View>

				{/* Categories Section */}
				{book.categories && book.categories.length > 0 && (
					<View style={styles.section}>
						<View style={styles.categoriesContainer}>
							{book.categories.map((cat, idx) => (
								<View
									key={cat + idx}
									style={{
										backgroundColor: currentColors.primary + '15',
										borderRadius: 12,
										paddingHorizontal: 10,
										paddingVertical: 4,
										borderWidth: 1,
										borderColor: currentColors.primary + '30',
									}}
								>
									<Text
										style={{
											color: currentColors.primary,
											fontSize: 12,
											fontWeight: '500',
										}}
									>
										{cat}
									</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Description Section */}
				{book.descriptionbookdetail && (
					<View style={styles.section}>
						<Text
							style={[styles.sectionTitle, { color: currentColors.foreground }]}
						>
							About this book
						</Text>
						<Text
							style={[
								styles.descriptionText,
								{ color: currentColors.mutedForeground },
							]}
						>
							{book.descriptionbookdetail}
						</Text>
					</View>
				)}

				{/* Book Details Section */}
				<View style={styles.section}>
					<Text
						style={[styles.sectionTitle, { color: currentColors.foreground }]}
					>
						Book Details
					</Text>
					<View style={styles.detailsGrid}>
						<View
							style={[
								styles.detailItem,
								{
									backgroundColor: currentColors.card,
									borderColor: currentColors.border,
								},
							]}
						>
							<Ionicons
								name="document-text-outline"
								size={18}
								color={currentColors.mutedForeground}
							/>
							<Text
								style={[
									styles.detailLabel,
									{ color: currentColors.mutedForeground },
								]}
							>
								Pages
							</Text>
							<Text
								style={[
									styles.detailValue,
									{ color: currentColors.foreground },
								]}
							>
								{formatPages(book.metadata?.pages)}
							</Text>
						</View>

						<View
							style={[
								styles.detailItem,
								{
									backgroundColor: currentColors.card,
									borderColor: currentColors.border,
								},
							]}
						>
							<Ionicons
								name="language-outline"
								size={18}
								color={currentColors.mutedForeground}
							/>
							<Text
								style={[
									styles.detailLabel,
									{ color: currentColors.mutedForeground },
								]}
							>
								Language
							</Text>
							<View
								style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
							>
								{getFlagsForLanguages(book.metadata?.language).map(
									(flag, idx) => (
										<Text
											key={flag + idx}
											style={{ fontSize: 16, marginRight: 2 }}
										>
											{flag}
										</Text>
									)
								)}
							</View>
						</View>

						{book.metadata?.genres && book.metadata.genres.length > 0 && (
							<View
								style={[
									styles.detailItem,
									{
										backgroundColor: currentColors.card,
										borderColor: currentColors.border,
									},
								]}
							>
								<Ionicons
									name="pricetag-outline"
									size={18}
									color={currentColors.mutedForeground}
								/>
								<Text
									style={[
										styles.detailLabel,
										{ color: currentColors.mutedForeground },
									]}
								>
									Genres
								</Text>
								<Text
									style={[
										styles.detailValue,
										{ color: currentColors.foreground },
									]}
								>
									{book.metadata.genres.slice(0, 3).join(', ')}
									{book.metadata.genres.length > 3 && '...'}
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Spacer for bottom padding */}
				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* Chat Button */}
			<View
				style={[
					styles.chatButtonContainer,
					{
						backgroundColor: currentColors.background,
					},
				]}
			>
				<TouchableOpacity
					style={[
						styles.chatButton,
						{ backgroundColor: currentColors.primary },
					]}
					onPress={handleStartChat}
					activeOpacity={0.8}
				>
					<Ionicons
						name="chatbubbles"
						size={18}
						color={currentColors.primaryForeground}
					/>
					<Text
						style={[
							styles.chatButtonText,
							{ color: currentColors.primaryForeground },
						]}
					>
						Start Chatting
					</Text>
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
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	backButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	headerTitle: {
		flex: 1,
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginHorizontal: 16,
	},
	headerSpacer: {
		width: 36,
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		paddingBottom: 80, // Space for chat button
	},
	heroSection: {
		margin: 16,
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
		overflow: 'hidden',
	},
	heroContent: {
		padding: 20,
		alignItems: 'center',
	},
	coverContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	bookCover: {
		width: 120,
		height: 180,
		borderRadius: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 6,
	},
	coverShadow: {
		position: 'absolute',
		bottom: -6,
		left: 12,
		right: 12,
		height: 12,
		borderRadius: 8,
		transform: [{ scaleY: 0.3 }],
	},
	basicInfo: {
		alignItems: 'center',
		maxWidth: screenWidth - 72,
	},
	bookTitle: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 6,
		lineHeight: 26,
	},
	bookAuthor: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 12,
		fontWeight: '500',
		lineHeight: 18,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	starsContainer: {
		flexDirection: 'row',
		gap: 1,
	},
	ratingText: {
		fontSize: 13,
		fontWeight: '500',
	},
	yearContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	yearText: {
		fontSize: 13,
		fontWeight: '500',
	},
	section: {
		paddingHorizontal: 16,
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	descriptionText: {
		fontSize: 13,
		fontStyle: 'italic',
		lineHeight: 20,
		textAlign: 'justify',
	},
	detailsGrid: {
		gap: 8,
	},
	detailItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 10,
		borderWidth: 1,
	},
	detailLabel: {
		fontSize: 13,
		marginLeft: 10,
		flex: 1,
	},
	detailValue: {
		fontSize: 13,

		fontWeight: '500',
	},
	bottomSpacer: {
		height: 16,
	},
	chatButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	chatButton: {
		width: '50%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
		gap: 8,
	},
	chatButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
	categoriesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
});
