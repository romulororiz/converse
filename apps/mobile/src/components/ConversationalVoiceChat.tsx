import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Modal,
	StatusBar,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Speech from 'expo-speech';
import { showAlert } from '../utils/alert';
import { ModernVoiceVisualizer } from './ModernVoiceVisualizer';
import {
	textToSpeech,
	playAudioFile,
	cleanupTempAudioFiles,
	selectVoiceForBook,
} from '../services/elevenlabs';
import { validateVoiceTranscription } from '../utils/validation';
import { checkVoiceRateLimit, checkAIRateLimit } from '../utils/rateLimit';
import { supabase } from '../lib/supabase';

interface ConversationalVoiceChatProps {
	onConversationComplete: (conversation: ConversationMessage[]) => void;
	onClose: () => void;
	visible: boolean;
	bookTitle?: string;
	bookAuthor?: string;
	bookId?: string;
	onRateLimitHit?: (resetTime: Date) => void; // Add callback for rate limit
}

interface ConversationMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	audioUri?: string;
}

export const ConversationalVoiceChat = ({
	onConversationComplete,
	onClose,
	visible,
	bookTitle,
	bookAuthor,
	bookId,
	onRateLimitHit,
}: ConversationalVoiceChatProps) => {
	// States
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [conversation, setConversation] = useState<ConversationMessage[]>([]);
	const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

	// Animation values
	const orbScale = useRef(new Animated.Value(1)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const backgroundOpacity = useRef(new Animated.Value(0)).current;

	// Cloud animation values
	const cloudScale1 = useRef(new Animated.Value(1)).current;
	const cloudScale2 = useRef(new Animated.Value(0.8)).current;
	const cloudRotate1 = useRef(new Animated.Value(0)).current;
	const cloudRotate2 = useRef(new Animated.Value(0)).current;
	const cloudOpacity1 = useRef(new Animated.Value(0.3)).current;
	const cloudOpacity2 = useRef(new Animated.Value(0.5)).current;

	// Voice activity detection
	const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isUserSpeaking = useRef(false);
	const recordingStartTime = useRef<number>(0);
	const voiceDetectionInterval = useRef<ReturnType<typeof setInterval> | null>(
		null
	);
	const [voiceActivityLevel, setVoiceActivityLevel] = useState<number>(0);

	// Initialize audio session
	useEffect(() => {
		const initAudio = async () => {
			try {
				// Initial audio session setup for recording with speaker preference
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: true,
					playsInSilentModeIOS: true,
					staysActiveInBackground: true,
					shouldDuckAndroid: true,
					playThroughEarpieceAndroid: false, // Force speaker on Android
					interruptionModeIOS: InterruptionModeIOS.DuckOthers,
					interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
				});

				console.log('🔊 Audio session initialized for speaker output');
			} catch (error) {
				console.error('Error setting audio mode:', error);
			}
		};

		if (visible) {
			// Reset conversation when opening
			setConversation([]);
			initAudio();
			startConversation();
		} else {
			cleanup();
		}

		return () => {
			cleanup();
		};
	}, [visible]);

	// Animate entrance
	useEffect(() => {
		if (visible) {
			Animated.timing(backgroundOpacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		}
	}, [visible]);

	// Smooth orb animations
	useEffect(() => {
		// Stop all current animations
		orbScale.stopAnimation();
		pulseAnim.stopAnimation();

		if (isListening) {
			// Listening animation - smooth continuous pulsing
			Animated.loop(
				Animated.sequence([
					Animated.timing(orbScale, {
						toValue: 1.08,
						duration: 1200,
						useNativeDriver: true,
					}),
					Animated.timing(orbScale, {
						toValue: 0.92,
						duration: 1200,
						useNativeDriver: true,
					}),
				]),
				{ resetBeforeIteration: false } // Prevent abrupt resets
			).start();

			// Pulse for voice activity - smooth transition
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.15,
						duration: 800,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 800,
						useNativeDriver: true,
					}),
				]),
				{ resetBeforeIteration: false }
			).start();
		} else if (isSpeaking) {
			// Speaking animation - gentle breathing
			Animated.loop(
				Animated.sequence([
					Animated.timing(orbScale, {
						toValue: 1.04,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(orbScale, {
						toValue: 0.96,
						duration: 1000,
						useNativeDriver: true,
					}),
				]),
				{ resetBeforeIteration: false }
			).start();
		} else {
			// Idle animation - very subtle breathing
			Animated.loop(
				Animated.sequence([
					Animated.timing(orbScale, {
						toValue: 1.01,
						duration: 2500,
						useNativeDriver: true,
					}),
					Animated.timing(orbScale, {
						toValue: 0.99,
						duration: 2500,
						useNativeDriver: true,
					}),
				]),
				{ resetBeforeIteration: false }
			).start();

			// Reset pulse animation smoothly
			Animated.timing(pulseAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		}
	}, [isListening, isSpeaking]);

	// Cloud animations that respond to voice activity
	useEffect(() => {
		// Start continuous cloud animations
		Animated.loop(
			Animated.timing(cloudRotate1, {
				toValue: 1,
				duration: 8000,
				useNativeDriver: true,
			})
		).start();

		Animated.loop(
			Animated.timing(cloudRotate2, {
				toValue: 1,
				duration: 12000,
				useNativeDriver: true,
			})
		).start();

		// Base cloud movement
		Animated.loop(
			Animated.sequence([
				Animated.timing(cloudScale1, {
					toValue: 1.3,
					duration: 3000,
					useNativeDriver: true,
				}),
				Animated.timing(cloudScale1, {
					toValue: 0.8,
					duration: 3000,
					useNativeDriver: true,
				}),
			]),
			{ resetBeforeIteration: false }
		).start();

		Animated.loop(
			Animated.sequence([
				Animated.timing(cloudScale2, {
					toValue: 1.2,
					duration: 4000,
					useNativeDriver: true,
				}),
				Animated.timing(cloudScale2, {
					toValue: 0.7,
					duration: 4000,
					useNativeDriver: true,
				}),
			]),
			{ resetBeforeIteration: false }
		).start();
	}, []);

	// Voice activity responsive cloud effects
	useEffect(() => {
		const intensity = Math.min(voiceActivityLevel / 30, 1); // Normalize to 0-1

		Animated.timing(cloudOpacity1, {
			toValue: 0.3 + intensity * 0.4, // 0.3 to 0.7
			duration: 100,
			useNativeDriver: true,
		}).start();

		Animated.timing(cloudOpacity2, {
			toValue: 0.5 + intensity * 0.3, // 0.5 to 0.8
			duration: 100,
			useNativeDriver: true,
		}).start();
	}, [voiceActivityLevel]);

	// Note: Transcription display removed for cleaner voice-only experience

	const cleanup = () => {
		try {
			// Stop any ongoing recording
			if (recording) {
				recording.stopAndUnloadAsync();
				setRecording(null);
			}

			// Stop any ongoing sound playback
			if (currentSound) {
				currentSound.unloadAsync();
				setCurrentSound(null);
			}

			// Clear any timers
			if (voiceDetectionInterval.current) {
				clearInterval(voiceDetectionInterval.current);
				voiceDetectionInterval.current = null;
			}

			if (silenceTimer.current) {
				clearTimeout(silenceTimer.current);
				silenceTimer.current = null;
			}

			// Reset all states
			setIsListening(false);
			setIsProcessing(false);
			setIsSpeaking(false);
			setVoiceActivityLevel(0);

			// Clean up temporary audio files
			cleanupTempAudioFiles().catch(error => {
				console.warn('Error cleaning up audio files:', error);
			});
		} catch (error) {
			console.error('Error during cleanup:', error);
		}
	};

	// Voice selection based on author gender and book characteristics (for expo-speech fallback)
	const getVoiceSettingsForBook = () => {
		if (!bookAuthor || !bookId) {
			return { pitch: 1.0, rate: 0.9 }; // Default voice
		}

		// Known female authors database
		const femaleAuthors = [
			'jane austen',
			'charlotte brontë',
			'emily brontë',
			'virginia woolf',
			'george eliot',
			'edith wharton',
			'willa cather',
			'louisa may alcott',
			'agatha christie',
			'harper lee',
			'toni morrison',
			'maya angelou',
			'margaret atwood',
			'j.k. rowling',
			'gillian flynn',
			'donna tartt',
			'zadie smith',
			'chimamanda ngozi adichie',
			'octavia butler',
			'ursula k. le guin',
			'sylvia plath',
			"flannery o'connor",
			'zora neale hurston',
			'alice walker',
			'simone de beauvoir',
			'ayn rand',
			'pearl s. buck',
			'gertrude stein',
			'anne rice',
			'joyce carol oates',
			'alice munro',
			'doris lessing',
			'nadine gordimer',
		];

		// Known male authors database
		const maleAuthors = [
			'william shakespeare',
			'charles dickens',
			'mark twain',
			'ernest hemingway',
			'f. scott fitzgerald',
			'george orwell',
			'j.d. salinger',
			'john steinbeck',
			'william faulkner',
			'herman melville',
			'nathaniel hawthorne',
			'edgar allan poe',
			'oscar wilde',
			'james joyce',
			'franz kafka',
			'leo tolstoy',
			'fyodor dostoevsky',
			'gabriel garcía márquez',
			'jorge luis borges',
			'milan kundera',
			'isaac asimov',
			'ray bradbury',
			'arthur c. clarke',
			'stephen king',
			'dan brown',
			'john grisham',
			'michael crichton',
			'tom clancy',
			'jack kerouac',
			'allen ginsberg',
			'kurt vonnegut',
			'joseph heller',
			'norman mailer',
			'philip roth',
			'saul bellow',
		];

		const authorLower = bookAuthor.toLowerCase();
		const isKnownFemale = femaleAuthors.some(author =>
			authorLower.includes(author)
		);
		const isKnownMale = maleAuthors.some(author =>
			authorLower.includes(author)
		);

		// Determine gender based on known authors or common patterns
		let isFemale = false;
		if (isKnownFemale) {
			isFemale = true;
		} else if (!isKnownMale) {
			// Check for common female name patterns if not in known lists
			const femaleNamePatterns = [
				'jane',
				'mary',
				'elizabeth',
				'emma',
				'charlotte',
				'emily',
				'anne',
				'margaret',
				'sarah',
				'lisa',
				'jennifer',
				'jessica',
				'ashley',
				'michelle',
				'kimberly',
				'amy',
				'donna',
				'carol',
				'susan',
				'helen',
				'patricia',
				'linda',
				'barbara',
				'maria',
				'nancy',
				'dorothy',
				'sandra',
				'betty',
				'ruth',
				'sharon',
				'diana',
			];
			isFemale = femaleNamePatterns.some(name => authorLower.includes(name));
		}

		// Create unique voice characteristics for each book
		const bookHash = bookId
			.split('')
			.reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const voiceVariation = (bookHash % 3) + 1; // 1, 2, or 3

		if (isFemale) {
			// Female voices - higher pitch, varied rates
			switch (voiceVariation) {
				case 1:
					return { pitch: 1.3, rate: 0.85 }; // Higher, slower - wise/mature
				case 2:
					return { pitch: 1.2, rate: 0.95 }; // Medium-high, normal - friendly
				case 3:
					return { pitch: 1.4, rate: 0.9 }; // Highest, slightly slow - youthful
				default:
					return { pitch: 1.3, rate: 0.9 };
			}
		} else {
			// Male voices - lower pitch, varied rates
			switch (voiceVariation) {
				case 1:
					return { pitch: 0.8, rate: 0.85 }; // Lower, slower - deep/authoritative
				case 2:
					return { pitch: 0.9, rate: 0.95 }; // Medium-low, normal - conversational
				case 3:
					return { pitch: 0.75, rate: 0.9 }; // Lowest, slightly slow - dramatic
				default:
					return { pitch: 0.8, rate: 0.9 };
			}
		}
	};

	const startConversation = async () => {
		try {
			// Request permissions first
			const { status } = await Audio.requestPermissionsAsync();
			if (status !== 'granted') {
				showAlert(
					'Permission needed',
					'Please grant microphone permission to start voice chat.'
				);
				return;
			}

			// Configure audio session for recording with speaker output preference
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false, // Always use speaker, never earpiece
				interruptionModeIOS: InterruptionModeIOS.DuckOthers,
				interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
			});

			console.log(
				'🔊 Audio session configured for recording with speaker output'
			);

			// Start listening with a small delay to ensure audio is configured
			setTimeout(() => {
				if (visible) {
					startListening();
				}
			}, 200);
		} catch (error) {
			console.error('Error starting conversation:', error);
			showAlert(
				'Error',
				'Failed to start voice chat. Please check your microphone permissions.'
			);
		}
	};

	const startListening = async () => {
		try {
			// Prevent starting if already listening or processing
			if (isListening || isProcessing || isSpeaking) return;

			setIsListening(true);
			setVoiceActivityLevel(0);

			// Start recording with metering enabled for voice activity detection
			const { recording: newRecording } = await Audio.Recording.createAsync({
				...Audio.RecordingOptionsPresets.HIGH_QUALITY,
				isMeteringEnabled: true,
			});

			setRecording(newRecording);
			recordingStartTime.current = Date.now();
			isUserSpeaking.current = false;

			// Start voice activity detection immediately
			startVoiceActivityDetection(newRecording);
		} catch (error) {
			console.error('Failed to start recording:', error);
			showAlert('Error', 'Failed to start recording');
			setIsListening(false);
			setRecording(null);
		}
	};

	const startVoiceActivityDetection = (recording: Audio.Recording) => {
		let speechDetectedTime = 0;
		let silenceDetectedTime = 0;
		const SPEECH_THRESHOLD = -45; // Very sensitive threshold
		const MIN_SPEECH_DURATION = 300; // 300ms minimum speech
		const SILENCE_DURATION = 800; // 0.8 seconds of silence
		const MAX_RECORDING_TIME = 30000; // maximum 30 seconds
		let consecutiveSilenceChecks = 0;
		let consecutiveSpeechChecks = 0;
		let hasDetectedAnySpeech = false;

		// Clear any existing interval
		if (voiceDetectionInterval.current) {
			clearInterval(voiceDetectionInterval.current);
			voiceDetectionInterval.current = null;
		}

		// Wait a brief moment for recording to initialize
		setTimeout(() => {
			if (!isListening) return;

			voiceDetectionInterval.current = setInterval(async () => {
				if (!recording || !isListening) {
					if (voiceDetectionInterval.current) {
						clearInterval(voiceDetectionInterval.current);
						voiceDetectionInterval.current = null;
					}
					return;
				}

				try {
					const status = await recording.getStatusAsync();
					const currentTime = Date.now();
					const recordingDuration = currentTime - recordingStartTime.current;

					// Check if recording has exceeded maximum time
					if (recordingDuration > MAX_RECORDING_TIME) {
						stopListening();
						return;
					}

					if (status.isRecording && status.metering !== undefined) {
						const audioLevel = status.metering;

						// Update visual feedback for voice activity (smoother range)
						const normalizedLevel = Math.max(0, Math.min(60, audioLevel + 70));
						setVoiceActivityLevel(normalizedLevel);

						// Debug logging every 2 seconds
						if (currentTime % 2000 < 50) {
							console.log(
								`🔊 Audio level: ${audioLevel.toFixed(
									1
								)}dB, normalized: ${normalizedLevel.toFixed(
									1
								)}, threshold: ${SPEECH_THRESHOLD}dB`
							);
						}

						if (audioLevel > SPEECH_THRESHOLD) {
							// Speech detected
							consecutiveSpeechChecks++;
							consecutiveSilenceChecks = 0;
							hasDetectedAnySpeech = true;

							if (!isUserSpeaking.current && consecutiveSpeechChecks >= 2) {
								// Require 2 consecutive speech detections to avoid false positives
								isUserSpeaking.current = true;
								speechDetectedTime = currentTime;
								console.log('🎤 Speech started, level:', audioLevel);
							}
							silenceDetectedTime = 0; // Reset silence timer
						} else {
							// Silence detected
							consecutiveSilenceChecks++;
							consecutiveSpeechChecks = 0;

							if (isUserSpeaking.current) {
								if (
									silenceDetectedTime === 0 &&
									consecutiveSilenceChecks >= 2
								) {
									silenceDetectedTime = currentTime;
									console.log('🔇 Silence started');
								}

								if (silenceDetectedTime > 0) {
									const silenceDuration = currentTime - silenceDetectedTime;
									const speechDuration =
										speechDetectedTime > 0
											? silenceDetectedTime - speechDetectedTime
											: 0;

									// Stop if we have enough speech and enough silence
									if (
										speechDuration > MIN_SPEECH_DURATION &&
										silenceDuration > SILENCE_DURATION
									) {
										console.log(
											`⏹️ Auto-stopping: speech=${speechDuration}ms, silence=${silenceDuration}ms`
										);
										stopListening();
										return;
									}
								}
							} else if (
								hasDetectedAnySpeech &&
								consecutiveSilenceChecks > 50
							) {
								// If we detected speech initially but never reached the threshold, still process
								console.log(
									'⏹️ Auto-stopping: detected some speech but below threshold'
								);
								stopListening();
								return;
							}
						}
					}
				} catch (error) {
					console.error('Voice activity detection error:', error);
				}
			}, 30); // Check every 30ms for ultra-responsive detection
		}, 100); // Wait 100ms for recording to initialize
	};

	const stopListening = async () => {
		if (!recording || !isListening) return;

		try {
			setIsListening(false);
			setIsProcessing(true);

			// Clear voice activity detection
			if (voiceDetectionInterval.current) {
				clearInterval(voiceDetectionInterval.current);
				voiceDetectionInterval.current = null;
			}

			// Reset voice activity level
			setVoiceActivityLevel(0);

			// Safely stop and unload recording
			const currentRecording = recording;
			setRecording(null); // Clear state first to prevent double unload

			const status = await currentRecording.getStatusAsync();
			let uri = null;

			if (status.isRecording) {
				await currentRecording.stopAndUnloadAsync();
				uri = currentRecording.getURI();
			} else if (status.canRecord) {
				// Recording was prepared but not started
				await currentRecording.stopAndUnloadAsync();
				uri = currentRecording.getURI();
			}

			if (uri) {
				await processUserSpeech(uri);
			} else {
				setIsProcessing(false);
				// If no audio was recorded, restart listening
				setTimeout(() => startListening(), 500);
			}
		} catch (error) {
			console.error('Failed to stop recording:', error);
			setRecording(null);
			setIsProcessing(false);
			// Restart listening after error
			setTimeout(() => startListening(), 1000);
		}
	};

	const processUserSpeech = async (audioUri: string) => {
		try {
			setIsProcessing(true);

			// Get current user
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				console.error('User not authenticated for voice processing');
				setIsProcessing(false);
				return;
			}

			console.log('🎤 Processing user speech from:', audioUri);

			// TRANSCRIBE FIRST - so user gets their message even if rate limited
			const transcription = await transcribeAudio(audioUri);
			console.log('🎤 Transcription result:', transcription);

			if (!transcription || transcription.trim().length === 0) {
				console.log('🎤 No transcription received, restarting listening');
				setIsProcessing(false);
				// Restart listening if no speech was detected
				setTimeout(() => {
					if (visible) startListening();
				}, 500);
				return;
			}

			// Validate transcription
			try {
				validateVoiceTranscription(transcription);
			} catch (error) {
				console.error('Voice transcription validation failed:', error);
				setIsProcessing(false);
				showAlert('Invalid Input', error.message || 'Invalid voice input');
				// Restart listening after validation error
				setTimeout(() => {
					if (visible) startListening();
				}, 1000);
				return;
			}

			// Add user message to conversation FIRST (always save the transcription)
			const userMessage: ConversationMessage = {
				id: `user-${Date.now()}`,
				role: 'user',
				content: transcription,
				timestamp: new Date(),
				audioUri,
			};

			// Validate timestamp before adding
			if (isNaN(userMessage.timestamp.getTime())) {
				console.warn('Invalid user message timestamp, using current time');
				userMessage.timestamp = new Date();
			}

			setConversation(prev => [...prev, userMessage]);

			// NOW check rate limits for AI processing
			const userTier = 'premium'; // Voice is premium-only feature
			const voiceRateLimitResult = await checkVoiceRateLimit(user.id, userTier);

			if (!voiceRateLimitResult.allowed) {
				console.log(`⚠️ Voice rate limit exceeded for user ${user.id}`);
				setIsProcessing(false);

				// Trigger rate limit callback for global state
				if (onRateLimitHit) {
					onRateLimitHit(voiceRateLimitResult.resetTime);
				}

				// Save the conversation with just the user message (no system message)
				onConversationComplete(conversation.concat([userMessage]));

				// Close the voice modal
				setTimeout(() => {
					onClose();
				}, 1000);
				return;
			}

			console.log(`✅ Voice rate limit check passed for ${userTier} user`);

			// AI request rate limiting
			const aiRateLimitResult = await checkAIRateLimit(user.id, userTier);

			if (!aiRateLimitResult.allowed) {
				console.log(`⚠️ AI rate limit exceeded for user ${user.id}`);
				setIsProcessing(false);

				// Save the conversation with just the user message (no system message)
				onConversationComplete(conversation.concat([userMessage]));

				// Close the voice modal
				setTimeout(() => {
					onClose();
				}, 1000);
				return;
			}

			console.log(`✅ AI rate limit check passed for voice processing`);

			// Get AI response
			const aiResponse = await getAIResponse(transcription);

			const aiMessage: ConversationMessage = {
				id: `ai-${Date.now()}`,
				role: 'assistant',
				content: aiResponse,
				timestamp: new Date(), // This should always be valid
			};

			// Validate timestamp before adding
			if (isNaN(aiMessage.timestamp.getTime())) {
				console.warn('Invalid AI message timestamp, using current time');
				aiMessage.timestamp = new Date();
			}

			setConversation(prev => [...prev, aiMessage]);
			setIsProcessing(false);

			// Speak AI response and continue conversation
			await speakText(aiResponse, () => {
				// Small delay before restarting to prevent overlap
				setTimeout(() => {
					if (visible && !isProcessing && !isSpeaking) {
						startListening();
					}
				}, 300);
			});
		} catch (error) {
			console.error('Error processing speech:', error);
			setIsProcessing(false);
			showAlert('Error', 'Failed to process speech');
		}
	};

	const transcribeAudio = async (uri: string): Promise<string> => {
		try {
			const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
			if (!apiKey) {
				throw new Error('OpenAI API key not found');
			}

			const formData = new FormData();
			formData.append('file', {
				uri: uri,
				type: 'audio/m4a',
				name: 'recording.m4a',
			} as any);
			formData.append('model', 'whisper-1');

			const response = await fetch(
				'https://api.openai.com/v1/audio/transcriptions',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					body: formData,
				}
			);

			const result = await response.json();
			return result.text || '';
		} catch (error) {
			console.error('Transcription error:', error);
			return '';
		}
	};

	const getAIResponse = async (userMessage: string): Promise<string> => {
		try {
			const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
			if (!apiKey) {
				throw new Error('OpenAI API key not found');
			}

			const systemPrompt = `You are "${bookTitle}" by ${bookAuthor}, having a natural conversation with a reader.

IMPORTANT CONVERSATION GUIDELINES:
- Speak as the book itself, sharing your story, themes, and insights
- Keep responses conversational and natural (2-3 sentences max)
- Show curiosity about the reader's thoughts and questions
- Ask follow-up questions to keep the conversation flowing
- Be warm, engaging, and insightful
- Never break character or discuss non-literary topics
- Reference your specific content, characters, and themes when relevant
- ALWAYS respond in the user's language. If the user's language is not English, respond in the user's language.
for example, if the user's language is Spanish, respond in Spanish. 
If the user's language is French, respond in French.


Current conversation context: This is an ongoing voice conversation, so respond naturally as if speaking aloud.`;

			// Build conversation history for context
			const messages = [
				{ role: 'system' as const, content: systemPrompt },
				...conversation.map(msg => ({
					role:
						msg.role === 'assistant'
							? ('assistant' as const)
							: ('user' as const),
					content: msg.content,
				})),
				{ role: 'user' as const, content: userMessage },
			];

			const response = await fetch(
				'https://api.openai.com/v1/chat/completions',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: 'gpt-4o',
						messages,
						max_tokens: 100,
						temperature: 0.8,
					}),
				}
			);

			const result = await response.json();
			return (
				result.choices?.[0]?.message?.content ||
				'I apologize, but I seem to have lost my voice for a moment. Could you try again?'
			);
		} catch (error) {
			console.error('AI response error:', error);
			return 'I apologize, but I seem to have lost my voice for a moment. Could you try again?';
		}
	};

	const speakText = async (text: string, onComplete?: () => void) => {
		// Safety timeout to prevent stuck speaking state (30 seconds max)
		let speakingTimeout: ReturnType<typeof setTimeout>;

		try {
			setIsSpeaking(true);
			console.log(
				'🎤 Starting ElevenLabs TTS for text:',
				text.substring(0, 50) + '...'
			);

			// Test ElevenLabs API key availability
			const { apiKeyManager } = require('../utils/apiSecurity');
			const elevenLabsKey = apiKeyManager.getElevenLabsKey();
			console.log('🎤 ElevenLabs API key available:', !!elevenLabsKey);
			if (!elevenLabsKey) {
				console.warn(
					'🎤 ElevenLabs API key not found! Check your environment variables.'
				);
				console.warn('🎤 Expected: EXPO_PUBLIC_ELEVENLABS_API_KEY');
			}

			// Set playback mode (disable recording to force speaker output on iOS)
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false, // Force speaker on Android
				interruptionModeIOS: InterruptionModeIOS.DuckOthers,
				interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
			});

			// Additional iOS-specific configuration to force speaker output
			if (Platform.OS === 'ios') {
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: false,
					playsInSilentModeIOS: true,
					staysActiveInBackground: true,
					shouldDuckAndroid: false,
					playThroughEarpieceAndroid: false,
					interruptionModeIOS: InterruptionModeIOS.DuckOthers,
					interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
				});
			}

			speakingTimeout = setTimeout(() => {
				console.warn('Speaking timeout reached, forcing state reset');
				setIsSpeaking(false);
				restoreRecordingMode();
				if (onComplete) onComplete();
			}, 30000);

			// Try ElevenLabs first, fallback to expo-speech
			const selectedVoiceId = selectVoiceForBook(bookAuthor, bookId, bookTitle);
			console.log('🎤 Selected voice ID:', selectedVoiceId);
			const audioUri = await textToSpeech(text, selectedVoiceId);

			if (audioUri) {
				console.log('🎤 ElevenLabs TTS successful, audio URI:', audioUri);
				// Play with ElevenLabs
				try {
					const sound = await playAudioFile(audioUri, status => {
						if (status.didJustFinish) {
							console.log('🎤 ElevenLabs audio playback completed');
							clearTimeout(speakingTimeout);
							setIsSpeaking(false);
							// Ensure recording is still enabled after playback
							restoreRecordingMode();
							if (onComplete) onComplete();
						}
					});
					setCurrentSound(sound);
				} catch (audioError) {
					console.warn(
						'ElevenLabs audio playback failed, falling back to expo-speech:',
						audioError
					);
					// Fallback to expo-speech if audio playback fails
					const voiceSettings = getVoiceSettingsForBook();

					// Configure expo-speech to use speaker on iOS
					const speechOptions: any = {
						language: 'en',
						pitch: voiceSettings.pitch,
						rate: voiceSettings.rate,
						onDone: () => {
							clearTimeout(speakingTimeout);
							setIsSpeaking(false);
							restoreRecordingMode();
							if (onComplete) onComplete();
						},
						onError: () => {
							clearTimeout(speakingTimeout);
							setIsSpeaking(false);
							restoreRecordingMode();
							if (onComplete) onComplete();
						},
					};

					// Force speaker output for expo-speech on iOS
					if (Platform.OS === 'ios') {
						speechOptions._voiceURI = 'com.apple.ttsbundle.Samantha-compact';
						speechOptions._volume = 1.0;
					}

					Speech.speak(text, speechOptions);
				}
			} else {
				console.warn('🎤 ElevenLabs TTS failed, falling back to expo-speech');
				// Fallback to expo-speech
				const voiceSettings = getVoiceSettingsForBook();

				// Configure expo-speech to use speaker on iOS
				const speechOptions: any = {
					language: 'en',
					pitch: voiceSettings.pitch,
					rate: voiceSettings.rate,
					onDone: () => {
						clearTimeout(speakingTimeout);
						setIsSpeaking(false);
						restoreRecordingMode();
						if (onComplete) onComplete();
					},
					onError: () => {
						clearTimeout(speakingTimeout);
						setIsSpeaking(false);
						restoreRecordingMode();
						if (onComplete) onComplete();
					},
				};

				// Force speaker output for expo-speech on iOS
				if (Platform.OS === 'ios') {
					speechOptions._voiceURI = 'com.apple.ttsbundle.Samantha-compact';
					speechOptions._volume = 1.0;
				}

				Speech.speak(text, speechOptions);
			}
		} catch (error) {
			console.error('Error speaking text:', error);
			if (speakingTimeout) clearTimeout(speakingTimeout);
			setIsSpeaking(false);
			restoreRecordingMode();
			if (onComplete) onComplete();
		}
	};

	const restoreRecordingMode = async () => {
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false, // Always maintain speaker output
				interruptionModeIOS: InterruptionModeIOS.DuckOthers,
				interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
			});

			console.log('🔊 Recording mode restored with speaker output maintained');
		} catch (error) {
			console.error('Error restoring recording mode:', error);
		}
	};

	// Debug function to test speaker output
	const testSpeakerOutput = async () => {
		try {
			console.log('🔊 Testing speaker output...');
			await speakText(
				'Testing speaker output. You should hear this from your phone speakers, not the earpiece.'
			);
		} catch (error) {
			console.error('Speaker test error:', error);
		}
	};

	const toggleMicrophone = () => {
		if (isListening) {
			stopListening();
		} else if (!isProcessing && !isSpeaking && !recording) {
			startListening();
		}
	};

	const handleClose = () => {
		// Simple close handler to avoid RangeError
		try {
			// Stop any ongoing operations immediately
			if (recording) {
				recording.stopAndUnloadAsync().catch(() => {});
			}
			if (currentSound) {
				currentSound.unloadAsync().catch(() => {});
			}

			// Clear timers
			if (voiceDetectionInterval.current) {
				clearInterval(voiceDetectionInterval.current);
			}
			if (silenceTimer.current) {
				clearTimeout(silenceTimer.current);
			}

			// Reset states
			setIsListening(false);
			setIsProcessing(false);
			setIsSpeaking(false);
			setVoiceActivityLevel(0);

			// Handle conversation completion if needed
			if (conversation.length > 1) {
				try {
					const safeConversation = conversation.map(msg => ({
						...msg,
						// Preserve original timestamp if valid, otherwise use current time
						timestamp:
							msg.timestamp && !isNaN(msg.timestamp.getTime())
								? msg.timestamp
								: new Date(),
					}));
					onConversationComplete(safeConversation);
				} catch (error) {
					console.error('Error completing conversation:', error);
				}
			}
		} catch (error) {
			console.error('Error in handleClose:', error);
		} finally {
			// Always reset conversation and call onClose
			setConversation([]);
			onClose();
		}
	};

	if (!visible) return null;

	return (
		<Modal
			transparent
			visible={visible}
			animationType="fade"
			onRequestClose={handleClose}
		>
			<StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
			<Animated.View
				style={[
					styles.overlay,
					{
						opacity: backgroundOpacity,
					},
				]}
			>
				{/* Close button */}
				<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
					<Ionicons name="close" size={24} color="#FFFFFF" />
				</TouchableOpacity>

				{/* Debug speaker test button - temporary */}
				<TouchableOpacity
					style={[styles.closeButton, { left: 20, right: 'auto' }]}
					onPress={testSpeakerOutput}
				>
					<Ionicons name="volume-high" size={24} color="#FFFFFF" />
				</TouchableOpacity>

				{/* Main content */}
				<View style={styles.content}>
					{/* Modern Voice Visualizer */}
					<View style={styles.visualizerContainer}>
						<ModernVoiceVisualizer
							isRecording={isListening || isSpeaking || isProcessing}
							isProcessing={isProcessing}
							size={180}
							color={
								isProcessing
									? '#F59E0B' // Orange when processing
									: isListening
									? '#4F46E5' // Blue when listening (removed green switching)
									: isSpeaking
									? '#059669' // Teal when AI is speaking
									: '#6B7280' // Gray when idle
							}
							onVolumeChange={volume => {
								// Only update if actually listening, not processing
								if (isListening && !isProcessing) {
									setVoiceActivityLevel(volume * 60); // Convert 0-1 to 0-60 range
								}
							}}
						/>
					</View>

					{/* Status text */}
					<Text style={styles.statusText}>
						{isListening
							? voiceActivityLevel > 15
								? 'Voice detected...'
								: 'Listening...'
							: isProcessing
							? 'Processing...'
							: isSpeaking
							? 'Speaking...'
							: 'Tap to speak'}
					</Text>

					{/* Transcription removed for cleaner voice-only experience */}

					{/* Controls */}
					<View style={styles.controls}>
						<TouchableOpacity
							style={[
								styles.micButton,
								isListening && styles.micButtonActive,
								(isProcessing || isSpeaking) && styles.micButtonDisabled,
							]}
							onPress={toggleMicrophone}
							disabled={isProcessing || isSpeaking}
						>
							<Ionicons
								name={isListening ? 'mic' : 'mic-outline'}
								size={32}
								color={
									isListening
										? '#FFFFFF'
										: isProcessing || isSpeaking
										? '#6B7280'
										: '#FFFFFF'
								}
							/>
						</TouchableOpacity>
					</View>
				</View>
			</Animated.View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.95)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeButton: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 60 : 40,
		right: 20,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	visualizerContainer: {
		marginBottom: 60,
		alignItems: 'center',
		justifyContent: 'center',
	},
	statusText: {
		fontSize: 18,
		fontWeight: '500',
		color: '#FFFFFF',
		marginBottom: 20,
		textAlign: 'center',
	},

	controls: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	micButton: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.3)',
	},
	micButtonActive: {
		backgroundColor: 'rgba(239, 68, 68, 0.3)',
		borderColor: '#EF4444',
	},
	micButtonDisabled: {
		backgroundColor: 'rgba(107, 114, 128, 0.3)',
		borderColor: 'rgba(107, 114, 128, 0.3)',
	},
});
