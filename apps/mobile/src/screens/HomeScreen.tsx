import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
	StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import { getFeaturedBooks } from '../services/books';
import { getRecentChats, deleteChatSession } from '../services/chat';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategoriesWithCounts, Category } from '../services/categories';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { Book } from '../types/supabase';
import { BookCover } from '../components/BookCover';
import { SwipeableChatItem } from '../components/SwipeableChatItem';
import { EmptyState } from '../components/EmptyState';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SeeMore } from '../components/SeeMore';

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
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];
	const [categories, setCategories] = useState<Category[]>([]);

	useEffect(() => {
		loadFeaturedBooks();
		if (user) {
			loadRecentChats();
		}
	}, [user]);

	useEffect(() => {
		const fetchCategories = async () => {
			const categories = await getCategoriesWithCounts();
			setCategories(categories);
		};
		fetchCategories();
	}, []);

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
			onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
		>
			<View style={styles.bookCoverContainer}>
				<BookCover
					uri={item.cover_url}
					style={styles.bookCover}
					placeholderIcon="book-outline"
					placeholderSize={32}
				/>
			</View>
			<Text
				style={[styles.bookTitle, { color: currentColors.foreground }]}
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
		</TouchableOpacity>
	);

	const renderCategoryCard = (category: any) => (
		<TouchableOpacity
			style={[styles.categoryCard, { backgroundColor: currentColors.card }]}
			onPress={() =>
				navigation.navigate('BooksList', {
					category: category.name,
					title: category.name,
				})
			}
		>
			<View
				style={[
					styles.categoryIcon,
					{ backgroundColor: currentColors.primary + '20' },
				]}
			>
				<Ionicons
					name={category.icon as any}
					size={24}
					color={currentColors.primary}
				/>
			</View>
			<Text style={[styles.categoryName, { color: currentColors.foreground }]}>
				{category.name}
			</Text>
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
		<GestureHandlerRootView
			style={[styles.safeArea, { backgroundColor: currentColors.background }]}
		>
			<SafeAreaView
				style={[styles.safeArea, { backgroundColor: currentColors.background }]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>
				<ScrollView
					style={[
						styles.container,
						{ backgroundColor: currentColors.background },
					]}
					showsVerticalScrollIndicator={false}
				>
					{/* Header Section */}
					<View
						style={[styles.header, { backgroundColor: currentColors.card }]}
					>
						<View style={styles.headerTop}>
							<Text
								style={[styles.appTitle, { color: currentColors.foreground }]}
							>
								ConversAI
							</Text>
						</View>
						<Text
							style={[
								styles.welcomeText,
								{ color: currentColors.mutedForeground },
							]}
						>
							Chat with your favorite books.
						</Text>
						<TouchableOpacity
							style={[
								styles.ctaButton,
								{ backgroundColor: currentColors.primary },
							]}
							onPress={() => navigation.navigate('Discover')}
						>
							<Text
								style={[
									styles.ctaButtonText,
									{ color: currentColors.primaryForeground },
								]}
							>
								Explore Books
							</Text>
							<Ionicons
								name="arrow-forward"
								size={20}
								color={currentColors.primaryForeground}
							/>
						</TouchableOpacity>
					</View>

					{/* Featured Books Carousel */}
					<View style={styles.section}>
						{loading ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" color={currentColors.primary} />
								<Text
									style={[
										styles.loadingText,
										{ color: currentColors.mutedForeground },
									]}
								>
									Loading books...
								</Text>
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
								<SeeMore variant="books" />
							</ScrollView>
						)}
					</View>

					{/* Categories */}
					<View style={styles.section}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.carousel}
						>
							{categories.slice(0, 6).map(category => (
								<View key={category.name}>{renderCategoryCard(category)}</View>
							))}
							<SeeMore variant="categories" />
						</ScrollView>
					</View>

					{/* Recent Conversations */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text
								style={[
									styles.sectionTitle,
									{ color: currentColors.foreground },
								]}
							>
								Recent Conversations
							</Text>
							<TouchableOpacity onPress={() => navigation.navigate('Chats')}>
								<Text
									style={[styles.seeAllText, { color: currentColors.primary }]}
								>
									See All
								</Text>
							</TouchableOpacity>
						</View>

						{chatsLoading ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="small" color={currentColors.primary} />
								<Text
									style={[
										styles.loadingText,
										{ color: currentColors.mutedForeground },
									]}
								>
									Loading conversations...
								</Text>
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
									color: currentColors.mutedForeground,
								}}
								title="No conversations yet"
								subtitle="Start chatting with a book to see your conversations here"
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
	},
	container: {
		flex: 1,
	},
	header: {
		padding: 20,
		paddingTop: 20,
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
	},
	profileButton: {
		padding: 4,
	},
	welcomeText: {
		fontSize: 16,
		marginBottom: 20,
		lineHeight: 22,
	},
	ctaButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		borderRadius: 12,
		gap: 8,
	},
	ctaButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	section: {
		width: '100%',
		marginTop: 16,
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
	},
	seeAllText: {
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
	},
	bookTitleContinueReading: {
		width: '70%',
		fontSize: 14,
		fontWeight: '600',
	},
	bookAuthor: {
		fontSize: 12,
	},
	categoryCard: {
		width: 100,
		height: 100,
		marginRight: 16,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
	},
	categoryIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	categoryName: {
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
	},
	loadingContainer: {
		padding: 20,
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 8,
		fontSize: 14,
	},
});
