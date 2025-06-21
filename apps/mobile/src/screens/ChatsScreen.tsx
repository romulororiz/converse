import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Image,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import { useAuth } from '../components/AuthProvider';
import { getUserChats, deleteChatSession } from '../services/chat';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { BookCover } from '../components/BookCover';

type ChatSession = {
	id: string;
	user_id: string;
	book_id: string;
	created_at: string;
	updated_at: string;
	books?: {
		title: string;
		cover_url: string | null;
	};
};

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
};

export default function ChatsScreen() {
	const [chats, setChats] = useState<ChatSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const { user } = useAuth();
	const navigation = useNavigation<NavigationProp>();

	useEffect(() => {
		if (user?.id) {
			loadChats();
		}
	}, [user?.id]);

	const loadChats = async () => {
		try {
			setLoading(true);
			const chatSessions = await getUserChats(user!.id);
			setChats(chatSessions);
		} catch (error) {
			console.error('Error loading chats:', error);
			showAlert('Error', 'Failed to load conversations');
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadChats();
		setRefreshing(false);
	};

	const handleDeleteChat = async (chatId: string) => {
		showAlert(
			'Delete Conversation',
			'Are you sure you want to delete this conversation? This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							console.log('Deleting chat:', chatId);
							await deleteChatSession(chatId);
							setChats(prev => prev.filter(chat => chat.id !== chatId));
						} catch (error) {
							console.error('Error deleting chat:', error);
							showAlert('Error', 'Failed to delete conversation');
						}
					},
				},
			]
		);
	};

	const filteredChats = chats.filter(chat => {
		const title = chat.books?.title || '';
		return title.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const renderChatItem = ({ item }: { item: ChatSession }) => (
		<TouchableOpacity
			style={styles.chatItem}
			onPress={() =>
				navigation.navigate('ChatDetail', { bookId: item.book_id })
			}
			onLongPress={() => handleDeleteChat(item.id)}
		>
			<View style={styles.chatContent}>
				<BookCover
					uri={item.books?.cover_url}
					style={styles.bookCover}
					placeholderIcon='book-outline'
					placeholderSize={24}
				/>

				<View style={styles.chatInfo}>
					<Text style={styles.bookTitle} numberOfLines={1}>
						{item.books?.title || 'Unknown Book'}
					</Text>
					<Text style={styles.chatDate}>
						{formatDistanceToNow(new Date(item.updated_at), {
							addSuffix: true,
						})}
					</Text>
				</View>

				<TouchableOpacity
					style={styles.deleteButton}
					onPress={() => {
						console.log('Trash button pressed for chat:', item.id);
						handleDeleteChat(item.id);
					}}
				>
					<Ionicons
						name='trash-outline'
						size={20}
						color={colors.light.destructive}
					/>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);

	if (!user) {
		return (
			<View style={styles.centerContainer}>
				<Ionicons
					name='chatbubbles-outline'
					size={64}
					color={colors.light.mutedForeground}
				/>
				<Text style={styles.centerTitle}>Please sign in</Text>
				<Text style={styles.centerSubtitle}>
					Sign in to view your conversations
				</Text>
			</View>
		);
	}

	if (loading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Your Conversations</Text>
				<Text style={styles.subtitle}>Continue your literary journey</Text>
			</View>

			<View style={styles.searchContainer}>
				<Ionicons
					name='search-outline'
					size={20}
					color={colors.light.mutedForeground}
					style={styles.searchIcon}
				/>
				<TextInput
					style={styles.searchInput}
					placeholder='Search conversations...'
					placeholderTextColor={colors.light.mutedForeground}
					value={searchQuery}
					onChangeText={setSearchQuery}
				/>
			</View>

			{filteredChats.length === 0 ? (
				<View style={styles.centerContainer}>
					<Ionicons
						name='chatbubbles-outline'
						size={64}
						color={colors.light.mutedForeground}
					/>
					<Text style={styles.centerTitle}>
						{searchQuery ? 'No conversations found' : 'No conversations yet'}
					</Text>
					<Text style={styles.centerSubtitle}>
						{searchQuery
							? 'Try adjusting your search terms'
							: 'Start a new conversation by selecting a book from your library'}
					</Text>
				</View>
			) : (
				<FlatList
					data={filteredChats}
					renderItem={renderChatItem}
					keyExtractor={item => item.id}
					contentContainerStyle={styles.chatList}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	header: {
		padding: 20,
		paddingTop: 20,
		paddingBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.light.card,
		marginHorizontal: 20,
		marginBottom: 20,
		borderRadius: 12,
		paddingHorizontal: 16,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	searchIcon: {
		marginRight: 12,
	},
	searchInput: {
		flex: 1,
		height: 48,
		color: colors.light.foreground,
		fontSize: 16,
	},
	chatList: {
		paddingHorizontal: 20,
	},
	chatItem: {
		backgroundColor: colors.light.card,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.light.border,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 3.84,
		elevation: 5,
	},
	chatContent: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
	},
	bookCover: {
		width: 60,
		height: 80,
		borderRadius: 8,
		overflow: 'hidden',
		marginRight: 16,
	},
	bookImage: {
		width: '100%',
		height: '100%',
	},
	bookPlaceholder: {
		width: '100%',
		height: '100%',
		backgroundColor: colors.light.muted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	chatInfo: {
		flex: 1,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 4,
	},
	chatDate: {
		fontSize: 14,
		color: colors.light.mutedForeground,
	},
	deleteButton: {
		padding: 8,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	centerTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: colors.light.foreground,
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	centerSubtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 22,
	},
});
