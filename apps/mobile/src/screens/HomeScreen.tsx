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
	{ id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', cover: '📚' },
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
	const renderBookCard = (book: any, size: 'large' | 'medium' | 'small' = 'medium') => (
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
				<Ionicons name={category.icon as any} size={24} color={colors.light.primary} />
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
						<Ionicons name="person-circle" size={32} color={colors.light.primary} />
					</TouchableOpacity>
				</View>
				<Text style={styles.welcomeText}>Welcome back! Ready to discover your next great read?</Text>
				<TouchableOpacity 
					style={styles.ctaButton}
					onPress={() => navigation.navigate('Discover')}
				>
					<Text style={styles.ctaButtonText}>Explore Books</Text>
					<Ionicons name="arrow-forward" size={20} color={colors.light.primaryForeground} />
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
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
					{featuredBooks.map(book => renderBookCard(book, 'large'))}
				</ScrollView>
			</View>

			{/* Quick Actions */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Quick Actions</Text>
				<View style={styles.quickActions}>
					<TouchableOpacity 
						style={styles.actionButton}
		<View style={styles.container}>
			<Text style={styles.title}>Interactive Library</Text>
			<Text style={styles.subtitle}>Welcome to your mobile app!</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.light.background,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		color: colors.light.foreground,
	},
	subtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
});
