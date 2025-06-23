import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Modal,
	Dimensions,
	StatusBar,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../utils/colors';
import { showAlert } from '../utils/alert';
import {
	textToSpeech,
	playAudioFile,
	cleanupTempAudioFiles,
	VOICE_CONFIGS,
	selectVoiceForBook,
} from '../services/elevenlabs';

interface ConversationalVoiceChatProps {
	onConversationComplete: (conversation: ConversationMessage[]) => void;
	onClose: () => void;
	visible: boolean;
	bookTitle?: string;
	bookAuthor?: string;
	bookId?: string;
}

interface ConversationMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	audioUri?: string;
}

const { width, height } = Dimensions.get('window');

export default function ConversationalVoiceChat({
	onConversationComplete,
	onClose,
	visible,
	bookTitle,
	bookAuthor,
	bookId,
}: ConversationalVoiceChatProps) {
	// States
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [conversation, setConversation] = useState<ConversationMessage[]>([]);
	const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

	// Animation values
	const orbScale = useRef(new Animated.Value(1)).current;
	const orbOpacity = useRef(new Animated.Value(0.8)).current;
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
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: true,
					playsInSilentModeIOS: true,
					staysActiveInBackground: true,
					shouldDuckAndroid: true,
					playThroughEarpieceAndroid: false,
					interruptionModeIOS: InterruptionModeIOS.DuckOthers,
					interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
				});
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

	const cleanup = useCallback(async () => {
		try {
			// Clear timers first to prevent any ongoing operations
			if (silenceTimer.current) {
				clearTimeout(silenceTimer.current);
				silenceTimer.current = null;
			}
			if (voiceDetectionInterval.current) {
				clearInterval(voiceDetectionInterval.current);
				voiceDetectionInterval.current = null;
			}

			// Reset states immediately to prevent UI conflicts
			setIsListening(false);
			setIsProcessing(false);
			setIsSpeaking(false);

			// Stop recording safely
			if (recording) {
				try {
					const status = await recording.getStatusAsync();
					if (status.isRecording || status.canRecord) {
						await recording.stopAndUnloadAsync();
					}
				} catch (error) {
					console.log('Recording cleanup warning:', error);
					// Try force cleanup
					try {
						await recording.stopAndUnloadAsync();
					} catch (finalError) {
						console.log('Final recording cleanup failed:', finalError);
					}
				}
			}

			// Stop current audio safely
			if (currentSound) {
				try {
					const status = await currentSound.getStatusAsync();
					if (status.isLoaded) {
						await currentSound.stopAsync();
						await currentSound.unloadAsync();
					}
				} catch (error) {
					console.log('Audio cleanup warning:', error);
				}
			}

			// Stop expo-speech
			try {
				Speech.stop();
			} catch (error) {
				console.log('Speech stop warning:', error);
			}

			// Cleanup temp files
			try {
				await cleanupTempAudioFiles();
			} catch (error) {
				console.log('Temp files cleanup warning:', error);
			}

			// Final state reset
			setRecording(null);
			setCurrentSound(null);
			setConversation([]);
		} catch (error) {
			console.log('General cleanup error:', error);
		}
	}, [recording, currentSound]);

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

			// Configure audio session for recording
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
				interruptionModeIOS: InterruptionModeIOS.DuckOthers,
				interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
			});

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
								`🔊 Audio level: ${audioLevel.toFixed(1)}dB, normalized: ${normalizedLevel.toFixed(1)}, threshold: ${SPEECH_THRESHOLD}dB`
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
			// Transcribe audio using OpenAI Whisper
			const transcription = await transcribeAudio(audioUri);

			if (!transcription.trim()) {
				setIsProcessing(false);
				startListening(); // Continue listening if no speech detected
				return;
			}

			// Add user message to conversation (no transcription display)
			const userMessage: ConversationMessage = {
				id: `user-${Date.now()}`,
				role: 'user',
				content: transcription,
				timestamp: new Date(),
				audioUri,
			};

			setConversation(prev => [...prev, userMessage]);

			// Get AI response
			const aiResponse = await getAIResponse(transcription);

			const aiMessage: ConversationMessage = {
				id: `ai-${Date.now()}`,
				role: 'assistant',
				content: aiResponse,
				timestamp: new Date(),
			};

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
- ALWAYS respond in the user's language.

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

			// Set playback mode (disable recording to force speaker output on iOS)
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
				interruptionModeIOS: InterruptionModeIOS.DuckOthers,
				interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
			});

			speakingTimeout = setTimeout(() => {
				console.warn('Speaking timeout reached, forcing state reset');
				setIsSpeaking(false);
				restoreRecordingMode();
				if (onComplete) onComplete();
			}, 30000);

			// Try ElevenLabs first, fallback to expo-speech
			const selectedVoiceId = selectVoiceForBook(bookAuthor, bookId, bookTitle);
			const audioUri = await textToSpeech(text, selectedVoiceId);

			if (audioUri) {
				// Play with ElevenLabs
				try {
					const sound = await playAudioFile(audioUri, status => {
						if (status.didJustFinish) {
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
					Speech.speak(text, {
						language: 'en',
						pitch: voiceSettings.pitch,
						rate: voiceSettings.rate,
						quality: 'enhanced',
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
					});
				}
			} else {
				// Fallback to expo-speech
				const voiceSettings = getVoiceSettingsForBook();
				Speech.speak(text, {
					language: 'en',
					pitch: voiceSettings.pitch,
					rate: voiceSettings.rate,
					quality: 'enhanced',
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
				});
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
				playThroughEarpieceAndroid: false,
				interruptionModeIOS: InterruptionModeIOS.DuckOthers,
				interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
			});
		} catch (error) {
			console.error('Error restoring recording mode:', error);
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
		if (conversation.length > 1) {
			onConversationComplete(conversation);
		}
		// Reset conversation state after sending
		setConversation([]);
		onClose();
	};

	if (!visible) return null;

	return (
		<Modal
			transparent
			visible={visible}
			animationType='fade'
			onRequestClose={handleClose}
		>
			<StatusBar barStyle='light-content' backgroundColor='rgba(0,0,0,0.9)' />
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
					<Ionicons name='close' size={24} color='#FFFFFF' />
				</TouchableOpacity>

				{/* Main content */}
				<View style={styles.content}>
					{/* Animated orb */}
					<View style={styles.orbContainer}>
						<Animated.View
							style={[
								styles.orbWrapper,
								{
									transform: [{ scale: orbScale }],
								},
							]}
						>
							<LinearGradient
								colors={
									isListening
										? voiceActivityLevel > 15
											? ['#10B981', '#059669', '#047857'] // Green when speaking
											: ['#4F46E5', '#7C3AED', '#EC4899'] // Blue when listening
										: isSpeaking
											? ['#059669', '#0891B2', '#7C3AED']
											: ['#6B7280', '#9CA3AF', '#D1D5DB']
								}
								style={styles.orb}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								{/* Misty cloud layers inside the orb */}
								<Animated.View
									style={[
										styles.cloudLayer,
										{
											opacity: cloudOpacity1,
											transform: [
												{ scale: cloudScale1 },
												{
													rotate: cloudRotate1.interpolate({
														inputRange: [0, 1],
														outputRange: ['0deg', '360deg'],
													}),
												},
											],
										},
									]}
								>
									<LinearGradient
										colors={
											isListening
												? voiceActivityLevel > 15
													? [
															'rgba(16, 185, 129, 0.6)',
															'rgba(5, 150, 105, 0.4)',
														]
													: [
															'rgba(79, 70, 229, 0.6)',
															'rgba(124, 58, 237, 0.4)',
														]
												: isSpeaking
													? ['rgba(5, 150, 105, 0.6)', 'rgba(8, 145, 178, 0.4)']
													: [
															'rgba(107, 114, 128, 0.6)',
															'rgba(156, 163, 175, 0.4)',
														]
										}
										style={styles.cloudGradient}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
									/>
								</Animated.View>

								<Animated.View
									style={[
										styles.cloudLayer,
										{
											opacity: cloudOpacity2,
											transform: [
												{ scale: cloudScale2 },
												{
													rotate: cloudRotate2.interpolate({
														inputRange: [0, 1],
														outputRange: ['360deg', '0deg'],
													}),
												},
											],
										},
									]}
								>
									<LinearGradient
										colors={
											isListening
												? voiceActivityLevel > 15
													? [
															'rgba(52, 211, 153, 0.5)',
															'rgba(16, 185, 129, 0.3)',
														]
													: [
															'rgba(139, 92, 246, 0.5)',
															'rgba(79, 70, 229, 0.3)',
														]
												: isSpeaking
													? ['rgba(34, 197, 94, 0.5)', 'rgba(5, 150, 105, 0.3)']
													: [
															'rgba(156, 163, 175, 0.5)',
															'rgba(107, 114, 128, 0.3)',
														]
										}
										style={styles.cloudGradient}
										start={{ x: 1, y: 0 }}
										end={{ x: 0, y: 1 }}
									/>
								</Animated.View>

								{/* Voice activity indicator in center */}
								{isListening && voiceActivityLevel > 10 && (
									<Animated.View
										style={[
											styles.voiceIndicator,
											{
												opacity: voiceActivityLevel / 60,
												transform: [
													{
														scale: 1 + voiceActivityLevel / 100,
													},
												],
											},
										]}
									>
										<LinearGradient
											colors={[
												'rgba(255, 255, 255, 0.8)',
												'rgba(255, 255, 255, 0.3)',
											]}
											style={styles.voiceIndicatorGradient}
										/>
									</Animated.View>
								)}

								{/* Pulse effect for listening */}
								{isListening && (
									<Animated.View
										style={[
											styles.pulseRing,
											{
												transform: [{ scale: pulseAnim }],
												opacity: pulseAnim.interpolate({
													inputRange: [1, 1.2],
													outputRange: [0.5, 0.1],
												}),
												borderColor:
													voiceActivityLevel > 15 ? '#00FF88' : '#FFFFFF',
												borderWidth: voiceActivityLevel > 15 ? 3 : 2,
											},
										]}
									/>
								)}
							</LinearGradient>
						</Animated.View>
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
}

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
	orbContainer: {
		marginBottom: 40,
	},
	orbWrapper: {
		width: 200,
		height: 200,
		justifyContent: 'center',
		alignItems: 'center',
	},
	orb: {
		width: 180,
		height: 180,
		borderRadius: 90,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 10,
		},
		shadowOpacity: 0.3,
		shadowRadius: 20,
	},
	pulseRing: {
		position: 'absolute',
		width: 220,
		height: 220,
		borderRadius: 110,
		borderWidth: 2,
		borderColor: '#FFFFFF',
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
	cloudLayer: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderRadius: 90,
		overflow: 'hidden',
	},
	cloudGradient: {
		width: '100%',
		height: '100%',
		borderRadius: 90,
	},
	voiceIndicator: {
		position: 'absolute',
		width: 30,
		height: 30,
		borderRadius: 15,
		alignSelf: 'center',
		top: '50%',
		left: '50%',
		marginTop: -15,
		marginLeft: -15,
	},
	voiceIndicatorGradient: {
		width: '100%',
		height: '100%',
		borderRadius: 15,
	},
});
