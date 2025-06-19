import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	TouchableOpacity,
	Image,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
	SafeAreaView,
	Keyboard,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useAuth } from '../components/AuthProvider';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	GestureHandlerRootView,
	PanGestureHandler,
	PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {
	getOrCreateChatSession,
	getChatMessages,
	sendMessage,
	getAIResponse,
} from '../services/chat';
import { getBookById } from '../services/books';
import type { Book, ChatMessage } from '../types/supabase';

type RootStackParamList = {
	ChatDetail: { bookId: string };
};

type ChatDetailScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'ChatDetail'
>;
type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [book, setBook] = useState<Book | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const { user } = useAuth();
	const route = useRoute<ChatDetailScreenRouteProp>();
	const navigation = useNavigation<ChatDetailScreenNavigationProp>();
	const flatListRef = useRef<FlatList<ChatMessage>>(null);
	const { bookId } = route.params;

	useEffect(() => {
		if (user?.id && bookId) {
			loadChatData();
		}
	}, [user?.id, bookId]);

	const loadChatData = async () => {
		try {
			setLoading(true);

			// Load book data
			const bookData = await getBookById(bookId);
			if (bookData) {
				setBook(bookData);
			} else {
				Alert.alert('Error', 'Book not found');
				navigation.goBack();
				return;
			}

			// Get or create chat session
			const session = await getOrCreateChatSession(user!.id, bookId);
			setSessionId(session.id);

			// Load messages
			const chatMessages = await getChatMessages(session.id);
			setMessages(chatMessages as ChatMessage[]);
		} catch (error) {
			console.error('Error loading chat data:', error);
			Alert.alert('Error', 'Failed to load conversation');
		} finally {
			setLoading(false);
		}
	};

	const handleSendMessage = async () => {
		if (!newMessage.trim() || !sessionId || sending) return;

		const userMessage = newMessage.trim();
		setNewMessage('');
		setSending(true);

		try {
			// Add user message immediately
			const userMsg = await sendMessage(sessionId, userMessage, 'user');
			setMessages(prev => [...prev, userMsg as ChatMessage]);

			// Get AI response
			const aiResponse = await getAIResponse(sessionId, userMessage);
			const aiMsg = await sendMessage(sessionId, aiResponse, 'assistant');
			setMessages(prev => [...prev, aiMsg as ChatMessage]);
		} catch (error) {
			console.error('Error sending message:', error);
			Alert.alert('Error', 'Failed to send message');
		} finally {
			setSending(false);
		}
	};

	const renderMessage = ({ item }: { item: ChatMessage; index: number }) => {
		const isUser = item.role === 'user';

		return (
			<View
				style={[
					styles.messageContainer,
					isUser ? styles.userMessage : styles.aiMessage,
				]}
			>
				<View
					style={[
						styles.messageBubble,
						isUser ? styles.userBubble : styles.aiBubble,
					]}
				>
					<Text
						style={[
							styles.messageText,
							isUser ? styles.userText : styles.aiText,
						]}
					>
						{item.content}
					</Text>
				</View>
			</View>
		);
	};

	const renderTypingIndicator = () => {
		if (!sending) return null;

		return (
			<View style={[styles.messageContainer, styles.aiMessage]}>
				<View style={[styles.messageBubble, styles.aiBubble]}>
					<View style={styles.typingIndicator}>
						<ActivityIndicator size='small' color={colors.light.foreground} />
						<Text
							style={[styles.messageText, styles.aiText, styles.typingText]}
						>
							AI is typing...
						</Text>
					</View>
				</View>
			</View>
		);
	};

	const handleGesture = (event: PanGestureHandlerGestureEvent) => {
		const { translationY } = event.nativeEvent;

		if (translationY > 50) {
			// If user has dragged down more than 50 units
			Keyboard.dismiss();
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
			</SafeAreaView>
		);
	}

	return (
		<GestureHandlerRootView style={styles.safeArea}>
			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.container}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
				>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity
							style={styles.backButton}
							onPress={() => navigation.goBack()}
						>
							<Ionicons
								name='arrow-back'
								size={24}
								color={colors.light.foreground}
							/>
						</TouchableOpacity>

						<View style={styles.bookInfo}>
							<View style={styles.bookCover}>
								{book?.cover_url ? (
									<Image
										source={{ uri: book.cover_url }}
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
							<View style={styles.bookDetails}>
								<Text style={styles.bookTitle} numberOfLines={1}>
									{book?.title || 'Unknown Book'}
								</Text>
								<Text style={styles.bookAuthor} numberOfLines={1}>
									{book?.author?.name || 'Unknown Author'}
								</Text>
							</View>
						</View>
					</View>

					{/* Messages */}
					<View style={styles.messagesContainer}>
						<FlatList
							ref={flatListRef}
							data={messages}
							renderItem={renderMessage}
							keyExtractor={item => item.id}
							contentContainerStyle={styles.messagesList}
							showsVerticalScrollIndicator={false}
							onContentSizeChange={() =>
								flatListRef.current?.scrollToEnd({ animated: true })
							}
							ListEmptyComponent={
								<View style={styles.emptyContainer}>
									<Ionicons
										name='chatbubbles-outline'
										size={48}
										color={colors.light.mutedForeground}
									/>
									<Text style={styles.emptyTitle}>Start the conversation!</Text>
									<Text style={styles.emptySubtitle}>
										Ask questions about this book, discuss themes, or explore
										its meaning
									</Text>
								</View>
							}
							ListFooterComponent={renderTypingIndicator}
						/>
					</View>

					{/* Input with Gesture Handler */}
					<PanGestureHandler onGestureEvent={handleGesture}>
						<View style={styles.inputContainer}>
							<View style={styles.gestureIndicator} />
							<View style={styles.inputWrapper}>
								<TextInput
									style={styles.textInput}
									placeholder='Type your message...'
									placeholderTextColor={colors.light.mutedForeground}
									value={newMessage}
									onChangeText={setNewMessage}
									multiline
									maxLength={500}
									onSubmitEditing={Keyboard.dismiss}
								/>
								<TouchableOpacity
									style={[
										styles.sendButton,
										(!newMessage.trim() || sending) &&
											styles.sendButtonDisabled,
									]}
									onPress={handleSendMessage}
									disabled={!newMessage.trim() || sending}
								>
									<Ionicons
										name='send'
										size={20}
										color={
											newMessage.trim() && !sending
												? colors.light.primaryForeground
												: colors.light.mutedForeground
										}
									/>
								</TouchableOpacity>
							</View>
						</View>
					</PanGestureHandler>
				</KeyboardAvoidingView>
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
		backgroundColor: colors.light.background,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.light.background,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: Platform.OS === 'ios' ? 0 : 40,
		paddingHorizontal: 16,
		paddingBottom: 16,
		backgroundColor: colors.light.card,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	messagesContainer: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	backButton: {
		marginRight: 16,
		padding: 8,
	},
	bookInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	bookCover: {
		width: 40,
		height: 50,
		borderRadius: 6,
		overflow: 'hidden',
		marginRight: 12,
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
	bookDetails: {
		flex: 1,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.foreground,
		marginBottom: 2,
	},
	bookAuthor: {
		fontSize: 14,
		color: colors.light.mutedForeground,
	},
	messagesList: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		flexGrow: 1,
	},
	messageContainer: {
		marginBottom: 12,
	},
	userMessage: {
		alignItems: 'flex-end',
	},
	aiMessage: {
		alignItems: 'flex-start',
	},
	messageBubble: {
		maxWidth: '80%',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
	},
	userBubble: {
		backgroundColor: colors.light.primary,
		borderBottomRightRadius: 4,
	},
	aiBubble: {
		backgroundColor: colors.light.card,
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	messageText: {
		fontSize: 16,
		lineHeight: 22,
	},
	userText: {
		color: colors.light.primaryForeground,
	},
	aiText: {
		color: colors.light.foreground,
	},
	typingIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	typingText: {
		marginLeft: 8,
		fontStyle: 'italic',
	},
	emptyContainer: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.light.foreground,
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		lineHeight: 20,
		paddingHorizontal: 32,
	},
	inputContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: colors.light.card,
		borderTopWidth: 1,
		borderTopColor: colors.light.border,
	},
	gestureIndicator: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.light.mutedForeground,
		opacity: 0.2,
		alignSelf: 'center',
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		backgroundColor: colors.light.background,
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: colors.light.border,
		minHeight: 50,
		maxHeight: 120,
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		color: colors.light.foreground,
		maxHeight: 100,
		paddingVertical: Platform.OS === 'ios' ? 8 : 4,
		paddingRight: 8,
	},
	sendButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.light.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 8,
	},
	sendButtonDisabled: {
		backgroundColor: colors.light.muted,
	},
});
