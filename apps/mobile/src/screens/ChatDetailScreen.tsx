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
	NativeScrollEvent,
	NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import { LoadingDots } from '../components/LoadingDots';
import { BookCover } from '../components/BookCover';
import VoiceRecorder from '../components/VoiceRecorder';
import ConversationalVoiceChat from '../components/ConversationalVoiceChat';
import { useAuth } from '../components/AuthProvider';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { captureRef, captureScreen } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	GestureHandlerRootView,
	PanGestureHandler,
	PanGestureHandlerGestureEvent,
	State,
} from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
	runOnJS,
} from 'react-native-reanimated';
import {
	getOrCreateChatSession,
	getChatMessages,
	sendMessageAndGetAIResponse,
} from '../services/chat';
import { getBookById } from '../services/books';
import { supabase } from '../lib/supabase';
import type { Book, ChatMessage } from '../types/supabase';
import { PremiumPaywallDrawer } from '../components/PremiumPaywallDrawer';

type RootStackParamList = {
	ChatDetail: { bookId: string };
};

type ChatDetailScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'ChatDetail'
>;
type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

// Helper function to format year as AD/BC
const formatYear = (year: number | string | null | undefined): string => {
	if (year === null || year === undefined || year === '') {
		return 'Unknown Year';
	}

	const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

	if (isNaN(yearNum)) {
		return 'Unknown Year';
	}

	// If year is less than 1000, format as AD/BC
	if (Math.abs(yearNum) < 1000) {
		if (yearNum >= 0) {
			return `${yearNum} AD`;
		} else {
			return `${Math.abs(yearNum)} BC`;
		}
	}

	// For years 1000 and above, return as is
	return yearNum.toString();
};

