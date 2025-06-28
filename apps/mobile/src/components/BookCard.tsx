import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookCover } from './BookCover';
import { colors } from '../utils/colors';
import { Book } from '../types/supabase';

type BookCardProps = {
	book: Book;
	onPress: (book: Book) => void;
	variant?: 'carousel' | 'list';
	style?: any;
	activeOpacity?: number;
	showRating?: boolean;
	showYear?: boolean;
	showDescription?: boolean;
	titleLines?: number;
	descriptionLines?: number;
};

export const BookCard: React.FC<BookCardProps> = ({
	book,
	onPress,
	variant = 'carousel',
	style,
	activeOpacity = 0.7,
	showRating = true,
	showYear = true,
	showDescription = false,
	titleLines = 2,
	descriptionLines = 2,
}) => {
	const handlePress = () => {
		onPress(book);
	};

	if (variant === 'list') {
		return (
			<TouchableOpacity
				style={[styles.listCard, style]}
				onPress={handlePress}
				activeOpacity={activeOpacity}
			>
				<BookCover
					uri={book.cover_url}
					style={styles.listCover}
					placeholderIcon="book-outline"
					placeholderSize={24}
				/>
				<View style={styles.listInfo}>
					<Text style={styles.listTitle} numberOfLines={titleLines}>
						{book.title}
					</Text>
					<Text style={styles.listAuthor} numberOfLines={1}>
						{book?.author || 'Unknown Author'}
					</Text>
					{(showRating || showYear) && (
						<View style={styles.listMeta}>
							{showRating && (
								<View style={styles.ratingContainer}>
									<Ionicons
										name="star"
										size={12}
										color={colors.light.primary}
									/>
									<Text style={styles.ratingText}>
										{book.metadata?.rating || 'N/A'}
									</Text>
								</View>
							)}
							{showYear && <Text style={styles.yearText}>{book?.year}</Text>}
						</View>
					)}
					{showDescription && book.description && (
						<Text
							style={styles.listDescription}
							numberOfLines={descriptionLines}
						>
							{book.description}
						</Text>
					)}
				</View>
			</TouchableOpacity>
		);
	}

	// Carousel variant (default)
	return (
		<TouchableOpacity
			style={[styles.carouselCard, style]}
			onPress={handlePress}
			activeOpacity={activeOpacity}
		>
			<View style={styles.carouselCoverContainer}>
				<BookCover
					uri={book.cover_url}
					style={styles.carouselCover}
					placeholderIcon="book-outline"
					placeholderSize={32}
				/>
			</View>
			<Text style={styles.carouselTitle} numberOfLines={titleLines}>
				{book.title}
			</Text>
			<Text style={styles.carouselAuthor} numberOfLines={1}>
				{book?.author || 'Unknown Author'}
			</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	// Carousel variant styles
	carouselCard: {
		width: 120,
		marginRight: 16,
	},
	carouselCoverContainer: {
		marginBottom: 8,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.15,
		shadowRadius: 3.84,
		elevation: 5,
		shadowColor: '#000',
	},
	carouselCover: {
		width: '100%',
		height: 160,
		borderRadius: 2,
	},
	carouselTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	carouselAuthor: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},

	// List variant styles
	listCard: {
		flexDirection: 'row',
		padding: 16,
		backgroundColor: colors.light.card,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	listCover: {
		width: 60,
		height: 90,
		borderRadius: 6,
		marginRight: 12,
	},
	listInfo: {
		fontSize: Platform.OS === 'ios' ? 18 : 2,
		flex: 1,
		justifyContent: 'space-between',
	},
	listTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	listAuthor: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginBottom: 6,
	},
	listMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginBottom: 6,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	ratingText: {
		fontSize: 12,
		color: colors.light.foreground,
		fontWeight: '500',
	},
	yearText: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	listDescription: {
		fontSize: 12,
		color: colors.light.mutedForeground,
		lineHeight: 16,
	},
});
