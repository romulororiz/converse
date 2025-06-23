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
import { showAlert } from '../utils/alert';
import { getFeaturedBooks } from '../services/books';
import { getRecentChats, deleteChatSession } from '../services/chat';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../components/AuthProvider';
import { Book } from '../types/supabase';
import { BookCover } from '../components/BookCover';
import { SwipeableChatItem } from '../components/SwipeableChatItem';
import { EmptyState } from '../components/EmptyState';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const categories = [
	{ id: 1, name: 'Romance', icon: 'heart' },
	{ id: 2, name: 'Classic Literature', icon: 'library' },
	{ id: 3, name: 'Adventure', icon: 'map' },
	{ id: 4, name: 'Mystery & Detective', icon: 'search' },
	{ id: 5, name: 'Science Fiction', icon: 'rocket' },
	{ id: 6, name: 'Philosophy', icon: 'bulb' },
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

	// Refresh recent chats when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			if (user) {
				loadRecentChats();
			}
		}, [user])
	);

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
		<TouchableOpacity
			key={category.id}
			style={styles.categoryCard}
			onPress={() =>
				navigation.navigate('BooksList', {
					category: category.name,
					title: category.name,
				})
			}
		>
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

	const handleDeleteChat = async (chatId: string) => {
		try {
			console.log('Deleting chat:', chatId);
			await deleteChatSession(chatId);
			setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
		} catch (error) {
			console.error('Error deleting chat:', error);
			showAlert('Error', 'Failed to delete conversation');
		}
	};

	const renderRecentChatCard = (chat: any, index: number) => {
		// Transform data to match SwipeableChatItem interface
		const chatData = {
			...chat,
			updated_at:
				chat.updated_at || chat.lastMessageTime || new Date().toISOString(),
			lastMessage: chat.lastMessage
				? chat.lastMessageRole === 'user'
					? `"${chat.lastMessage}"`
					: chat.lastMessage
				: undefined,
		};

		return (
			<View key={chat.id} style={index > 0 && { marginTop: 12 }}>
				<SwipeableChatItem
					item={chatData}
					onPress={chatItem =>
						navigation.navigate('ChatDetail', { bookId: chatItem.book_id })
					}
					onDelete={handleDeleteChat}
				/>
			</View>
		);
	};

	return (
		<GestureHandlerRootView style={styles.safeArea}>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView
					style={styles.container}
					showsVerticalScrollIndicator={false}
				>
					{/* Header Section */}
					<View style={styles.header}>
						<View style={styles.headerTop}>
							<Text style={styles.appTitle}>ConversAI</Text>
						</View>
						<Text style={styles.welcomeText}>
							Chat with your favorite books.
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
							<TouchableOpacity
								onPress={() => navigation.navigate('BooksList')}
							>
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
							<Text style={styles.sectionTitle}>Browse Categories</Text>
							<TouchableOpacity
								onPress={() => navigation.navigate('Categories')}
							>
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
							recentChats.map((chat, index) =>
								renderRecentChatCard(chat, index)
							)
						) : (
							<EmptyState
								icon={{
									name: 'chatbubbles-outline',
									size: 48,
									color: colors.light.mutedForeground,
								}}
								title='No conversations yet'
								subtitle='Start chatting with a book to see your conversations here'
								button={{
									text: 'Explore Books',
									onPress: () => navigation.navigate('Discover'),
									style: 'primary',
								}}
							/>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</GestureHandlerRootView>
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
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	sectionTitle: {
		width: 'auto',
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.light.foreground,
		height: '100%',
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
