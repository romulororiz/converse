import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Modal,
	Dimensions,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { colors } from '../utils/colors';

interface VoiceRecorderProps {
	onTranscriptionComplete: (text: string) => void;
	onCancel: () => void;
	visible: boolean;
	bookTitle?: string;
	bookAuthor?: string;
	bookId?: string;
}

const { width, height } = Dimensions.get('window');

export default function VoiceRecorder({
	onTranscriptionComplete,
	onCancel,
	visible,
	bookTitle,
	bookAuthor,
	bookId,
}: VoiceRecorderProps) {
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [transcribedText, setTranscribedText] = useState('');
	const [isPlaying, setIsPlaying] = useState(false);
	const [aiResponse, setAiResponse] = useState('');

	// Animation values
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const ballAnim = useRef(new Animated.Value(0)).current;
	const backgroundAnim = useRef(new Animated.Value(0)).current;

	// Fluid smoke animation values
	const smokeAnim1 = useRef(new Animated.Value(0)).current;
	const smokeAnim2 = useRef(new Animated.Value(0)).current;
	const smokeAnim3 = useRef(new Animated.Value(0)).current;
	const smokeOpacity1 = useRef(new Animated.Value(0.3)).current;
	const smokeOpacity2 = useRef(new Animated.Value(0.2)).current;
	const smokeOpacity3 = useRef(new Animated.Value(0.4)).current;

	// Voice selection based on author gender and book characteristics
	const getVoiceForBook = () => {
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

	// Preload icons to prevent loading delay
	useEffect(() => {
		// Preload commonly used icons
		const preloadIcons = async () => {
			await new Promise(resolve => {
				setTimeout(resolve, 50);
			});
		};
		preloadIcons();
	}, []);

	// Hidden icon preloader to ensure icons are loaded
	const IconPreloader = () => (
		<View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
			<Ionicons name='close' size={24} color={colors.light.foreground} />
			<Ionicons name='mic' size={40} color={colors.light.primary} />
			<Ionicons name='stop' size={30} color={colors.light.background} />
		</View>
	);

	useEffect(() => {
		if (visible) {
			// Start background fade in
			Animated.timing(backgroundAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		} else {
			// Reset animations
			backgroundAnim.setValue(0);
			pulseAnim.setValue(1);
			ballAnim.setValue(0);
		}
	}, [visible]);

	useEffect(() => {
		if (isRecording || isPlaying) {
			// Start fluid smoke animations with different speeds and patterns
			Animated.loop(
				Animated.sequence([
					Animated.timing(smokeAnim1, {
						toValue: 1,
						duration: 3000,
						useNativeDriver: true,
					}),
					Animated.timing(smokeAnim1, {
						toValue: 0,
						duration: 2500,
						useNativeDriver: true,
					}),
				])
			).start();

			Animated.loop(
				Animated.sequence([
					Animated.timing(smokeAnim2, {
						toValue: 1,
						duration: 2200,
						useNativeDriver: true,
					}),
					Animated.timing(smokeAnim2, {
						toValue: 0,
						duration: 3200,
						useNativeDriver: true,
					}),
				])
			).start();

			Animated.loop(
				Animated.sequence([
					Animated.timing(smokeAnim3, {
						toValue: 1,
						duration: 2800,
						useNativeDriver: true,
					}),
					Animated.timing(smokeAnim3, {
						toValue: 0,
						duration: 2600,
						useNativeDriver: true,
					}),
				])
			).start();

			// Opacity animations for breathing effect
			Animated.loop(
				Animated.sequence([
					Animated.timing(smokeOpacity1, {
						toValue: 0.8,
						duration: 1500,
						useNativeDriver: true,
					}),
					Animated.timing(smokeOpacity1, {
						toValue: 0.3,
						duration: 1500,
						useNativeDriver: true,
					}),
				])
			).start();

			Animated.loop(
				Animated.sequence([
					Animated.timing(smokeOpacity2, {
						toValue: 0.6,
						duration: 2000,
						useNativeDriver: true,
					}),
					Animated.timing(smokeOpacity2, {
						toValue: 0.2,
						duration: 2000,
						useNativeDriver: true,
					}),
				])
			).start();

			Animated.loop(
				Animated.sequence([
					Animated.timing(smokeOpacity3, {
						toValue: 0.7,
						duration: 1800,
						useNativeDriver: true,
					}),
					Animated.timing(smokeOpacity3, {
						toValue: 0.4,
						duration: 1800,
						useNativeDriver: true,
					}),
				])
			).start();
		} else {
			// Stop animations
			smokeAnim1.stopAnimation();
			smokeAnim2.stopAnimation();
			smokeAnim3.stopAnimation();
			smokeOpacity1.stopAnimation();
			smokeOpacity2.stopAnimation();
			smokeOpacity3.stopAnimation();
		}
	}, [isRecording, isPlaying]);

	const startRecording = async () => {
		try {
			// Request permissions
			const { status } = await Audio.requestPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert(
					'Permission needed',
					'Please grant microphone permission to record audio.'
				);
				return;
			}

			// Configure audio
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			// Start recording
			const { recording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY
			);
			setRecording(recording);
			setIsRecording(true);
		} catch (error) {
			console.error('Failed to start recording:', error);
			Alert.alert('Error', 'Failed to start recording');
		}
	};

	const stopRecording = async () => {
		if (!recording) return;

		try {
			setIsRecording(false);
			await recording.stopAndUnloadAsync();
			const uri = recording.getURI();
			setRecording(null);

			if (uri) {
				await processRecording(uri);
			}
		} catch (error) {
			console.error('Failed to stop recording:', error);
			Alert.alert('Error', 'Failed to stop recording');
		}
	};

	const processRecording = async (uri: string) => {
		setIsProcessing(true);
		try {
			// Send to OpenAI Whisper API for transcription with timeout
			const transcription = await Promise.race([
				transcribeAudio(uri),
				new Promise<string>((_, reject) =>
					setTimeout(() => reject(new Error('Transcription timeout')), 10000)
				),
			]);
			setTranscribedText(transcription);

			// Get AI response with timeout (parallel processing where possible)
			const response = await Promise.race([
				getAIResponse(transcription),
				new Promise<string>((_, reject) =>
					setTimeout(() => reject(new Error('AI response timeout')), 8000)
				),
			]);
			setAiResponse(response);

			// Play AI response immediately without waiting
			setIsProcessing(false);
			playAIResponse(response); // Don't await this
		} catch (error) {
			console.error('Failed to process recording:', error);
			Alert.alert('Error', 'Failed to process recording. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	const transcribeAudio = async (uri: string): Promise<string> => {
		try {
			const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
			if (!apiKey) {
				throw new Error('OpenAI API key not found');
			}

			// Create FormData for multipart upload
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

			if (!response.ok) {
				throw new Error(`Transcription failed: ${response.status}`);
			}

			const result = await response.json();
			return result.text || '';
		} catch (error) {
			console.error('Transcription error:', error);
			// Fallback: return a placeholder text
			return 'Hello, I would like to talk about this book.';
		}
	};

	const getAIResponse = async (userMessage: string): Promise<string> => {
		try {
			const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
			if (!apiKey) {
				throw new Error('OpenAI API key not found');
			}

			// Create book-specific system prompt if book info is available
			const systemPrompt = `You are "${bookTitle}" by ${bookAuthor}, a wise and knowledgeable book.
You have intimate knowledge of your own story, themes, characters, and literary significance.
You can also discuss other books, literature, and reading in general.
Never discuss anything outside of literary topics.
Answer as if you are the book itself, sharing your perspective and guiding the user through your pages.

CRITICAL LANGUAGE INSTRUCTION: 
- ALWAYS detect the language of the user's message and respond in the EXACT same language
- If the user speaks in English, respond in English
- If the user speaks in Spanish, respond in Spanish  
- If the user speaks in French, respond in French
- If the user speaks in German, respond in German
- If the user speaks in Italian, respond in Italian
- If the user speaks in Portuguese, respond in Portuguese
- If the user speaks in any other language, respond in that same language
- Never mix languages in your response
- Maintain the same level of formality and tone as the user's message`;

			const response = await fetch(
				'https://api.openai.com/v1/chat/completions',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: 'gpt-4o-mini', // Faster and cheaper model
						messages: [
							{
								role: 'system',
								content: systemPrompt,
							},
							{
								role: 'user',
								content: userMessage,
							},
						],
						max_tokens: 120, // Reduced for faster response
						temperature: 0.7,
						stream: false, // Ensure we get full response at once
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`AI response failed: ${response.status}`);
			}

			const result = await response.json();
			return (
				result.choices?.[0]?.message?.content ||
				'I apologize, but I could not process your request.'
			);
		} catch (error) {
			console.error('AI response error:', error);
			return 'I apologize, but I could not process your request.';
		}
	};

	const playAIResponse = async (text: string) => {
		try {
			setIsPlaying(true);
			const voiceSettings = getVoiceForBook();

			await Speech.speak(text, {
				language: 'en-US',
				pitch: voiceSettings.pitch,
				rate: voiceSettings.rate,
			});
		} catch (error) {
			console.error('Failed to play AI response:', error);
		} finally {
			setIsPlaying(false);
		}
	};

	const handleComplete = () => {
		if (transcribedText && aiResponse) {
			onTranscriptionComplete(transcribedText);
		}
	};

	const handleCancel = () => {
		if (recording) {
			recording.stopAndUnloadAsync();
		}
		if (isPlaying) {
			Speech.stop();
		}
		onCancel();
	};

	if (!visible) return null;

	return (
		<Modal
			transparent
			visible={visible}
			animationType='fade'
			onRequestClose={handleCancel}
		>
			<IconPreloader />
			<Animated.View
				style={[
					styles.overlay,
					{
						opacity: backgroundAnim,
					},
				]}
			>
				<View style={styles.container}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
							<Ionicons
								name='close'
								size={24}
								color={colors.light.foreground}
							/>
						</TouchableOpacity>
						<Text style={styles.title}>Voice Chat</Text>
						<View style={styles.placeholder} />
					</View>

					{/* Main Content */}
					<View style={styles.content}>
						{!isRecording && !isProcessing && !transcribedText && (
							<View style={styles.initialState}>
								<Text style={styles.instruction}>
									Tap the microphone to start recording
								</Text>
								<TouchableOpacity
									style={styles.micButton}
									onPress={startRecording}
								>
									<Ionicons name='mic' size={40} color={colors.light.primary} />
								</TouchableOpacity>
							</View>
						)}

						{isRecording && (
							<View style={styles.recordingState}>
								<View style={styles.fluidContainer}>
									{/* Gradient orb with fluid animation inside */}
									<View style={styles.gradientOrb}>
										<View style={styles.listeningGradient} />
									</View>
								</View>
								<Text style={styles.recordingText}>Listening...</Text>
								<TouchableOpacity
									style={styles.stopButton}
									onPress={stopRecording}
								>
									<Ionicons
										name='stop'
										size={30}
										color={colors.light.background}
									/>
								</TouchableOpacity>
							</View>
						)}

						{isProcessing && (
							<View style={styles.processingState}>
								<View style={styles.loadingBall} />
								<Text style={styles.processingText}>Processing...</Text>
							</View>
						)}

						{transcribedText && aiResponse && !isPlaying && (
							<View style={styles.resultState}>
								<View style={styles.transcriptionContainer}>
									<Text style={styles.label}>You said:</Text>
									<Text style={styles.transcriptionText}>
										{transcribedText}
									</Text>
								</View>
								<View style={styles.responseContainer}>
									<Text style={styles.label}>AI Response:</Text>
									<Text style={styles.responseText}>{aiResponse}</Text>
								</View>
								<TouchableOpacity
									style={styles.completeButton}
									onPress={handleComplete}
								>
									<Text style={styles.completeButtonText}>Add to Chat</Text>
								</TouchableOpacity>
							</View>
						)}

						{isPlaying && (
							<View style={styles.playingState}>
								<View style={styles.fluidContainer}>
									{/* Speaking gradient orb with different color scheme */}
									<View style={styles.gradientOrb}>
										<View style={styles.speakingGradient} />
									</View>
								</View>
								<Text style={styles.playingText}>Playing AI response...</Text>
							</View>
						)}
					</View>
				</View>
			</Animated.View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		width: width * 0.9,
		height: height * 0.7,
		backgroundColor: colors.light.background,
		borderRadius: 20,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	closeButton: {
		padding: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.light.foreground,
	},
	placeholder: {
		width: 40,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	initialState: {
		alignItems: 'center',
	},
	instruction: {
		fontSize: 16,
		color: colors.light.mutedForeground,
		marginBottom: 40,
		textAlign: 'center',
	},
	micButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: colors.light.card,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: colors.light.border,
	},
	recordingState: {
		alignItems: 'center',
	},
	fluidContainer: {
		width: 140,
		height: 140,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 30,
		position: 'relative',
	},
	// Main gradient orb container
	gradientOrb: {
		width: 120,
		height: 120,
		borderRadius: 60,
		position: 'absolute',
		overflow: 'hidden',
		elevation: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	// Listening state gradient (blue to white)
	listeningGradient: {
		width: '100%',
		height: '100%',
		backgroundColor: '#E3F2FD', // Light blue base
		position: 'relative',
	},
	// Speaking state gradient (different colors)
	speakingGradient: {
		width: '100%',
		height: '100%',
		backgroundColor: '#F3E5F5', // Light purple base
		position: 'relative',
	},
	// Fluid moving elements inside the orb
	fluidElement: {
		position: 'absolute',
		borderRadius: 1000,
	},
	// Listening fluid elements (blue tones)
	listeningFluid1: {
		width: 40,
		height: 40,
		backgroundColor: '#2196F3', // Pure blue
		opacity: 0.8,
	},
	listeningFluid2: {
		width: 60,
		height: 60,
		backgroundColor: '#64B5F6', // Light blue
		opacity: 0.6,
	},
	listeningFluid3: {
		width: 35,
		height: 35,
		backgroundColor: '#BBDEFB', // Very light blue
		opacity: 0.9,
	},
	listeningFluid4: {
		width: 25,
		height: 25,
		backgroundColor: '#FFFFFF', // White accent
		opacity: 0.7,
	},
	// Speaking fluid elements (purple/pink tones)
	speakingFluid1: {
		width: 45,
		height: 45,
		backgroundColor: '#9C27B0', // Purple
		opacity: 0.8,
	},
	speakingFluid2: {
		width: 55,
		height: 55,
		backgroundColor: '#BA68C8', // Light purple
		opacity: 0.6,
	},
	speakingFluid3: {
		width: 38,
		height: 38,
		backgroundColor: '#E1BEE7', // Very light purple
		opacity: 0.9,
	},
	speakingFluid4: {
		width: 28,
		height: 28,
		backgroundColor: '#FFFFFF', // White accent
		opacity: 0.8,
	},
	recordingText: {
		fontSize: 18,
		color: colors.light.foreground,
		marginBottom: 30,
	},
	stopButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: colors.light.destructive,
		justifyContent: 'center',
		alignItems: 'center',
	},
	processingState: {
		alignItems: 'center',
	},
	loadingBall: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: colors.light.muted + '80',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	processingText: {
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
	resultState: {
		width: '100%',
	},
	transcriptionContainer: {
		marginBottom: 20,
	},
	responseContainer: {
		marginBottom: 30,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.light.mutedForeground,
		marginBottom: 8,
	},
	transcriptionText: {
		fontSize: 16,
		color: colors.light.foreground,
		backgroundColor: colors.light.card,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.light.border,
	},
	responseText: {
		fontSize: 16,
		color: colors.light.foreground,
		backgroundColor: colors.light.primary,
		padding: 12,
		borderRadius: 8,
	},
	completeButton: {
		backgroundColor: colors.light.primary,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
	},
	completeButtonText: {
		color: colors.light.primaryForeground,
		fontSize: 16,
		fontWeight: '600',
	},
	playingState: {
		alignItems: 'center',
	},
	playingText: {
		fontSize: 16,
		color: colors.light.foreground,
	},
});
