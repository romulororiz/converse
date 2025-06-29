import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { BookCover } from './BookCover';
import {
	PanGestureHandler,
	PanGestureHandlerGestureEvent,
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

type ChatItemData = {
	id: string;
	book_id: string;
	updated_at: string;
	lastMessage?: string;
	books?: {
		title: string;
		author?: string;
		cover_url: string | null;
		year?: number | null;
		metadata?: {
			rating?: number | null;
		} | null;
	};
};

type SwipeableChatItemProps = {
	item: ChatItemData;
	onPress: (item: ChatItemData) => void;
	onDelete: (itemId: string) => Promise<void>;
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
					<Ionicons name="trash" size={20} color="#FFFFFF" />
				</Animated.View>
			</View>

			{/* Swipeable content */}
			<PanGestureHandler
				onGestureEvent={gestureHandler}
				activeOffsetX={[-10, 10]}
				failOffsetY={[-10, 10]}
			>
				<Animated.View style={animatedStyle}>
					{renderChild && renderChild(animatedStyle)}
				</Animated.View>
			</PanGestureHandler>
		</View>
	);
};

export const SwipeableChatItem: React.FC<SwipeableChatItemProps> = ({
	item,
	onPress,
	onDelete,
}) => {
	const { theme } = useTheme();
	const currentColors = colors[theme];

	// Safe date parsing with fallback
	const parseDate = (dateString: string | null | undefined): Date => {
		if (!dateString) return new Date();
		const parsed = new Date(dateString);
		return isNaN(parsed.getTime()) ? new Date() : parsed;
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
							await onDelete(chatId);
						} catch (error) {
							console.error('Error deleting chat:', error);
							// Error haptic feedback
							await Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Error
							);
						}
					},
				},
			]
		);
	};

	return (
		<SwipeableRow
			itemId={item.id}
			onDelete={handleDeleteChat}
			renderChild={animatedStyle => (
				<AnimatedTouchableOpacity
					style={animatedStyle}
					onPress={() => onPress(item)}
				>
					<View style={styles.chatContent}>
						<BookCover
							uri={item.books?.cover_url}
							style={styles.bookCover}
							placeholderIcon="book-outline"
							placeholderSize={24}
						/>

						<View
							style={[styles.chatInfo, { borderColor: currentColors.border }]}
						>
							<Text
								style={[styles.bookTitle, { color: currentColors.foreground }]}
								numberOfLines={1}
							>
								{item.books?.title || 'Unknown Book'}
							</Text>
							{item.books?.author && (
								<Text
									style={[
										styles.bookAuthor,
										{ color: currentColors.mutedForeground },
									]}
									numberOfLines={1}
								>
									{item.books.author}
									{item.books.year && ` • ${item.books.year}`}
								</Text>
							)}
							{/* Rating display */}
							{item.books?.metadata?.rating && (
								<View style={styles.ratingContainer}>
									<Ionicons
										name="star"
										size={12}
										color={currentColors.primary}
									/>
									<Text
										style={[
											styles.ratingText,
											{ color: currentColors.foreground },
										]}
									>
										{item.books.metadata.rating}
									</Text>
								</View>
							)}
							{item.lastMessage && (
								<Text
									style={[
										styles.lastMessage,
										{ color: currentColors.mutedForeground },
									]}
									numberOfLines={3}
								>
									{item.lastMessage}
								</Text>
							)}
							<View style={styles.timeContainer}>
								<Text
									style={[
										styles.chatDate,
										{ color: currentColors.mutedForeground },
									]}
								>
									{formatDistanceToNow(parseDate(item.updated_at), {
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
};

const styles = StyleSheet.create({
	// Swipe-to-delete styles
	swipeContainer: {
		// backgroundColor will be set dynamically
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
		backgroundColor: '#ef4444', // Red color for delete
		justifyContent: 'center',
		alignItems: 'center',
	},
	chatContent: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		minHeight: 120,
		position: 'relative',
	},
	bookCover: {
		width: Platform.OS === 'ios' ? 90 : 100,
		height: Platform.OS === 'ios' ? 120 : 150,
		borderRadius: 2,
		overflow: 'hidden',
		marginRight: 8,
	},
	bookImage: {
		width: '100%',
		height: '100%',
	},
	bookPlaceholder: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	chatInfo: {
		flex: 1,
		borderBottomWidth: 1,
		height: '100%',
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2,
	},
	bookAuthor: {
		fontSize: 12,
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
		fontSize: 10,
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
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	centerSubtitle: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 22,
	},
	lastMessage: {
		fontSize: 12,
		fontStyle: 'italic',
		marginTop: -2,
		width: '60%',
		position: 'absolute',
		bottom: 5,
		left: 0,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
		marginBottom: 4,
	},
	ratingText: {
		fontSize: 12,
		marginLeft: 4,
		fontWeight: '500',
	},
});