export default function ChatDetailScreen() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [book, setBook] = useState<Book | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
	const [showConversationalVoice, setShowConversationalVoice] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const { user } = useAuth();
	const route = useRoute<ChatDetailScreenRouteProp>();
	const navigation = useNavigation<ChatDetailScreenNavigationProp>();
	const flatListRef = useRef<FlatList<ChatMessage>>(null);
	const chatContainerRef = useRef<View>(null);
	const scrollY = useRef(0);
	const { bookId } = route.params;

	// Animation values for dropdown
	const dropdownOpacity = useSharedValue(0);
	const dropdownTranslateY = useSharedValue(-20);

	// MOCK: Replace with real premium check
	const isPremium = false; // TODO: Replace with real premium check from user/session/profile
	const [showPaywall, setShowPaywall] = useState(false);

	// Preload icons to prevent loading delay
	useEffect(() => {
		// Preload commonly used icons by rendering them off-screen
		const preloadIcons = async () => {
			// Force icon loading by creating temporary elements
			// This ensures the icon font is loaded and cached
			await new Promise(resolve => {
				// Small delay to ensure the component is mounted
				setTimeout(resolve, 50);
			});
		};
		preloadIcons();
	}, []);

	useEffect(() => {
		if (user?.id && bookId) {
			loadChatData();
		}
	}, [user?.id, bookId]);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (messages.length > 0 && flatListRef.current) {
			// Small delay to ensure the FlatList has rendered
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 200);
		}
	}, [messages.length]);

	// Animate dropdown in/out
	useEffect(() => {
		if (showDropdown) {
			// Fade in and slide down from top
			dropdownOpacity.value = withTiming(1, { duration: 300 });
			dropdownTranslateY.value = withTiming(0, { duration: 300 });
		}
	}, [showDropdown]);

	const loadChatData = async () => {
		try {
			setLoading(true);

			// Load book data
			const bookData = await getBookById(bookId);
			if (bookData) {
				setBook(bookData);
			} else {
				showAlert('Error', 'Book not found');
				navigation.goBack();
				return;
			}

			// Check if chat session already exists (don't create it)
			const { data: existingSession } = await supabase
				.from('chat_sessions')
				.select('*, books(title, cover_url)')
				.eq('user_id', user!.id)
				.eq('book_id', bookId)
				.single();

			if (existingSession) {
				setSessionId(existingSession.id);
				// Load messages only if session exists
				const chatMessages = await getChatMessages(existingSession.id);
				setMessages(chatMessages as ChatMessage[]);

				// Auto-scroll to bottom after loading messages
				setTimeout(() => {
					flatListRef.current?.scrollToEnd({ animated: true });
				}, 300);
			}
			// If no session exists, we'll create it when user sends first message
		} catch (error) {
			console.error('Error loading chat data:', error);
			showAlert('Error', 'Failed to load conversation');
		} finally {
			setLoading(false);
		}
	};

	const handleSendMessage = async () => {
		if (!newMessage.trim() || sending) return;

		const userMessage = newMessage.trim();
		setNewMessage('');
		setSending(true);

		try {
			// Create session if it doesn't exist
			let currentSessionId = sessionId;
			if (!currentSessionId) {
				const session = await getOrCreateChatSession(user!.id, bookId);
				currentSessionId = session.id;
				setSessionId(currentSessionId);
			}

			// Create temporary user message for immediate UI display
			const tempUserMessage: ChatMessage = {
				id: `temp-${Date.now()}`,
				content: userMessage,
				role: 'user',
				created_at: new Date().toISOString(),
				session_id: currentSessionId,
				metadata: {},
			};

			// Add user message to UI immediately
			setMessages(prev => [...prev, tempUserMessage]);

			// Send message and get AI response in one call
			const { userMessage: userMsg, aiMessage: aiMsg } =
				await sendMessageAndGetAIResponse(currentSessionId, userMessage);

			// Replace temp message with real user message and add AI response
			setMessages(prev => [
				...prev.slice(0, -1), // Remove temp message
				userMsg as ChatMessage,
				aiMsg as ChatMessage,
			]);

			// Auto-scroll to bottom after new messages
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 200);
		} catch (error) {
			console.error('Error sending message:', error);
			// Remove the temp message on error
			setMessages(prev => prev.slice(0, -1));
			showAlert('Error', 'Failed to send message');
		} finally {
			setSending(false);
		}
	};

	const handleSampleQuestionPress = async (question: string) => {
		if (sending) return;

		setSending(true);

		try {
			// Create session if it doesn't exist
			let currentSessionId = sessionId;
			if (!currentSessionId) {
				const session = await getOrCreateChatSession(user!.id, bookId);
				currentSessionId = session.id;
				setSessionId(currentSessionId);
			}

			// Create temporary user message for immediate UI display
			const tempUserMessage: ChatMessage = {
				id: `temp-${Date.now()}`,
				content: question,
				role: 'user',
				created_at: new Date().toISOString(),
				session_id: currentSessionId,
				metadata: {},
			};

			// Add user message to UI immediately
			setMessages(prev => [...prev, tempUserMessage]);

			// Send message and get AI response in one call
			const { userMessage: userMsg, aiMessage: aiMsg } =
				await sendMessageAndGetAIResponse(currentSessionId, question);

			// Replace temp message with real user message and add AI response
			setMessages(prev => [
				...prev.slice(0, -1), // Remove temp message
				userMsg as ChatMessage,
				aiMsg as ChatMessage,
			]);

			// Auto-scroll to bottom after new messages
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 200);
		} catch (error) {
			console.error('Error sending sample question:', error);
			// Remove the temp message on error
			setMessages(prev => prev.slice(0, -1));
			showAlert('Error', 'Failed to send message');
		} finally {
			setSending(false);
		}
	};

	const handleVoiceTranscriptionComplete = async (transcribedText: string) => {
		setShowVoiceRecorder(false);

		// Set the transcribed text as the new message
		setNewMessage(transcribedText);

		// Automatically send the message
		if (transcribedText.trim()) {
			const userMessage = transcribedText.trim();
			setNewMessage('');
			setSending(true);

			try {
				// Create session if it doesn't exist
				let currentSessionId = sessionId;
				if (!currentSessionId) {
					const session = await getOrCreateChatSession(user!.id, bookId);
					currentSessionId = session.id;
					setSessionId(currentSessionId);
				}

				// Create temporary user message for immediate UI display
				const tempUserMessage: ChatMessage = {
					id: `temp-${Date.now()}`,
					content: userMessage,
					role: 'user',
					created_at: new Date().toISOString(),
					session_id: currentSessionId,
					metadata: {},
				};

				// Add user message to UI immediately
				setMessages(prev => [...prev, tempUserMessage]);

				// Send message and get AI response in one call
				const { userMessage: userMsg, aiMessage: aiMsg } =
					await sendMessageAndGetAIResponse(currentSessionId, userMessage);

				// Replace temp message with real user message and add AI response
				setMessages(prev => [
					...prev.slice(0, -1), // Remove temp message
					userMsg as ChatMessage,
					aiMsg as ChatMessage,
				]);

				// Auto-scroll to bottom after new messages
				setTimeout(() => {
					flatListRef.current?.scrollToEnd({ animated: true });
				}, 200);
			} catch (error) {
				console.error('Error sending voice message:', error);
				// Remove the temp message on error
				setMessages(prev => prev.slice(0, -1));
				showAlert('Error', 'Failed to send voice message');
			} finally {
				setSending(false);
			}
		}
	};

	const handleVoiceRecorderCancel = () => {
		setShowVoiceRecorder(false);
	};

	const handleConversationalVoiceComplete = async (conversation: any[]) => {
		setShowConversationalVoice(false);

		if (conversation.length === 0) return;

		try {
			setSending(true);

			// Create session if it doesn't exist
			let currentSessionId = sessionId;
			if (!currentSessionId) {
				const session = await getOrCreateChatSession(user!.id, bookId);
				currentSessionId = session.id;
				setSessionId(currentSessionId);
			}

			// Add each conversation message to the chat
			for (const msg of conversation) {
				if (msg.role === 'user' || msg.role === 'assistant') {
					// Create temporary message for immediate UI display
					const tempMessage: ChatMessage = {
						id: `temp-${Date.now()}-${Math.random()}`,
						content: msg.content,
						role: msg.role,
						created_at: new Date().toISOString(),
						session_id: currentSessionId,
						metadata: {},
					};

					// Add message to UI immediately
					setMessages(prev => [...prev, tempMessage]);

					// Save to database
					const { data, error } = await supabase
						.from('chat_messages')
						.insert({
							session_id: currentSessionId,
							content: msg.content,
							role: msg.role,
							metadata: {},
						})
						.select()
						.single();

					if (data && !error) {
						// Replace temp message with real message
						setMessages(prev =>
							prev.map(m =>
								m.id === tempMessage.id
									? ({ ...data, id: data.id } as ChatMessage)
									: m
							)
						);
					}
				}
			}

			// Auto-scroll to bottom after new messages
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 200);
		} catch (error) {
			console.error('Error saving conversation:', error);
			showAlert('Error', 'Failed to save voice conversation');
		} finally {
			setSending(false);
		}
	};

	const handleConversationalVoiceCancel = () => {
		setShowConversationalVoice(false);
	};

	const closeDropdown = () => {
		// Start exit animation first
		dropdownOpacity.value = withTiming(0, { duration: 200 });
		dropdownTranslateY.value = withTiming(-20, { duration: 200 }, () => {
			// Hide dropdown after animation completes
			runOnJS(setShowDropdown)(false);
		});
	};

	const handleShareChat = async () => {
		closeDropdown();

		try {
			// Check if sharing is available
			if (!(await Sharing.isAvailableAsync())) {
				showAlert('Error', 'Sharing is not available on this device');
				return;
			}

			// Add a small delay to ensure all content is rendered
			await new Promise(resolve => setTimeout(resolve, 300));

			// Capture screenshot of the entire screen
			const uri = await captureScreen({
				format: 'png',
				quality: 1.0,
				result: 'tmpfile',
			});

			// Debug: Log the captured URI
			console.log('Captured screenshot URI:', uri);

			// Share the screenshot using Expo's sharing API
			await Sharing.shareAsync(uri, {
				mimeType: 'image/png',
				dialogTitle: `Share conversation about "${book?.title}"`,
			});
		} catch (error) {
			console.error('Error sharing chat:', error);
			showAlert('Error', 'Failed to share chat. Please try again.');
		}
	};

	const handleClearChat = () => {
		closeDropdown();
		Alert.alert(
			'Reset Chat',
			'Are you sure you want to reset this conversation? This will delete all messages and start fresh. This action cannot be undone.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Reset',
					style: 'destructive',
					onPress: async () => {
						try {
							if (sessionId) {
								// First, delete all messages for this session
								const { error: messagesError } = await supabase
									.from('messages')
									.delete()
									.eq('session_id', sessionId);

								if (messagesError) throw messagesError;

								// Then, delete the chat session itself
								const { error: sessionError } = await supabase
									.from('chat_sessions')
									.delete()
									.eq('id', sessionId);

								if (sessionError) throw sessionError;

								// Reset local state
								setMessages([]);
								setSessionId(null);
							} else {
								// If no session exists, just clear any local messages
								setMessages([]);
							}
						} catch (error) {
							console.error('Error resetting chat:', error);
							showAlert('Error', 'Failed to reset chat. Please try again.');
						}
					},
				},
			]
		);
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
						<LoadingDots color={colors.light.foreground} size={8} />
					</View>
				</View>
			</View>
		);
	};

	const renderSampleQuestions = () => {
		// Only show sample questions when there are no messages
		if (messages.length > 0) return null;

		return (
			<View style={styles.sampleQuestionsContainer}>
				{[
					'What are the main themes in this book?',
					'Tell me about the main character',
					'What is the historical context of this story?',
					'What lesson can I learn from this book?',
				].map((question, index) => (
					<TouchableOpacity
						key={index}
						style={styles.sampleQuestionBubble}
						onPress={() => handleSampleQuestionPress(question)}
						activeOpacity={0.7}
						disabled={sending}
					>
						<Text style={styles.sampleQuestionText}>{question}</Text>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const currentScrollY = event.nativeEvent.contentOffset.y;
		const scrollDelta = currentScrollY - scrollY.current;

		// Only dismiss keyboard on significant downward scroll (scrolling up through messages)
		// This mimics iOS Messages behavior where scrolling down dismisses keyboard
		if (scrollDelta < -20) {
			// Scrolling down by at least 20 points
			Keyboard.dismiss();
		}

		scrollY.current = currentScrollY;
	};

	// Animated styles for dropdown
	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: dropdownOpacity.value,
	}));

	const animatedDropdownStyle = useAnimatedStyle(() => ({
		opacity: dropdownOpacity.value,
		transform: [{ translateY: dropdownTranslateY.value }],
	}));

	// Hidden icon preloader to ensure icons are loaded
	const IconPreloader = () => (
		<View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
			<Ionicons name='send' size={20} color={colors.light.primaryForeground} />
			<Ionicons name='mic' size={20} color={colors.light.primary} />
			<Ionicons name='chevron-back' size={24} color={colors.light.foreground} />
			<Ionicons
				name='ellipsis-vertical'
				size={20}
				color={colors.light.foreground}
			/>
			<Ionicons
				name='share-social-outline'
				size={20}
				color={colors.light.foreground}
			/>
			<Ionicons
				name='reload-circle-outline'
				size={20}
				color={colors.light.foreground}
			/>
			<Ionicons
				name='chatbubbles-outline'
				size={48}
				color={colors.light.mutedForeground}
			/>
		</View>
	);

	const handleVoiceFeaturePress = () => {
		if (!isPremium) {
			setShowPaywall(true);
			return;
		}
		setShowConversationalVoice(true);
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
			<IconPreloader />
			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.container}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
				>
					<View ref={chatContainerRef} style={styles.chatCaptureContainer}>
						{/* Header */}
						<View style={styles.header}>
							<TouchableOpacity
								style={styles.backButton}
								onPress={() => navigation.goBack()}
							>
								<Ionicons
									name='chevron-back'
									size={24}
									color={colors.light.accentForeground}
								/>
							</TouchableOpacity>

							<View style={styles.bookInfo}>
								<BookCover
									uri={book?.cover_url}
									style={styles.bookCover}
									placeholderIcon='book-outline'
									placeholderSize={20}
								/>
								<View style={styles.bookDetails}>
									<Text style={styles.bookTitle} numberOfLines={2}>
										{book?.title || 'Unknown Book'}
									</Text>
									<Text style={styles.bookAuthor} numberOfLines={2}>
										{book?.author || 'Unknown Author'} •{' '}
										{formatYear(book?.year)}
									</Text>
								</View>
								<TouchableOpacity
									style={styles.menuButton}
									onPress={() => setShowDropdown(true)}
								>
									<Ionicons
										name='ellipsis-vertical'
										size={28}
										color={colors.light.accentForeground}
									/>
								</TouchableOpacity>
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
								keyboardShouldPersistTaps='always'
								onScroll={handleScroll}
								scrollEventThrottle={16}
								onContentSizeChange={() =>
									flatListRef.current?.scrollToEnd({ animated: true })
								}
								onLayout={() => {
									// Scroll to bottom when FlatList is first laid out
									if (messages.length > 0) {
										setTimeout(() => {
											flatListRef.current?.scrollToEnd({ animated: true });
										}, 100);
									}
								}}
								ListEmptyComponent={
									<View style={styles.emptyContainer}>
										<Ionicons
											name='chatbubbles-outline'
											size={48}
											color={colors.light.mutedForeground}
										/>
										<Text style={styles.emptyTitle}>
											Start the conversation!
										</Text>
										<Text style={styles.emptySubtitle}>
											Ask questions about this book, discuss themes, or explore
											its meaning
										</Text>
									</View>
								}
								ListFooterComponent={() => (
									<>
										{renderSampleQuestions()}
										{renderTypingIndicator()}
									</>
								)}
								keyboardDismissMode={
									Platform.OS === 'ios' ? 'interactive' : 'on-drag'
								}
							/>
						</View>

						{/* Input with Gesture Handler */}
						<PanGestureHandler
							onGestureEvent={event => {
								if (
									Platform.OS === 'android' &&
									event.nativeEvent.translationY > 50 &&
									event.nativeEvent.state === State.ACTIVE
								) {
									Keyboard.dismiss();
								}
							}}
						>
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
									<TouchableOpacity
										style={styles.micButton}
										// onPress={handleVoiceFeaturePress}
										onPress={() => setShowConversationalVoice(true)}
										disabled={sending}
									>
										<Ionicons
											name='mic'
											size={20}
											color={
												sending
													? colors.light.mutedForeground
													: colors.light.muted
											}
										/>
									</TouchableOpacity>
								</View>
							</View>
						</PanGestureHandler>
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>

			{/* Voice Recorder Modal */}
			<VoiceRecorder
				visible={showVoiceRecorder}
				onTranscriptionComplete={handleVoiceTranscriptionComplete}
				onCancel={handleVoiceRecorderCancel}
				bookTitle={book?.title}
				bookAuthor={book?.author}
				bookId={bookId}
			/>

			{/* Conversational Voice Chat Modal */}
			<ConversationalVoiceChat
				visible={showConversationalVoice}
				onConversationComplete={handleConversationalVoiceComplete}
				onClose={handleConversationalVoiceCancel}
				bookTitle={book?.title}
				bookAuthor={book?.author}
				bookId={bookId}
			/>

			{/* Dropdown Menu Modal */}
			{showDropdown && (
				<Animated.View style={[styles.dropdownOverlay, animatedOverlayStyle]}>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						activeOpacity={1}
						onPress={closeDropdown}
					/>
					<Animated.View
						style={[styles.dropdownContainer, animatedDropdownStyle]}
					>
						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={handleShareChat}
							activeOpacity={0.7}
						>
							<Ionicons
								name='share-social-outline'
								size={20}
								color={colors.light.foreground}
								style={styles.dropdownIcon}
							/>
							<Text style={styles.dropdownText}>Share</Text>
						</TouchableOpacity>

						<View style={styles.dropdownSeparator} />

						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={handleClearChat}
							activeOpacity={0.7}
						>
							<Ionicons
								name='reload-circle-outline'
								size={20}
								color={colors.light.foreground}
								style={styles.dropdownIcon}
							/>
							<Text style={styles.dropdownText}>Reset Chat</Text>
						</TouchableOpacity>
					</Animated.View>
				</Animated.View>
			)}

			{/* ** TODO: Add premium paywall drawer ***/}
			{/* <PremiumPaywallDrawer
				visible={showPaywall}
				onClose={() => setShowPaywall(false)}
				onPurchase={plan => {
					// TODO: Integrate real purchase logic
					setShowPaywall(false);
					// Optionally set isPremium to true after purchase
				}}
				onRestore={() => {
					// TODO: Integrate restore purchase logic
					setShowPaywall(false);
				}}
				onPrivacyPolicy={() => {
					// TODO: Show privacy policy
				}}
			/> */}
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	chatContainer: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	chatCaptureContainer: {
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
		flexWrap: 'wrap',
		paddingTop: Platform.OS === 'ios' ? 12 : 20,
		paddingHorizontal: 16,
		paddingBottom: 16,
		backgroundColor: colors.light.cardForeground,
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
		alignItems: 'flex-start',
		height: 100,
		flex: 1,
	},
	bookCover: {
		width: 75,
		height: '100%',
		borderRadius: 2,
		overflow: 'hidden',
		marginRight: 12,
		objectFit: 'fill',
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
		height: '100%',
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'flex-start',
		marginRight: 12,
	},
	bookTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.light.accentForeground,
		marginBottom: 6,
	},
	bookAuthor: {
		fontSize: 14,
		color: colors.light.accent,
		fontStyle: 'italic',
	},
	messagesList: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20,
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
		justifyContent: 'center',
		paddingVertical: 4,
	},
	emptyContainer: {
		alignItems: 'center',
		paddingVertical: 60,
		paddingHorizontal: 20,
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
		marginBottom: 24,
	},
	sampleQuestionsContainer: {
		width: '100%',
		alignItems: 'flex-start',
		gap: 12,
		paddingBottom: 20,
	},
	sampleQuestionBubble: {
		alignSelf: 'flex-start',
		maxWidth: '80%',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
		borderBottomLeftRadius: 4,
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	sampleQuestionText: {
		fontSize: 12,
		lineHeight: 22,
		color: colors.light.mutedForeground,
	},
	inputContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: Platform.OS === 'ios' ? 20 : 16,
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
	micButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.light.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 8,
	},
	menuButton: {
		padding: 8,
		alignItems: 'center',
		justifyContent: 'center',
		display: 'flex',
		flexDirection: 'column',
		alignSelf: 'center',
	},
	dropdownOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.25)',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		paddingTop: Platform.OS === 'ios' ? 100 : 80,
		paddingRight: 16,
	},
	dropdownContainer: {
		backgroundColor: colors.light.card,
		borderRadius: 12,
		minWidth: 160,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		borderWidth: 1,
		borderColor: colors.light.border,
		marginTop: 45,
		marginRight: 16,
	},
	dropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	dropdownIcon: {
		marginRight: 12,
	},
	dropdownText: {
		fontSize: 16,
		color: colors.light.foreground,
		fontWeight: '500',
	},
	dropdownSeparator: {
		height: 1,
		backgroundColor: colors.light.border,
		marginHorizontal: 16,
	},
	destructiveItem: {
		// No additional styling needed, handled by text color
	},
	destructiveText: {
		color: colors.light.destructive,
	},
});
