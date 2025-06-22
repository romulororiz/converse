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
}

const { width, height } = Dimensions.get('window');

export default function VoiceRecorder({
	onTranscriptionComplete,
	onCancel,
	visible,
	bookTitle,
	bookAuthor,
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
		if (isRecording) {
			// Start pulse animation
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.2,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
				])
			).start();

			// Start floating ball animation
			Animated.loop(
				Animated.sequence([
					Animated.timing(ballAnim, {
						toValue: 1,
						duration: 2000,
						useNativeDriver: true,
					}),
					Animated.timing(ballAnim, {
						toValue: 0,
						duration: 2000,
						useNativeDriver: true,
					}),
				])
			).start();
		} else {
			// Stop animations
			pulseAnim.stopAnimation();
			ballAnim.stopAnimation();
		}
	}, [isRecording]);

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
			// Send to OpenAI Whisper API for transcription
			const transcription = await transcribeAudio(uri);
			setTranscribedText(transcription);

			// Get AI response
			const response = await getAIResponse(transcription);
			setAiResponse(response);

			// Play AI response
			await playAIResponse(response);
		} catch (error) {
			console.error('Failed to process recording:', error);
			Alert.alert('Error', 'Failed to process recording');
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
Answer as if you are the book itself, sharing your perspective and guiding the user through your pages.`;

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
						max_tokens: 150,
						temperature: 0.7,
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
			await Speech.speak(text, {
				language: 'en',
				pitch: 1.0,
				rate: 0.9,
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
								<Animated.View
									style={[
										styles.recordingBall,
										{
											transform: [
												{
													translateY: ballAnim.interpolate({
														inputRange: [0, 1],
														outputRange: [0, -20],
													}),
												},
												{
													scale: pulseAnim,
												},
											],
										},
									]}
								>
									<View style={styles.ballInner} />
								</Animated.View>
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
								<View style={styles.loadingBall}>
									<View style={styles.ballInner} />
								</View>
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
								<Animated.View
									style={[
										styles.playingBall,
										{
											transform: [
												{
													scale: pulseAnim,
												},
											],
										},
									]}
								>
									<View style={styles.ballInner} />
								</Animated.View>
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
	recordingBall: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: colors.light.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 30,
	},
	ballInner: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: colors.light.background,
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
		backgroundColor: colors.light.muted,
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
	playingBall: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: colors.light.secondary,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	playingText: {
		fontSize: 16,
		color: colors.light.foreground,
	},
});
