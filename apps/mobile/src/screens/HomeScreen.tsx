import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

// Mock data for demonstration
const featuredBooks = [
	{
		id: 1,
		title: 'The Great Gatsby',
		author: 'F. Scott Fitzgerald',
		cover: '📚',
	},
	{ id: 2, title: '1984', author: 'George Orwell', cover: '📖' },
	{ id: 3, title: 'Pride and Prejudice', author: 'Jane Austen', cover: '📕' },
];

const categories = [
	{ id: 1, name: 'Fiction', icon: 'book' },
	{ id: 2, name: 'Non-Fiction', icon: 'library' },
	{ id: 3, name: 'Science Fiction', icon: 'rocket' },
	{ id: 4, name: 'Mystery', icon: 'search' },
	{ id: 5, name: 'Romance', icon: 'heart' },
	{ id: 6, name: 'Biography', icon: 'person' },
];

const recommendedBooks = [
	{ id: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', cover: '📗' },
	{ id: 2, title: 'The Hobbit', author: 'J.R.R. Tolkien', cover: '📘' },
	{ id: 3, title: 'Jane Eyre', author: 'Charlotte Brontë', cover: '📙' },
];

export default function HomeScreen({ navigation }: any) {
	const renderBookCard = (
		book: any,
		size: 'large' | 'medium' | 'small' = 'medium'
	) => (
		<TouchableOpacity
			key={book.id}
			style={[
				styles.bookCard,
				size === 'large' && styles.bookCardLarge,
				size === 'small' && styles.bookCardSmall,
			]}
		>
			<View style={styles.bookCover}>
				<Text style={styles.bookCoverText}>{book.cover}</Text>
			</View>
			<Text style={styles.bookTitle} numberOfLines={2}>
				{book.title}
			</Text>
			<Text style={styles.bookAuthor} numberOfLines={1}>
				{book.author}
			</Text>
		</TouchableOpacity>
	);

	const renderCategoryCard = (category: any) => (
		<TouchableOpacity key={category.id} style={styles.categoryCard}>
			<View style={styles.categoryIcon}>
				<Ionicons
					name={category.icon as any}
					size={24}
					color={colors.light.primary}
				/>
			</View>
			<Text style={styles.categoryName}>{category.name}</Text>
		</TouchableOpacity>
	);

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			{/* Header Section */}
			<View style={styles.header}>
				<View style={styles.headerTop}>
					<Text style={styles.appTitle}>Interactive Library</Text>
					<TouchableOpacity style={styles.profileButton}>
						<Ionicons
							name='person-circle'
							size={32}
							color={colors.light.primary}
						/>
					</TouchableOpacity>
				</View>
				<Text style={styles.welcomeText}>
					Welcome back! Ready to discover your next great read?
				</Text>
				<TouchableOpacity
					style={styles.ctaButton}
					onPress={() => navigation.navigate('Discover')}
				>
					<Text style={styles.ctaButtonText}>Explore Books</Text>
					<Ionicons
						name='arrow-forward'
						size={20}
						color={colors.light.primaryForeground}
					/>
				</TouchableOpacity>
			</View>

			{/* Featured Books Carousel */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Featured Books</Text>
					<TouchableOpacity>
						<Text style={styles.seeAllText}>See All</Text>
					</TouchableOpacity>
				</View>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.carousel}
				>
					{featuredBooks.map(book => renderBookCard(book, 'large'))}
				</ScrollView>
			</View>

			{/* Quick Actions */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Quick Actions</Text>
				<View style={styles.quickActions}>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={() => navigation.navigate('Chat')}
					>
						<View style={styles.actionIcon}>
							<Ionicons
								name='chatbubbles'
								size={24}
								color={colors.light.primary}
							/>
						</View>
						<Text style={styles.actionText}>Start Chat</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={() => navigation.navigate('Insights')}
					>
						<View style={styles.actionIcon}>
							<Ionicons
								name='analytics'
								size={24}
								color={colors.light.primary}
							/>
						</View>
						<Text style={styles.actionText}>View Insights</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={() => navigation.navigate('Preferences')}
					>
						<View style={styles.actionIcon}>
							<Ionicons
								name='settings'
								size={24}
								color={colors.light.primary}
							/>
						</View>
						<Text style={styles.actionText}>Settings</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Categories */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Browse Categories</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.categoriesContainer}
				>
					{categories.map(renderCategoryCard)}
				</ScrollView>
			</View>

			{/* Recommended Books */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Recommended for You</Text>
					<TouchableOpacity>
						<Text style={styles.seeAllText}>See All</Text>
					</TouchableOpacity>
				</View>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.carousel}
				>
					{recommendedBooks.map(book => renderBookCard(book, 'medium'))}
				</ScrollView>
			</View>

			{/* Continue Reading */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Continue Reading</Text>
				<View style={styles.continueReadingCard}>
					<View style={styles.continueReadingCover}>
						<Text style={styles.bookCoverText}>📖</Text>
					</View>
					<View style={styles.continueReadingInfo}>
						<Text style={styles.bookTitle}>The Great Gatsby</Text>
						<Text style={styles.bookAuthor}>F. Scott Fitzgerald</Text>
						<View style={styles.progressContainer}>
							<View style={styles.progressBar}>
								<View style={[styles.progressFill, { width: '45%' }]} />
							</View>
							<Text style={styles.progressText}>45% complete</Text>
						</View>
						<TouchableOpacity style={styles.resumeButton}>
							<Text style={styles.resumeButtonText}>Resume Reading</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	header: {
		padding: 20,
		paddingTop: 40,
		backgroundColor: colors.light.card,
	},
	headerTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	appTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		color: colors.light.foreground,
	},
	profileButton: {
		padding: 4,
	},
	welcomeText: {
		fontSize: 16,
		color: colors.light.mutedForeground,
		marginBottom: 20,
		lineHeight: 22,
	},
	ctaButton: {
		backgroundColor: colors.light.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		borderRadius: 12,
		gap: 8,
	},
	ctaButtonText: {
		color: colors.light.primaryForeground,
		fontSize: 16,
		fontWeight: '600',
	},
	section: {
		padding: 20,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 16,
	},
	seeAllText: {
		color: colors.light.primary,
		fontSize: 14,
		fontWeight: '500',
	},
	carousel: {
		marginLeft: -20,
		paddingLeft: 20,
	},
	bookCard: {
		width: 120,
		marginRight: 16,
	},
	bookCardLarge: {
		width: 140,
	},
	bookCardSmall: {
		width: 100,
	},
	bookCover: {
		width: '100%',
		height: 160,
		backgroundColor: colors.light.secondary,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	bookCoverText: {
		fontSize: 32,
	},
	bookTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	bookAuthor: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	quickActions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	actionButton: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: colors.light.card,
		padding: 16,
		borderRadius: 12,
		marginHorizontal: 4,
	},
	actionIcon: {
		marginBottom: 8,
	},
	actionText: {
		fontSize: 12,
		fontWeight: '500',
		color: colors.light.foreground,
		textAlign: 'center',
	},
	categoriesContainer: {
		marginLeft: -20,
		paddingLeft: 20,
	},
	categoryCard: {
		alignItems: 'center',
		backgroundColor: colors.light.card,
		padding: 16,
		borderRadius: 12,
		marginRight: 12,
		minWidth: 80,
	},
	categoryIcon: {
		marginBottom: 8,
	},
	categoryName: {
		fontSize: 12,
		fontWeight: '500',
		color: colors.light.foreground,
		textAlign: 'center',
	},
	continueReadingCard: {
		flexDirection: 'row',
		backgroundColor: colors.light.card,
		padding: 16,
		borderRadius: 12,
	},
	continueReadingCover: {
		width: 80,
		height: 120,
		backgroundColor: colors.light.secondary,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	continueReadingInfo: {
		flex: 1,
		justifyContent: 'space-between',
	},
	progressContainer: {
		marginVertical: 8,
	},
	progressBar: {
		height: 4,
		backgroundColor: colors.light.border,
		borderRadius: 2,
		marginBottom: 4,
	},
	progressFill: {
		height: '100%',
		backgroundColor: colors.light.primary,
		borderRadius: 2,
	},
	progressText: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	resumeButton: {
		backgroundColor: colors.light.accent,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 6,
		alignSelf: 'flex-start',
	},
	resumeButtonText: {
		color: colors.light.accentForeground,
		fontSize: 12,
		fontWeight: '500',
	},
});
