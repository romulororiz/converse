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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useAuth } from '../components/AuthProvider';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
	getOrCreateChatSession,
	getChatMessages,
	sendMessage,
	getAIResponse,
} from '../services/chat';
import { getBookById } from '../services/books';

type Message = {
	id: string;
	content: string;
	role: 'user' | 'assistant';
	created_at: string;
	session_id: string;
};

type RouteParams = {
	bookId: string;
};

export default function ChatDetailScreen() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [book, setBook] = useState<any>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const { user } = useAuth();
	const route = useRoute();
	const navigation = useNavigation();
	const flatListRef = useRef<FlatList>(null);
	const { bookId } = route.params as RouteParams;

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
			setBook(bookData);

			// Get or create chat session
			const session = await getOrCreateChatSession(user!.id, bookId);
			setSessionId(session.id);

			// Load messages
			const chatMessages = await getChatMessages(session.id);
			setMessages(chatMessages);
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
			setMessages(prev => [...prev, userMsg]);

			// Get AI response
			const aiResponse = await getAIResponse(sessionId, userMessage);
			const aiMsg = await sendMessage(sessionId, aiResponse, 'assistant');
			setMessages(prev => [...prev, aiMsg]);
		} catch (error) {
			console.error('Error sending message:', error);
			Alert.alert('Error', 'Failed to send message');
		} finally {
			setSending(false);
		}
	};

	const renderMessage = ({ item, index }: { item: Message; index: number }) => {
		const isUser = item.role === 'user';
		const isLastMessage = index === messages.length - 1;

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

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={colors.light.primary} />
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
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
							Ask questions about this book, discuss themes, or explore its
							meaning
						</Text>
					</View>
				}
				ListFooterComponent={renderTypingIndicator}
			/>

			{/* Input */}
			<View style={styles.inputContainer}>
				<View style={styles.inputWrapper}>
					<TextInput
						style={styles.textInput}
						placeholder='Type your message...'
						placeholderTextColor={colors.light.mutedForeground}
						value={newMessage}
						onChangeText={setNewMessage}
						multiline
						maxLength={500}
					/>
					<TouchableOpacity
						style={[
							styles.sendButton,
							(!newMessage.trim() || sending) && styles.sendButtonDisabled,
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
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
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
		paddingTop: 60,
		paddingHorizontal: 16,
		paddingBottom: 16,
		backgroundColor: colors.light.card,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
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
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		backgroundColor: colors.light.background,
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		color: colors.light.foreground,
		maxHeight: 100,
		paddingVertical: 8,
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
