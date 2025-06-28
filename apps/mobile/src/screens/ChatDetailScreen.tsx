import React, { useState, useEffect, useRef, useCallback } from 'react';
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
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { showAlert } from '../utils/alert';
import { LoadingDots } from '../components/LoadingDots';
import { BookCover } from '../components/BookCover';
import VoiceRecorder from '../components/VoiceRecorder';
import ConversationalVoiceChat from '../components/ConversationalVoiceChat';
import { useAuth } from '../components/AuthProvider';
import { ChatErrorBoundary } from '../components/ErrorBoundary';
import {
	validateChatMessage,
	validateVoiceTranscription,
} from '../utils/validation';
import {
	useRoute,
	useNavigation,
	RouteProp,
	useFocusEffect,
} from '@react-navigation/native';
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
	interpolate,
	Extrapolate,
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
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { canSendMessage, upgradeToPremium } from '../services/subscription';
import { useToast } from '../components/ui/toast';
import { checkRateLimit } from '../utils/rateLimit';

type RootStackParamList = {
	ChatDetail: { bookId: string };
};

type ChatDetailScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'ChatDetail'
>;
type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

const { width } = Dimensions.get('window');

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
	const { theme, isDark } = useTheme();
	const { toast } = useToast();
	const currentColors = colors[theme];
	const route = useRoute<ChatDetailScreenRouteProp>();
	const navigation = useNavigation<ChatDetailScreenNavigationProp>();
	const flatListRef = useRef<FlatList<ChatMessage>>(null);
	const chatContainerRef = useRef<View>(null);
	const textInputRef = useRef<TextInput>(null);
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

	// Handle navigation events to prevent stacking issues
	useFocusEffect(
		React.useCallback(() => {
			// Reset any modal states when screen gains focus
			setShowVoiceRecorder(false);
			setShowConversationalVoice(false);
			setShowDropdown(false);
			setShowPaywall(false);

			// Clear any temporary UI states
			setSending(false);

			// Ensure keyboard is dismissed
			Keyboard.dismiss();

			return () => {
				// Cleanup when screen loses focus
				setShowVoiceRecorder(false);
				setShowConversationalVoice(false);
				setShowDropdown(false);
				setShowPaywall(false);
				setSending(false);
				Keyboard.dismiss();
			};
		}, [])
	);

	// Add navigation listener to handle back navigation properly
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', e => {
			// Allow normal back navigation but clean up any open modals
			setShowVoiceRecorder(false);
			setShowConversationalVoice(false);
			setShowDropdown(false);
			setShowPaywall(false);
			setSending(false);
			Keyboard.dismiss();
		});

		return unsubscribe;
	}, [navigation]);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (messages.length > 0 && flatListRef.current) {
			// Use a more performant scroll approach
			requestAnimationFrame(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			});
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

				// Auto-scroll to bottom after loading messages - use requestAnimationFrame for better performance
				if (chatMessages.length > 0) {
					requestAnimationFrame(() => {
						setTimeout(() => {
							flatListRef.current?.scrollToEnd({ animated: false }); // Use non-animated scroll on initial load
						}, 100);
					});
				}
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
		if (!user?.id || !bookId || !newMessage.trim() || sending) return;

		try {
			// Validate message using Zod
			const userMessage = newMessage.trim();
			try {
				validateChatMessage(userMessage, bookId);
			} catch (error) {
				toast({
					title: 'Invalid Message',
					description: error.message || 'Invalid message',
					variant: 'destructive',
				});
				return;
			}

			// Check rate limit
			try {
				await checkRateLimit({ key: user.id, window: 60, max: 10 });
			} catch (error) {
				toast({
					title: 'Rate Limit Exceeded',
					description:
						'You are sending messages too quickly. Please wait a minute.',
					variant: 'destructive',
				});
				return;
			}

			// Clear input immediately and focus management
			setNewMessage('');
			textInputRef.current?.clear();
			setSending(true);

			try {
				// Check message limit before sending
				const messageLimit = await canSendMessage(user!.id);
				if (!messageLimit.canSend) {
					if (messageLimit.plan === 'free') {
						// Show paywall for free users who reached their limit
						setShowPaywall(true);
						return;
					} else {
						throw new Error('Unable to send message. Please try again.');
					}
				}

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
			} catch (error) {
				console.error('Error sending message:', error);
				// Remove the temp message on error and restore input
				setMessages(prev => prev.slice(0, -1));
				setNewMessage(userMessage); // Restore the message if there was an error

				// Check if it's a message limit error
				if (error.message?.includes('daily message limit')) {
					setShowPaywall(true);
				} else {
					toast({
						title: 'Error',
						description: 'Failed to send message',
						variant: 'destructive',
					});
				}
			} finally {
				setSending(false);
			}
		} catch (error) {
			console.error('Error sending message:', error);
			if (error.message?.includes('message limit')) {
				setShowPaywall(true);
			} else {
				toast({
					title: 'Error',
					description: 'Failed to send message',
					variant: 'destructive',
				});
			}
		}
	};

	const handleSampleQuestionPress = async (question: string) => {
		if (sending) return;

		// Validate question using Zod
		try {
			validateChatMessage(question, bookId);
		} catch (error) {
			Alert.alert('Validation Error', error.message);
			return;
		}

		setSending(true);

		try {
			// Check message limit before sending
			const messageLimit = await canSendMessage(user!.id);
			if (!messageLimit.canSend) {
				if (messageLimit.plan === 'free') {
					// Show paywall for free users who reached their limit
					setShowPaywall(true);
					return;
				} else {
					throw new Error('Unable to send message. Please try again.');
				}
			}

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
		} catch (error) {
			console.error('Error sending sample question:', error);
			// Remove the temp message on error
			setMessages(prev => prev.slice(0, -1));

			// Check if it's a message limit error
			if (error.message?.includes('daily message limit')) {
				setShowPaywall(true);
			} else {
				showAlert('Error', 'Failed to send message');
			}
		} finally {
			setSending(false);
		}
	};

	const handleVoiceTranscriptionComplete = async (transcribedText: string) => {
		setShowVoiceRecorder(false);

		// Validate transcription using Zod
		try {
			validateVoiceTranscription(transcribedText);
		} catch (error) {
			Alert.alert('Validation Error', error.message);
			return;
		}

		// Set the transcribed text as the new message
		setNewMessage(transcribedText);

		// Automatically send the message
		if (transcribedText.trim()) {
			const userMessage = transcribedText.trim();
			setNewMessage('');
			setSending(true);

			try {
				// Check message limit before sending
				const messageLimit = await canSendMessage(user!.id);
				if (!messageLimit.canSend) {
					if (messageLimit.plan === 'free') {
						// Show paywall for free users who reached their limit
						setShowPaywall(true);
						return;
					} else {
						throw new Error('Unable to send message. Please try again.');
					}
				}

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
			} catch (error) {
				console.error('Error sending transcribed message:', error);
				// Remove the temp message on error
				setMessages(prev => prev.slice(0, -1));

				// Check if it's a message limit error
				if (error.message?.includes('daily message limit')) {
					setShowPaywall(true);
				} else {
					showAlert('Error', 'Failed to send message');
				}
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

	const renderMessage = React.useCallback(
		({ item, index }: { item: ChatMessage; index: number }) => {
			const isUser = item.role === 'user';
			const showTimestamp =
				index === 0 ||
				(index > 0 &&
					new Date(item.created_at).getTime() -
						new Date(messages[index - 1].created_at).getTime() >
						300000); // 5 minutes

			return (
				<View style={styles.messageContainer}>
					{showTimestamp && (
						<Text
							style={[
								styles.timestamp,
								{ color: currentColors.mutedForeground },
							]}
						>
							{formatDistanceToNow(new Date(item.created_at), {
								addSuffix: true,
							})}
						</Text>
					)}
					<View
						style={[
							styles.messageBubbleContainer,
							isUser ? styles.userMessageContainer : styles.aiMessageContainer,
						]}
					>
						{!isUser && (
							<View
								style={[
									styles.avatarContainer,
									{ backgroundColor: currentColors.primary + '15' },
								]}
							>
								<Ionicons
									name="library-outline"
									size={16}
									color={currentColors.primary}
								/>
							</View>
						)}
						<View
							style={[
								styles.messageBubble,
								isUser
									? [
											styles.userBubble,
											{ backgroundColor: currentColors.primary },
										]
									: [
											styles.aiBubble,
											{
												backgroundColor: currentColors.card,
												borderColor: currentColors.border,
											},
										],
							]}
						>
							<Text
								style={[
									styles.messageText,
									isUser
										? [
												styles.userText,
												{ color: currentColors.primaryForeground },
											]
										: [styles.aiText, { color: currentColors.foreground }],
								]}
							>
								{item.content}
							</Text>
						</View>
					</View>
				</View>
			);
		},
		[messages, currentColors]
	);

	const renderTypingIndicator = React.useCallback(() => {
		if (!sending) return null;

		return (
			<View style={[styles.messageContainer, styles.aiMessageContainer]}>
				<View
					style={[
						styles.messageBubble,
						styles.aiBubble,
						{
							backgroundColor: currentColors.card,
							borderColor: currentColors.border,
						},
					]}
				>
					<View style={styles.typingIndicator}>
						<LoadingDots color={currentColors.foreground} size={8} />
					</View>
				</View>
			</View>
		);
	}, [sending, currentColors]);

	const renderSampleQuestions = React.useCallback(() => {
		if (messages.length > 0) return null;
		const sampleQuestions = [
			{ text: 'What are the main themes in this book?', icon: 'bulb-outline' },
			{ text: 'Tell me about the main character', icon: 'person-outline' },
			{ text: 'What is the historical context?', icon: 'time-outline' },
			{ text: 'What lesson can I learn from this?', icon: 'school-outline' },
		];
		return (
			<View style={styles.sampleQuestionsContainer}>
				<Text
					style={[
						styles.sampleQuestionsTitle,
						{ color: currentColors.foreground },
					]}
				>
					💭 Try asking about...
				</Text>
				<View style={styles.sampleQuestionsGrid}>
					{sampleQuestions.map((question, index) => (
						<TouchableOpacity
							key={index}
							style={[
								styles.sampleQuestionCard,
								{
									backgroundColor: currentColors.card,
									borderColor: currentColors.border,
								},
							]}
							onPress={() => handleSampleQuestionPress(question.text)}
							activeOpacity={0.7}
							disabled={sending}
						>
							<View
								style={[
									styles.sampleQuestionIcon,
									{ backgroundColor: currentColors.primary + '15' },
								]}
							>
								<Ionicons
									name={question.icon as any}
									size={16}
									color={currentColors.primary}
								/>
							</View>
							<Text
								style={[
									styles.sampleQuestionText,
									{ color: currentColors.foreground },
								]}
							>
								{question.text}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>
		);
	}, [messages.length, sending, handleSampleQuestionPress, currentColors]);

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
			<Ionicons name="send" size={20} color={colors.light.primaryForeground} />
			<Ionicons name="mic" size={20} color={colors.light.primary} />
			<Ionicons name="chevron-back" size={24} color={colors.light.foreground} />
			<Ionicons
				name="ellipsis-vertical"
				size={20}
				color={colors.light.foreground}
			/>
			<Ionicons
				name="share-social-outline"
				size={20}
				color={colors.light.foreground}
			/>
			<Ionicons
				name="reload-circle-outline"
				size={20}
				color={colors.light.foreground}
			/>
			<Ionicons
				name="chatbubbles-outline"
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

	// Add paywall handlers
	const handlePremiumPurchase = async (
		plan: 'weekly' | 'monthly' | 'yearly'
	) => {
		try {
			await upgradeToPremium(user!.id, plan === 'weekly' ? 'monthly' : plan);
			setShowPaywall(false);
			showAlert(
				'Success',
				'Premium features activated! You now have unlimited messages.'
			);
		} catch (error) {
			console.error('Error upgrading to premium:', error);
			showAlert('Error', 'Failed to upgrade. Please try again.');
		}
	};

	const handlePremiumRestore = () => {
		// TODO: Implement restore purchase logic
		setShowPaywall(false);
		showAlert('Success', 'Premium features restored!');
	};

	const handlePrivacyPolicy = () => {
		// TODO: Navigate to privacy policy or open web view
		showAlert('Privacy Policy', 'Privacy policy would open here');
	};

	if (loading) {
		return (
			<SafeAreaView
				style={[
					styles.loadingContainer,
					{ backgroundColor: currentColors.background },
				]}
			>
				<ActivityIndicator size="large" color={currentColors.primary} />
			</SafeAreaView>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					keyboardVerticalOffset={0}
				>
					<IconPreloader />
					<View
						style={[
							styles.chatContainer,
							{ backgroundColor: currentColors.background },
						]}
					>
						<View
							style={[
								styles.chatCaptureContainer,
								{ backgroundColor: currentColors.background },
							]}
						>
							<LinearGradient
								colors={
									isDark
										? [currentColors.card, currentColors.card]
										: [currentColors.card, currentColors.background]
								}
								style={[
									styles.header,
									{ borderBottomColor: currentColors.border },
								]}
							>
								<TouchableOpacity
									style={styles.backButton}
									onPress={() => {
										// Ensure clean navigation back
										Keyboard.dismiss();
										setShowDropdown(false);
										setShowVoiceRecorder(false);
										setShowConversationalVoice(false);
										setShowPaywall(false);

										// Use a more explicit navigation method
										if (navigation.canGoBack()) {
											navigation.goBack();
										} else {
											// Fallback to navigate to home if can't go back
											navigation.navigate('Home' as any);
										}
									}}
								>
									<Ionicons
										name="chevron-back"
										size={24}
										color={currentColors.foreground}
									/>
								</TouchableOpacity>

								<View style={styles.bookInfo}>
									<BookCover
										uri={book?.cover_url}
										style={styles.bookCover}
										placeholderIcon="book-outline"
										placeholderSize={20}
									/>
									<View style={styles.bookDetails}>
										<Text
											style={[
												styles.bookTitle,
												{ color: currentColors.foreground },
											]}
											numberOfLines={2}
										>
											{book?.title || 'Unknown Book'}
										</Text>
										<Text
											style={[
												styles.bookAuthor,
												{ color: currentColors.mutedForeground },
											]}
											numberOfLines={2}
										>
											{book?.author || 'Unknown Author'} •{' '}
											{formatYear(book?.year)}
										</Text>
									</View>
									<TouchableOpacity
										style={styles.menuButton}
										onPress={() => setShowDropdown(true)}
									>
										<Ionicons
											name="ellipsis-vertical"
											size={28}
											color={currentColors.foreground}
										/>
									</TouchableOpacity>
								</View>
							</LinearGradient>

							<View
								style={[
									styles.contentContainer,
									{ backgroundColor: currentColors.background },
								]}
							>
								<ChatErrorBoundary>
									<View
										style={[
											styles.messagesContainer,
											{ backgroundColor: currentColors.background },
										]}
									>
										{messages.length === 0 ? (
											<ScrollView
												style={styles.emptyStateScrollView}
												contentContainerStyle={styles.emptyStateScrollContent}
												showsVerticalScrollIndicator={false}
												keyboardShouldPersistTaps="always"
												keyboardDismissMode={
													Platform.OS === 'ios' ? 'interactive' : 'on-drag'
												}
											>
												<View style={styles.emptyContainer}>
													<View
														style={[
															styles.emptyIconContainer,
															{ backgroundColor: currentColors.primary + '15' },
														]}
													>
														<Ionicons
															name="chatbubbles-outline"
															size={48}
															color={currentColors.primary}
														/>
													</View>
													<Text
														style={[
															styles.emptyTitle,
															{ color: currentColors.foreground },
														]}
													>
														Start the conversation!
													</Text>
													<Text
														style={[
															styles.emptySubtitle,
															{ color: currentColors.mutedForeground },
														]}
													>
														Ask questions about this book, discuss themes, or
														explore its meaning
													</Text>
												</View>
												{renderSampleQuestions()}
												<View style={{ height: 100 }} />
											</ScrollView>
										) : (
											<FlatList
												ref={flatListRef}
												data={messages}
												renderItem={renderMessage}
												keyExtractor={item => item.id}
												contentContainerStyle={styles.messagesList}
												showsVerticalScrollIndicator={false}
												keyboardShouldPersistTaps="always"
												onScroll={handleScroll}
												scrollEventThrottle={32}
												removeClippedSubviews={true}
												maxToRenderPerBatch={10}
												windowSize={10}
												initialNumToRender={15}
												getItemLayout={null}
												maintainVisibleContentPosition={{
													minIndexForVisible: 0,
													autoscrollToTopThreshold: 10,
												}}
												ListFooterComponent={() => (
													<>
														{renderTypingIndicator()}
														{renderSampleQuestions()}
														<View style={{ height: 20 }} />
													</>
												)}
												keyboardDismissMode={
													Platform.OS === 'ios' ? 'interactive' : 'on-drag'
												}
											/>
										)}
									</View>

									{/* Input container moved inside the main layout */}
									<View
										style={[
											styles.inputContainer,
											{ borderTopColor: currentColors.border },
										]}
									>
										<View
											style={[
												styles.inputWrapper,
												{
													backgroundColor: currentColors.card,
													borderColor: currentColors.border,
												},
											]}
										>
											<TextInput
												ref={textInputRef}
												style={[
													styles.textInput,
													{ color: currentColors.foreground },
												]}
												placeholder="Type a message..."
												placeholderTextColor={currentColors.mutedForeground}
												value={newMessage}
												onChangeText={setNewMessage}
												multiline
												maxLength={500}
												onSubmitEditing={Keyboard.dismiss}
											/>
											<TouchableOpacity
												style={styles.sendButton}
												onPress={handleSendMessage}
												disabled={!newMessage.trim() || sending}
											>
												<Ionicons
													name="send"
													size={20}
													color={currentColors.primary}
												/>
											</TouchableOpacity>
											<TouchableOpacity
												style={styles.micButton}
												onPress={handleVoiceFeaturePress}
											>
												<Ionicons
													name="mic"
													size={20}
													color={currentColors.primary}
												/>
											</TouchableOpacity>
										</View>
									</View>
								</ChatErrorBoundary>
							</View>
						</View>
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
						style={[
							styles.dropdownContainer,
							animatedDropdownStyle,
							{
								backgroundColor: currentColors.card,
								borderColor: currentColors.border,
							},
						]}
					>
						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={handleShareChat}
							activeOpacity={0.7}
						>
							<Ionicons
								name="share-social-outline"
								size={20}
								color={currentColors.foreground}
								style={styles.dropdownIcon}
							/>
							<Text
								style={[
									styles.dropdownText,
									{ color: currentColors.foreground },
								]}
							>
								Share
							</Text>
						</TouchableOpacity>

						<View
							style={[
								styles.dropdownSeparator,
								{ backgroundColor: currentColors.border },
							]}
						/>

						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={handleClearChat}
							activeOpacity={0.7}
						>
							<Ionicons
								name="reload-circle-outline"
								size={20}
								color={currentColors.foreground}
								style={styles.dropdownIcon}
							/>
							<Text
								style={[
									styles.dropdownText,
									{ color: currentColors.foreground },
								]}
							>
								Reset Chat
							</Text>
						</TouchableOpacity>
					</Animated.View>
				</Animated.View>
			)}

			{/* Premium Paywall Drawer */}
			<PremiumPaywallDrawer
				visible={showPaywall}
				onClose={() => setShowPaywall(false)}
				onPurchase={handlePremiumPurchase}
				onRestore={handlePremiumRestore}
				onPrivacyPolicy={handlePrivacyPolicy}
			/>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	chatContainer: {
		flex: 1,
	},
	chatCaptureContainer: {
		flex: 1,
	},
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		paddingTop: Platform.OS === 'ios' ? 12 : 20,
		paddingHorizontal: 16,
		paddingBottom: 16,
		borderBottomWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	contentContainer: {
		flex: 1,
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
	},
	messagesContainer: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
	},
	emptyStateContainer: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 16,
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
		width: 70,
		height: 100,
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
		marginBottom: 6,
	},
	bookAuthor: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	messagesList: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20, // Back to normal
		flexGrow: 1,
	},
	messageContainer: {
		marginBottom: 16,
	},
	timestamp: {
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
		marginBottom: 8,
	},
	messageBubbleContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 4,
	},
	userMessageContainer: {
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
	},
	aiMessageContainer: {
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
	},
	avatarContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
		marginTop: 2,
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
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	userBubble: {
		borderBottomRightRadius: 6,
	},
	aiBubble: {
		borderBottomLeftRadius: 6,
		borderWidth: 1,
	},
	messageText: {
		fontSize: 16,
		lineHeight: 22,
	},
	userText: {
		// color will be set dynamically
	},
	aiText: {
		// color will be set dynamically
	},
	typingIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 4,
	},
	emptyContainer: {
		alignItems: 'center',
		paddingHorizontal: 20,
		marginBottom: 40,
	},
	emptyIconContainer: {
		width: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 8,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
		paddingHorizontal: 32,
		marginBottom: 24,
	},
	sampleQuestionsContainer: {
		width: '100%',
		alignItems: 'center',
		paddingBottom: 20,
		paddingHorizontal: 16,
		marginTop: 20,
	},
	sampleQuestionsTitle: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 12,
	},
	sampleQuestionsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		width: '100%',
		gap: 10,
	},
	sampleQuestionCard: {
		width: '48%',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1.5,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5, // Increased elevation to appear above other elements
		zIndex: 2, // Ensure proper layering
	},
	sampleQuestionIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginBottom: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sampleQuestionText: {
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
		lineHeight: 16,
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
	},
	inputContainer: {
		paddingHorizontal: 16,
		paddingBottom: Platform.OS === 'ios' ? 24 : 16,
		paddingTop: 12,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 24,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 8,
		backgroundColor: '#fff', // will be overridden by dynamic color
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		maxHeight: 100,
		paddingVertical: Platform.OS === 'ios' ? 8 : 4,
		paddingRight: 8,
	},
	sendButton: {
		width: 34,
		height: 34,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 8,
	},
	sendButtonDisabled: {
		opacity: 0.6,
	},
	micButton: {
		width: 34,
		height: 34,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 6,
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
		fontWeight: '500',
	},
	dropdownSeparator: {
		height: 1,
		marginHorizontal: 16,
	},
	destructiveItem: {
		// No additional styling needed, handled by text color
	},
	destructiveText: {
		// Color will be set dynamically
	},
	emptyStateScrollView: {
		flex: 1,
	},
	emptyStateScrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingHorizontal: 16,
		paddingTop: 40,
		paddingBottom: 20,
	},
});
