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
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useAuth } from '../components/AuthProvider';
import { getUserChats, deleteChatSession } from '../services/chat';
import { getChatSessions } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { Database } from '../lib/supabase';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
	books?: {
		title: string;
		cover_url: string | null;
	};
};

export default function ChatsScreen() {
	const [chats, setChats] = useState<ChatSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const { user } = useAuth();
	const navigation = useNavigation<any>();

	useEffect(() => {
		if (user?.id) {
			loadChats();
		}
	}, [user?.id]);

	const loadChats = async () => {
		try {
			setLoading(true);
			const chatSessions = await getChatSessions();
			setChats(chatSessions);
		} catch (error) {
			console.error('Error loading chats:', error);
			Alert.alert('Error', 'Failed to load conversations');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteChat = async (sessionId: string) => {
		Alert.alert(
			'Delete Conversation',
			'Are you sure you want to delete this conversation? This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteChatSession(sessionId);
							setChats(prev => prev.filter(chat => chat.id !== sessionId));
						} catch (error) {
							console.error('Error deleting chat:', error);
							Alert.alert('Error', 'Failed to delete conversation');
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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 24) {
			return date.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			});
		} else if (diffInHours < 168) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	};

	const renderChatItem = ({ item }: { item: ChatSession }) => (
		<TouchableOpacity
			style={styles.chatItem}
			onPress={() =>
				navigation.navigate('ChatDetail', {
					sessionId: item.id,
					bookId: item.book_id,
				})
			}
		>
			<View style={styles.chatContent}>
				<View style={styles.bookCover}>
					{item.books?.cover_url ? (
						<Image
							source={{ uri: item.books.cover_url }}
							style={styles.bookImage}
						/>
					) : (
						<View style={styles.bookPlaceholder}>
							<Ionicons
								name='book-outline'
								size={24}
								color={colors.light.mutedForeground}
							/>
						</View>
					)}
				</View>
				<View style={styles.chatInfo}>
					<Text style={styles.bookTitle} numberOfLines={1}>
						{item.books?.title || 'Unknown Book'}
					</Text>
					<Text style={styles.chatDate}>{formatDate(item.updated_at)}</Text>
				</View>
				<TouchableOpacity
					style={styles.deleteButton}
					onPress={() => handleDeleteChat(item.id)}
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
					size={48}
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
		<View style={styles.container}>
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
						size={48}
						color={colors.light.mutedForeground}
					/>
					<Text style={styles.centerTitle}>No conversations yet</Text>
					<Text style={styles.centerSubtitle}>
						Start a new conversation by selecting a book from your library
					</Text>
				</View>
			) : (
				<FlatList
					data={filteredChats}
					renderItem={renderChatItem}
					keyExtractor={item => item.id}
					contentContainerStyle={styles.chatList}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	header: {
		padding: 20,
		paddingTop: 60,
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
		height: 50,
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
	},
	chatContent: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
	},
	bookCover: {
		width: 50,
		height: 65,
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
