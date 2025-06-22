import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	Image,
	ActivityIndicator,
	Platform,
	SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { getFeaturedBooks } from '../services/books';
import { getRecentChats } from '../services/chat';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../components/AuthProvider';
import { Book } from '../types/supabase';
import { BookCover } from '../components/BookCover';

const { width } = Dimensions.get('window');

const categories = [
	{ id: 1, name: 'Fiction', icon: 'book' },
	{ id: 2, name: 'Non-Fiction', icon: 'library' },
	{ id: 3, name: 'Science Fiction', icon: 'rocket' },
	{ id: 4, name: 'Mystery', icon: 'search' },
	{ id: 5, name: 'Romance', icon: 'heart' },
	{ id: 6, name: 'Biography', icon: 'person' },
];

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
};

export default function HomeScreen() {
	const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
	const [recentChats, setRecentChats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [chatsLoading, setChatsLoading] = useState(true);
	const navigation = useNavigation<NavigationProp>();
	const { user } = useAuth();

	useEffect(() => {
		loadFeaturedBooks();
		if (user) {
			loadRecentChats();
		}
	}, [user]);

	const loadFeaturedBooks = async () => {
		try {
			setLoading(true);
			const books = await getFeaturedBooks(6);
			setFeaturedBooks(books);
		} catch (error) {
			console.error('Error loading featured books:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadRecentChats = async () => {
		if (!user) return;

		try {
			setChatsLoading(true);
			const chats = await getRecentChats(user.id, 2);
			setRecentChats(chats);
		} catch (error) {
			console.error('Error loading recent chats:', error);
		} finally {
			setChatsLoading(false);
		}
	};

	const renderBookCard = ({ item }: { item: Book }) => (
		<TouchableOpacity
			style={styles.bookCard}
			onPress={() => navigation.navigate('ChatDetail', { bookId: item.id })}
		>
			<View style={styles.bookCoverContainer}>
				<BookCover
					uri={item.cover_url}
					style={styles.bookCover}
					placeholderIcon='book-outline'
					placeholderSize={32}
				/>
			</View>
			<Text style={styles.bookTitle} numberOfLines={2}>
				{item.title}
			</Text>
			<Text style={styles.bookAuthor} numberOfLines={1}>
				{item?.author || 'Unknown Author'}
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

	const formatTimeAgo = (dateString: string) => {
		const now = new Date();
		const date = new Date(dateString);
		const diffInHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60)
		);

		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24)
			return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays === 1) return 'Yesterday';
		if (diffInDays < 7) return `${diffInDays} days ago`;

		const diffInWeeks = Math.floor(diffInDays / 7);
		if (diffInWeeks === 1) return '1 week ago';
		if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;

		return date.toLocaleDateString();
	};

	const renderRecentChatCard = (chat: any, index: number) => (
		<View
			key={chat.id}
			style={[styles.conversationCard, index > 0 && { marginTop: 12 }]}
		>
			<View style={styles.conversationCover}>
				{chat.books?.cover_url ? (
					<BookCover
						uri={chat.books.cover_url}
						style={styles.conversationCoverImage}
						placeholderIcon='book-outline'
						placeholderSize={24}
					/>
				) : (
					<Text style={styles.bookCoverText}>📖</Text>
				)}
			</View>
			<View style={styles.conversationInfo}>
				<Text style={styles.conversationTitle} numberOfLines={1}>
					{chat.books?.title || 'Unknown Book'}
				</Text>
				<Text style={styles.conversationAuthor} numberOfLines={1}>
					{chat.books?.author || 'Unknown Author'}
				</Text>
				<View style={styles.conversationMeta}>
					<View style={styles.messageCount}>
						<Ionicons
							name='chatbubble'
							size={12}
							color={colors.light.primary}
						/>
						<Text style={styles.messageCountText}>
							{chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
						</Text>
					</View>
					<Text style={styles.lastChatTime}>
						{formatTimeAgo(chat.lastMessageTime)}
					</Text>
				</View>
				{chat.lastMessage && (
					<Text style={styles.lastMessage} numberOfLines={1}>
						{chat.lastMessageRole === 'user'
							? `"${chat.lastMessage}"`
							: chat.lastMessage}
					</Text>
				)}
				<TouchableOpacity
					style={styles.continueButton}
					onPress={() =>
						navigation.navigate('ChatDetail', { bookId: chat.book_id })
					}
				>
					<Ionicons
						name='chatbubbles'
						size={16}
						color={colors.light.accentForeground}
					/>
					<Text style={styles.continueButtonText}>Continue Chat</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
				{/* Header Section */}
				<View style={styles.header}>
					<View style={styles.headerTop}>
						<Text style={styles.appTitle}>ConversAI</Text>
					</View>
					<Text style={styles.welcomeText}>Chat with your favorite books.</Text>
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
						<TouchableOpacity onPress={() => navigation.navigate('BooksList')}>
							<Text style={styles.seeAllText}>See All</Text>
						</TouchableOpacity>
					</View>
					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size='large' color={colors.light.primary} />
							<Text style={styles.loadingText}>Loading books...</Text>
						</View>
					) : (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.carousel}
						>
							{featuredBooks.map(book => (
								<View key={book.id}>{renderBookCard({ item: book })}</View>
							))}
						</ScrollView>
					)}
				</View>

				{/* Categories */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitleCategories}>Browse Categories</Text>
						<TouchableOpacity onPress={() => navigation.navigate('Categories')}>
							<Text style={styles.seeAllText}>See All</Text>
						</TouchableOpacity>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.carousel}
					>
						{categories.map(renderCategoryCard)}
					</ScrollView>
				</View>

				{/* Recent Conversations */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Recent Conversations</Text>
						<TouchableOpacity onPress={() => navigation.navigate('Chats')}>
							<Text style={styles.seeAllText}>See All</Text>
						</TouchableOpacity>
					</View>

					{chatsLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size='small' color={colors.light.primary} />
							<Text style={styles.loadingText}>Loading conversations...</Text>
						</View>
					) : recentChats.length > 0 ? (
						recentChats.map((chat, index) => renderRecentChatCard(chat, index))
					) : (
						<View style={styles.emptyChatsContainer}>
							<Ionicons
								name='chatbubbles-outline'
								size={48}
								color={colors.light.mutedForeground}
							/>
							<Text style={styles.emptyChatsText}>No conversations yet</Text>
							<Text style={styles.emptyChatsSubtext}>
								Start chatting with a book to see your conversations here
							</Text>
							<TouchableOpacity
								style={styles.exploreButton}
								onPress={() => navigation.navigate('Discover')}
							>
								<Text style={styles.exploreButtonText}>Explore Books</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	container: {
		flex: 1,
	},
	header: {
		padding: 20,
		paddingTop: 20,
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
		width: '100%',
		paddingVertical: 16,
		paddingHorizontal: 12,
		overflow: 'visible',
	},
	sectionHeader: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sectionTitle: {
		width: 'auto',
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 16,
	},
	sectionTitleCategories: {
		width: 'auto',
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 10,
	},
	seeAllText: {
		color: colors.light.primary,
		fontSize: 14,
		fontWeight: '500',
	},
	carousel: {
		marginLeft: -20,
		paddingLeft: 20,
		paddingRight: 0,
		marginRight: -20,
	},
	bookCard: {
		width: 120,
		marginRight: 16,
	},
	bookCoverContainer: {
		marginBottom: 8,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.15,
		shadowRadius: 3.84,
		elevation: 5,
		shadowColor: '#000',
	},
	bookCover: {
		width: '100%',
		height: 160,
		objectFit: 'fill',
		backgroundColor: colors.light.secondary,
		borderRadius: 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bookCoverText: {
		fontSize: 32,
	},
	bookTitle: {
		width: '70%',
		height: 40,
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
	},
	bookTitleContinueReading: {
		width: '70%',
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.foreground,
	},
	bookAuthor: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	categoryCard: {
		alignItems: 'center',
		backgroundColor: colors.light.card,
		padding: 16,
		borderRadius: 12,
		marginRight: 12,
		minWidth: 80,
		marginVertical: 6,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: 5,
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
	conversationCard: {
		flexDirection: 'row',
		backgroundColor: colors.light.card,
		padding: 16,
		borderRadius: 12,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: 5,
	},
	conversationCover: {
		width: 80,
		height: 120,
		backgroundColor: colors.light.secondary,
		borderRadius: 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	conversationCoverImage: {
		width: 80,
		height: 120,
		borderRadius: 2,
	},
	conversationInfo: {
		flex: 1,
		justifyContent: 'space-between',
	},
	conversationTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	conversationAuthor: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginBottom: 8,
	},
	conversationMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	messageCount: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	messageCountText: {
		fontSize: 12,
		color: colors.light.foreground,
		marginLeft: 4,
	},
	lastChatTime: {
		fontSize: 12,
		color: colors.light.mutedForeground,
	},
	lastMessage: {
		fontSize: 13,
		color: colors.light.mutedForeground,
		fontStyle: 'italic',
		marginBottom: 12,
		lineHeight: 18,
	},
	continueButton: {
		backgroundColor: colors.light.accent,
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 6,
		alignSelf: 'flex-start',
		gap: 6,
	},
	continueButtonText: {
		color: colors.light.accentForeground,
		fontSize: 12,
		fontWeight: '500',
	},
	emptyChatsContainer: {
		alignItems: 'center',
		paddingVertical: 40,
		paddingHorizontal: 20,
	},
	emptyChatsText: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginTop: 16,
		marginBottom: 8,
	},
	emptyChatsSubtext: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 20,
	},
	exploreButton: {
		backgroundColor: colors.light.primary,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	exploreButtonText: {
		color: colors.light.primaryForeground,
		fontSize: 14,
		fontWeight: '600',
	},
	loadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	loadingText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.light.primary,
		marginLeft: 10,
	},
	bookImage: {
		width: '100%',
		height: '100%',
		borderRadius: 8,
	},
});
