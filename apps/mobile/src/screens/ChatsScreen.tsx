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
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import { useAuth } from '../components/AuthProvider';
import { getRecentChats, deleteChatSession } from '../services/chat';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { BookCover } from '../components/BookCover';
import {
	GestureHandlerRootView,
	PanGestureHandler,
	PanGestureHandlerGestureEvent,
	State,
} from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useAnimatedGestureHandler,
	withSpring,
	withTiming,
	runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Create animated TouchableOpacity
const AnimatedTouchableOpacity =
	Animated.createAnimatedComponent(TouchableOpacity);

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

// Swipeable Row Component for professional swipe-to-delete
const SwipeableRow = ({
	children,
	renderChild,
	onDelete,
	itemId,
}: {
	children?: React.ReactNode;
	renderChild?: (animatedStyle: any) => React.ReactNode;
	onDelete: (id: string, resetPosition?: () => void) => void;
	itemId: string;
}) => {
	const translateX = useSharedValue(0);
	const deleteButtonScale = useSharedValue(0);
	const deleteButtonOpacity = useSharedValue(0);

	const DELETE_THRESHOLD = -100;
	const HAPTIC_THRESHOLD = -60;
	const MAX_SWIPE = -120;

	let hapticTriggered = false;

	// Function to reset swipe position
	const resetPosition = () => {
		translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
		deleteButtonScale.value = withSpring(0, { damping: 15, stiffness: 300 });
		deleteButtonOpacity.value = withTiming(0, { duration: 200 });
	};

	const gestureHandler =
		useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
			onStart: () => {
				hapticTriggered = false;
			},
			onActive: event => {
				// Only allow left swipe (negative translation)
				if (event.translationX < 0) {
					// Limit the maximum swipe distance
					const newTranslateX = Math.max(event.translationX, MAX_SWIPE);
					translateX.value = newTranslateX;

					// Show delete button when threshold is reached
					if (newTranslateX <= HAPTIC_THRESHOLD) {
						deleteButtonScale.value = withSpring(1, {
							damping: 15,
							stiffness: 300,
						});
						deleteButtonOpacity.value = withTiming(1, { duration: 200 });

						// Trigger haptic feedback once
						if (!hapticTriggered) {
							hapticTriggered = true;
							runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
						}
					} else {
						deleteButtonScale.value = withSpring(0, {
							damping: 15,
							stiffness: 300,
						});
						deleteButtonOpacity.value = withTiming(0, { duration: 200 });
					}
				}
			},
			onEnd: event => {
				// If swiped past delete threshold, trigger delete
				if (translateX.value <= DELETE_THRESHOLD) {
					// Stronger haptic for delete action
					runOnJS(Haptics.notificationAsync)(
						Haptics.NotificationFeedbackType.Warning
					);
					// Animate to full swipe before calling delete
					translateX.value = withTiming(MAX_SWIPE, { duration: 200 }, () => {
						runOnJS(onDelete)(itemId, resetPosition);
					});
				} else {
					// Spring back to original position
					runOnJS(resetPosition)();
				}
			},
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const animatedBorderStyle = useAnimatedStyle(() => ({
		borderRadius: 8,
		borderTopRightRadius: translateX.value < -10 ? 0 : 8,
		borderBottomRightRadius: translateX.value < -10 ? 0 : 8,
	}));

	const animatedInnerBorderStyle = useAnimatedStyle(() => ({
		borderTopRightRadius: translateX.value < -10 ? 0 : 8,
		borderBottomRightRadius: translateX.value < -10 ? 0 : 8,
	}));

	const deleteButtonStyle = useAnimatedStyle(() => ({
		transform: [{ scale: deleteButtonScale.value }],
		opacity: deleteButtonOpacity.value,
	}));

	return (
		<View style={styles.swipeContainer}>
			{/* Delete button background */}
			<View style={styles.deleteBackground}>
				<Animated.View
					style={[styles.deleteButtonContainer, deleteButtonStyle]}
				>
					<Ionicons name='trash' size={20} color='#FFFFFF' />
				</Animated.View>
			</View>

			{/* Swipeable content */}
			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View
					style={[styles.swipeableContent, animatedStyle, animatedBorderStyle]}
				>
					{renderChild ? renderChild(animatedInnerBorderStyle) : children}
				</Animated.View>
			</PanGestureHandler>
		</View>
	);
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

	const handleDeleteChat = async (
		chatId: string,
		resetPosition?: () => void
	) => {
		// Haptic feedback for delete confirmation
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

		Alert.alert(
			'Delete Conversation',
			'Are you sure you want to delete this conversation? This action cannot be undone.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
					onPress: () => {
						// Light haptic feedback for cancel
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						// Reset swipe position if provided
						if (resetPosition) {
							resetPosition();
						}
					},
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							// Strong haptic feedback for delete
							await Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Success
							);
							console.log('Deleting chat:', chatId);
							await deleteChatSession(chatId);
							setChats(prev => prev.filter(chat => chat.id !== chatId));
						} catch (error) {
							console.error('Error deleting chat:', error);
							// Error haptic feedback
							await Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Error
							);
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

	const renderChatItem = ({ item }: { item: any }) => (
		<SwipeableRow
			itemId={item.id}
			onDelete={handleDeleteChat}
			renderChild={animatedStyle => (
				<AnimatedTouchableOpacity
					style={[styles.chatItem, animatedStyle]}
					onPress={() =>
						navigation.navigate('ChatDetail', { bookId: item.book_id })
					}
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
							{item.books?.author && (
								<Text style={styles.bookAuthor} numberOfLines={1}>
									{item.books.author}
								</Text>
							)}
							{item.lastMessage && (
								<Text style={styles.lastMessage} numberOfLines={1}>
									{item.lastMessage}
								</Text>
							)}
							<View style={styles.timeContainer}>
								<Text style={styles.chatDate}>
									{formatDistanceToNow(new Date(item.updated_at), {
										addSuffix: true,
									})}
								</Text>
							</View>
						</View>
					</View>
				</AnimatedTouchableOpacity>
			)}
		/>
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
	// Swipe-to-delete styles
	swipeContainer: {
		backgroundColor: colors.light.background,
		marginBottom: 12,
	},
	deleteBackground: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		right: 0,
		width: 120,
		justifyContent: 'center',
		alignItems: 'flex-end',
	},
	deleteButtonContainer: {
		width: 50,
		height: 50,
		borderRadius: 30,
		backgroundColor: colors.light.destructive,
		justifyContent: 'center',
		alignItems: 'center',
	},
	swipeableContent: {
		// backgroundColor: colors.light.background,
		// shadowOffset: { width: 0, height: 2 },
		// shadowOpacity: 0.25,
		// shadowRadius: 3,
		// elevation: 5,
		// shadowColor: '#000',
	},
	chatItem: {
		// backgroundColor: colors.light.card,
		// borderWidth: 1,
		// overflow: 'hidden',
		// borderRadius: 8,
	},
	chatContent: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		minHeight: 120,
		position: 'relative',
	},
	bookCover: {
		width: 70,
		height: 100,
		borderRadius: 2,
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
		justifyContent: 'center',
		borderBottomWidth: 1,
		borderColor: colors.light.border,
		height: 100,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 2,
	},
	bookAuthor: {
		fontSize: 14,
		fontStyle: 'italic',
		color: colors.light.mutedForeground,
		marginBottom: 4,
	},
	timeContainer: {
		display: 'flex',
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
		position: 'absolute',
		bottom: 5,
		right: 0,
	},
	chatDate: {
		fontSize: 8,
		color: colors.light.mutedForeground,
		textAlign: 'right',
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
	lastMessage: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		marginTop: -2,
		width: '65%',
		position: 'absolute',
		bottom: 5,
		left: 0,
	},
});
