import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	RefreshControl,
	SafeAreaView,
	StatusBar,
	Dimensions,
	TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { getRecentChats, deleteChatSession } from '../services/chat';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SwipeableChatItem } from '../components/SwipeableChatItem';
import { EmptyState } from '../components/EmptyState';
import { SearchBar } from '../components/SearchBar';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { MessageCounterBadge } from '../components/MessageCounterBadge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PremiumPaywallDrawer } from '../components/PremiumPaywallDrawer';
import { ScreenHeader } from '../components';

const { width } = Dimensions.get('window');

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
	goBack: () => void;
};

export default function ChatsScreen() {
	const [chats, setChats] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const { user } = useAuth();
	const { theme, isDark } = useTheme();
	const currentColors = colors[theme];
	const navigation = useNavigation<NavigationProp>();
	const [badgeRefreshKey, setBadgeRefreshKey] = useState(0);
	const [showPaywall, setShowPaywall] = useState(false);

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
				setBadgeRefreshKey(k => k + 1); // Force badge refresh on focus
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
		const author = chat.books?.author || '';
		return (
			title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			author.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	const renderSkeletonList = () => (
		<View style={styles.skeletonContainer}>
			{Array.from({ length: 5 }).map((_, index) => (
				<View key={index} style={styles.skeletonItem}>
					<SkeletonLoader
						width={60}
						height={80}
						borderRadius={4}
						style={{ marginRight: 12 }}
					/>
					<View style={styles.skeletonInfo}>
						<SkeletonLoader
							width={180}
							height={18}
							style={{ marginBottom: 8 }}
						/>
						<SkeletonLoader
							width={120}
							height={14}
							style={{ marginBottom: 12 }}
						/>
						<SkeletonLoader width={200} height={16} />
					</View>
				</View>
			))}
		</View>
	);

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
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>
				<EmptyState
					icon={{
						name: 'chatbubbles-outline',
						size: 64,
						color: currentColors.mutedForeground,
					}}
					title="Please sign in"
					subtitle="Sign in to view your conversations"
					containerStyle={styles.centerContainer}
				/>
			</SafeAreaView>
		);
	}

	if (loading && chats.length === 0) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>

				{/* Fixed Header */}
				<View
					style={[
						styles.fixedContent,
						{ backgroundColor: currentColors.background },
					]}
				>
					<View style={styles.descriptionContainer}>
						<SkeletonLoader
							width={250}
							height={28}
							style={{ marginBottom: 8 }}
						/>
						<SkeletonLoader width={200} height={16} />
					</View>

					{/* Search Bar Skeleton */}
					<View style={styles.searchContainer}>
						<SkeletonLoader width={width - 32} height={48} borderRadius={12} />
					</View>
				</View>

				{/* Scrollable Content Skeleton */}
				<View style={styles.scrollableContent}>{renderSkeletonList()}</View>
			</SafeAreaView>
		);
	}

	return (
		<GestureHandlerRootView
			style={[styles.container, { backgroundColor: currentColors.background }]}
		>
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>

				{/* Header */}
				<ScreenHeader
					title="Your Conversations"
					showBackButton={true}
					onBackPress={() => navigation.goBack()}
					rightComponent={
						<MessageCounterBadge
							variant="pill"
							label="FREE MESSAGES"
							refreshKey={badgeRefreshKey}
							onPress={() => setShowPaywall(true)}
							style={{ marginRight: 8 }}
						/>
					}
				/>

				{/* Fixed Content */}
				<View
					style={[
						styles.fixedContent,
						{ backgroundColor: currentColors.background },
					]}
				>
					{/* Page Description */}
					<View style={styles.descriptionContainer}>
						<Text
							style={[
								styles.descriptionTitle,
								{ color: currentColors.foreground },
							]}
						>
							Your Conversations
						</Text>
						<Text
							style={[
								styles.descriptionText,
								{ color: currentColors.mutedForeground },
							]}
						>
							Continue your literary journey. Manage and revisit your book
							conversations.
						</Text>
					</View>

					{/* Search Bar */}
					<SearchBar
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search conversations..."
						containerStyle={[
							styles.searchContainer,
							{ backgroundColor: currentColors.background },
						]}
						inputStyle={{ color: currentColors.foreground }}
						iconColor={currentColors.mutedForeground}
					/>

					{/* Results Info */}
					<View style={styles.resultsContainer}>
						<Text
							style={[
								styles.resultsText,
								{ color: currentColors.mutedForeground },
							]}
						>
							{filteredChats.length} conversation
							{filteredChats.length === 1 ? '' : 's'}
							{searchQuery ? ` matching "${searchQuery}"` : ''}
						</Text>
					</View>
				</View>

				{/* Scrollable Chat List */}
				<FlatList
					style={styles.scrollableContent}
					data={filteredChats}
					renderItem={renderChatItem}
					keyExtractor={item => item.id}
					showsVerticalScrollIndicator={false}
					scrollEnabled={true}
					nestedScrollEnabled={true}
					contentInsetAdjustmentBehavior="automatic"
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={currentColors.primary}
							colors={[currentColors.primary]}
						/>
					}
					ListEmptyComponent={
						<EmptyState
							icon={{
								name: searchQuery ? 'search-outline' : 'chatbubbles-outline',
								size: 64,
								color: currentColors.mutedForeground,
							}}
							title={
								searchQuery ? 'No conversations found' : 'No conversations yet'
							}
							subtitle={
								searchQuery
									? 'Try adjusting your search terms'
									: 'Start a new conversation by selecting a book from your library'
							}
							button={
								!searchQuery
									? {
											text: 'Explore Books',
											onPress: () => navigation.navigate('Discover'),
											style: 'primary',
										}
									: {
											text: 'Clear Search',
											onPress: () => setSearchQuery(''),
											style: 'secondary',
										}
							}
							containerStyle={styles.centerContainer}
						/>
					}
					contentContainerStyle={
						filteredChats.length === 0 ? { flex: 1 } : styles.chatList
					}
				/>
			</SafeAreaView>
			<PremiumPaywallDrawer
				visible={showPaywall}
				onClose={() => setShowPaywall(false)}
				onPurchase={() => setShowPaywall(false)}
				onRestore={() => setShowPaywall(false)}
				onPrivacyPolicy={() => setShowPaywall(false)}
			/>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	fixedContent: {
		// Fixed content that doesn't scroll
	},
	scrollableContent: {
		flex: 1,
	},
	skeletonContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	skeletonItem: {
		flexDirection: 'row',
		padding: 12,
		marginBottom: 12,
	},
	skeletonInfo: {
		flex: 1,
	},
	descriptionContainer: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20,
	},
	descriptionTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 14,
	},
	searchContainer: {
		paddingHorizontal: 16,
		paddingBottom: 15,
		paddingTop: -10,
	},
	resultsContainer: {
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	resultsText: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	chatList: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 100,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		maxHeight: 70,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
		flex: 0.3,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		flex: 0.75,
	},
	headerRight: {
		width: 40,
		flex: 0.55,
	},
});
