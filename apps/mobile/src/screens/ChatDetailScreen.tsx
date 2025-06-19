import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	TouchableOpacity,
	Image,
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useAuth } from '../components/AuthProvider';
import {
	getChatMessages,
	sendMessage,
	getOrCreateChatSession,
} from '../services/chat';
import { getBookById } from '../services/books';
import {
	getChatMessages as getChatMessagesAPI,
	sendChatMessage,
} from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Database } from '../lib/supabase';

type Message = Database['public']['Tables']['messages']['Row'];
type Book = Database['public']['Tables']['books']['Row'] & {
	author?: { name: string };
};

interface RouteParams {
	sessionId?: string;
	bookId: string;
}

export default function ChatDetailScreen() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [book, setBook] = useState<Book | null>(null);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const { user } = useAuth();
	const route = useRoute();
	const navigation = useNavigation();
	const flatListRef = useRef<FlatList>(null);

	const { sessionId: routeSessionId, bookId } = route.params as RouteParams;

	useEffect(() => {
		if (user?.id && bookId) {
			loadData();
		}
	}, [user?.id, bookId]);

	const loadData = async () => {
		try {
			setLoading(true);

			// Load book information
			const bookData = await getBookById(bookId);
			setBook(bookData);

			// Get or create chat session
			const session = await getOrCreateChatSession(user!.id, bookId);
			setSessionId(session.id);

			// Load messages using the API
			const messagesData = await getChatMessagesAPI(bookId);
			setMessages(messagesData);
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

		// Add user message immediately
		const tempUserMessage: Message = {
			id: `temp-${Date.now()}`,
			session_id: sessionId,
			content: userMessage,
			role: 'user',
			created_at: new Date().toISOString(),
			metadata: {},
		};

		setMessages(prev => [...prev, tempUserMessage]);

		try {
			// Send message using the API (this will handle both user and AI messages)
			const response = await sendChatMessage(bookId, userMessage);

			// Replace temporary message with real messages from API
			setMessages(prev => [
				...prev.filter(msg => !msg.id.startsWith('temp-')),
				...response,
			]);
		} catch (error) {
			console.error('Error sending message:', error);
			Alert.alert('Error', 'Failed to send message');
			// Remove temporary message on error
			setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
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
				<Text style={styles.messageTime}>
					{new Date(item.created_at).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</Text>
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
			/>

			{/* Typing indicator */}
			{sending && (
				<View style={styles.typingContainer}>
					<View style={styles.typingBubble}>
						<Text style={styles.typingText}>AI is typing...</Text>
					</View>
				</View>
			)}

			{/* Input */}
			<View style={styles.inputContainer}>
				<TextInput
					style={styles.input}
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
		padding: 16,
		paddingTop: 60,
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
		height: 52,
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
		padding: 16,
		paddingBottom: 8,
	},
	messageContainer: {
		marginBottom: 16,
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
	messageTime: {
		fontSize: 12,
		color: colors.light.mutedForeground,
		marginTop: 4,
		marginHorizontal: 8,
	},
	typingContainer: {
		paddingHorizontal: 16,
		marginBottom: 8,
	},
	typingBubble: {
		backgroundColor: colors.light.card,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: colors.light.border,
		alignSelf: 'flex-start',
	},
	typingText: {
		fontSize: 14,
		color: colors.light.mutedForeground,
		fontStyle: 'italic',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		padding: 16,
		backgroundColor: colors.light.card,
		borderTopWidth: 1,
		borderTopColor: colors.light.border,
	},
	input: {
		flex: 1,
		backgroundColor: colors.light.background,
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginRight: 12,
		fontSize: 16,
		color: colors.light.foreground,
		maxHeight: 100,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	sendButton: {
		backgroundColor: colors.light.primary,
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sendButtonDisabled: {
		backgroundColor: colors.light.muted,
	},
});
