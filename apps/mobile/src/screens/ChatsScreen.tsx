import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import { useAuth } from '../components/AuthProvider';
import { getRecentChats, deleteChatSession } from '../services/chat';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SwipeableChatItem } from '../components/SwipeableChatItem';
import { EmptyState } from '../components/EmptyState';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type ChatSession = {
	id: string;
	user_id: string;
	book_id: string;
	created_at: string;
	updated_at: string;
	books?: {
		title: string;
		author?: string;
		cover_url: string | null;
	};
};

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
};

export default function ChatsScreen() {
	const [chats, setChats] = useState<any[]>([]);
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

	// Refresh chats when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			if (user?.id) {
				loadChats();
			}
		}, [user?.id])
	);

	const loadChats = async () => {
		try {
			setLoading(true);
			const chatSessions = await getRecentChats(user!.id, 100);
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
		try {
			console.log('Deleting chat:', chatId);
			await deleteChatSession(chatId);
			setChats(prev => prev.filter(chat => chat.id !== chatId));
		} catch (error) {
			console.error('Error deleting chat:', error);
			showAlert('Error', 'Failed to delete conversation');
		}
	};

	const filteredChats = chats.filter(chat => {
		const title = chat.books?.title || '';
		return title.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const renderChatItem = ({ item }: { item: any }) => (
		<SwipeableChatItem
			item={item}
			onPress={chatItem =>
				navigation.navigate('ChatDetail', { bookId: chatItem.book_id })
			}
			onDelete={handleDeleteChat}
		/>
	);

	if (!user) {
		return (
			<EmptyState
				icon={{
					name: 'chatbubbles-outline',
					size: 64,
					color: colors.light.mutedForeground,
				}}
				title='Please sign in'
				subtitle='Sign in to view your conversations'
				containerStyle={styles.centerContainer}
			/>
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
		<GestureHandlerRootView style={styles.container}>
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
					<EmptyState
						icon={{
							name: 'chatbubbles-outline',
							size: 64,
							color: colors.light.mutedForeground,
						}}
						title={
							searchQuery ? 'No conversations found' : 'No conversations yet'
						}
						subtitle={
							searchQuery
								? 'Try adjusting your search terms'
								: 'Start a new conversation by selecting a book from your library'
						}
						containerStyle={styles.centerContainer}
					/>
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
		</GestureHandlerRootView>
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
		marginTop: 12,
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
	centerContainer: {
		flex: 1,
		marginTop: -100,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
});
