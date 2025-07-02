import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

// Polyfill for btoa if not available
const btoaPolyfill = (str: string): string => {
	if (typeof btoa !== 'undefined') {
		return btoa(str);
	}
	// Fallback base64 encoding
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	let result = '';
	let i = 0;
	while (i < str.length) {
		const a = str.charCodeAt(i++);
		const b = i < str.length ? str.charCodeAt(i++) : 0;
		const c = i < str.length ? str.charCodeAt(i++) : 0;
		const bitmap = (a << 16) | (b << 8) | c;
		result +=
			chars.charAt((bitmap >> 18) & 63) +
			chars.charAt((bitmap >> 12) & 63) +
			(i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=') +
			(i - 1 < str.length ? chars.charAt(bitmap & 63) : '=');
	}
	return result;
};

// Voice configurations for different book characters/moods
export const VOICE_CONFIGS = {
	// Male voices
	narrator: {
		voice_id: 'JBFqnCBsd6RMkjVDRZzb', // George - Professional narrator
		name: 'George',
		description: 'Professional, clear narrator voice',
		gender: 'male',
		personality: 'authoritative',
	},
	storyteller: {
		voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - Warm storyteller
		name: 'Josh',
		description: 'Warm, engaging storyteller',
		gender: 'male',
		personality: 'warm',
	},
	wise: {
		voice_id: 'CYw3kZ02Hs0563khs1Fj', // Dave - Wise, thoughtful
		name: 'Dave',
		description: 'Wise, thoughtful voice',
		gender: 'male',
		personality: 'wise',
	},
	conversational: {
		voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - Conversational
		name: 'Adam',
		description: 'Natural, conversational voice',
		gender: 'male',
		personality: 'friendly',
	},
	// Female voices
	elegantFemale: {
		voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - Elegant, sophisticated
		name: 'Bella',
		description: 'Elegant, sophisticated female voice',
		gender: 'female',
		personality: 'elegant',
	},
	warmFemale: {
		voice_id: 'MF3mGyEYCl7XYWbV9V6O', // Elli - Warm, nurturing
		name: 'Elli',
		description: 'Warm, nurturing female voice',
		gender: 'female',
		personality: 'nurturing',
	},
	intellectualFemale: {
		voice_id: 'ThT5KcBeYPX3keUQqHPh', // Dorothy - Intellectual, clear
		name: 'Dorothy',
		description: 'Intellectual, clear female voice',
		gender: 'female',
		personality: 'intellectual',
	},
	youthfulFemale: {
		voice_id: 'XrExE9yKIg1WjnnlVkGX', // Matilda - Youthful, energetic
		name: 'Matilda',
		description: 'Youthful, energetic female voice',
		gender: 'female',
		personality: 'youthful',
	},
};

export interface VoiceSettings {
	stability: number;
	similarity_boost: number;
	style: number;
	use_speaker_boost: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
	stability: 0.5,
	similarity_boost: 0.5,
	style: 0.5,
	use_speaker_boost: true,
};

/**
 * Select voice based on author gender and book characteristics
 */
export function selectVoiceForBook(
	bookAuthor?: string,
	bookId?: string,
	bookTitle?: string
): string {
	if (!bookAuthor || !bookId) {
		return VOICE_CONFIGS.conversational.voice_id; // Default fallback
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
	const isKnownMale = maleAuthors.some(author => authorLower.includes(author));

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

	// Create consistent voice selection based on book ID hash
	const bookHash = bookId
		.split('')
		.reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const voiceVariation = bookHash % 4; // 0, 1, 2, or 3

	if (isFemale) {
		// Female voice selection based on book characteristics
		const femaleVoices = [
			VOICE_CONFIGS.elegantFemale,
			VOICE_CONFIGS.warmFemale,
			VOICE_CONFIGS.intellectualFemale,
			VOICE_CONFIGS.youthfulFemale,
		];
		return femaleVoices[voiceVariation].voice_id;
	} else {
		// Male voice selection based on book characteristics
		const maleVoices = [
			VOICE_CONFIGS.narrator,
			VOICE_CONFIGS.storyteller,
			VOICE_CONFIGS.wise,
			VOICE_CONFIGS.conversational,
		];
		return maleVoices[voiceVariation].voice_id;
	}
}

/**
 * Get voice information for display purposes
 */
export function getVoiceInfo(voiceId: string) {
	const voiceConfig = Object.values(VOICE_CONFIGS).find(
		config => config.voice_id === voiceId
	);
	return voiceConfig || VOICE_CONFIGS.conversational;
}

/**
 * Get ElevenLabs API key
 */
function getApiKey(): string | null {
	try {
		const { apiKeyManager } = require('../utils/apiSecurity');
		return apiKeyManager.getElevenLabsKey();
	} catch {
		console.warn('ElevenLabs API key not found, falling back to expo-speech');
		return null;
	}
}

/**
 * Convert text to speech using ElevenLabs REST API
 */
export async function textToSpeech(
	text: string,
	voiceId: string = VOICE_CONFIGS.conversational.voice_id,
	voiceSettings: VoiceSettings = DEFAULT_VOICE_SETTINGS
): Promise<string | null> {
	try {
		const { secureApiRequest } = require('../utils/apiSecurity');
		return await secureApiRequest('elevenlabs', async () => {
			const apiKey = getApiKey();
			if (!apiKey) {
				return null;
			}

			// Make API call to ElevenLabs
			const response = await fetch(
				`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
				{
					method: 'POST',
					headers: {
						Accept: 'audio/mpeg',
						'Content-Type': 'application/json',
						'xi-api-key': apiKey,
					},
					body: JSON.stringify({
						text,
						model_id: 'eleven_multilingual_v2',
						voice_settings: voiceSettings,
					}),
				}
			);

			if (!response.ok) {
				console.error(
					'ElevenLabs API error:',
					response.status,
					await response.text()
				);
				return null;
			}

			// Get audio data as array buffer
			const arrayBuffer = await response.arrayBuffer();

			// Convert to base64 string
			const bytes = new Uint8Array(arrayBuffer);
			let binary = '';
			for (let i = 0; i < bytes.length; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			const base64Audio = btoaPolyfill(binary);

			// Save to temporary file
			const tempFilename = `elevenlabs_${Date.now()}.mp3`;
			const tempUri = `${FileSystem.cacheDirectory}${tempFilename}`;

			// Write audio data to file
			await FileSystem.writeAsStringAsync(tempUri, base64Audio, {
				encoding: FileSystem.EncodingType.Base64,
			});

			return tempUri;
		});
	} catch (error) {
		console.error('ElevenLabs TTS error:', error);
		return null;
	}
}

/**
 * Convert text to speech with streaming for real-time playback
 * Note: ElevenLabs streaming requires WebSocket which isn't easily available in RN
 * This implementation uses chunked text for pseudo-streaming
 */
export async function textToSpeechStreaming(
	text: string,
	voiceId: string = VOICE_CONFIGS.conversational.voice_id,
	onAudioChunk?: (audioUri: string) => void,
	voiceSettings: VoiceSettings = DEFAULT_VOICE_SETTINGS
): Promise<string[]> {
	try {
		// For React Native, we'll simulate streaming by splitting text into chunks
		const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
		const audioUris: string[] = [];

		for (let i = 0; i < sentences.length; i++) {
			const sentence = sentences[i].trim() + '.';
			if (sentence.length > 1) {
				const audioUri = await textToSpeech(sentence, voiceId, voiceSettings);
				if (audioUri) {
					audioUris.push(audioUri);
					if (onAudioChunk) {
						onAudioChunk(audioUri);
					}
				}
			}
		}

		return audioUris;
	} catch (error) {
		console.error('ElevenLabs streaming TTS error:', error);
		return [];
	}
}

/**
 * Play audio file using Expo AV
 */
export async function playAudioFile(
	audioUri: string,
	onPlaybackStatusUpdate?: (status: any) => void
): Promise<Audio.Sound> {
	// Note: Audio mode is set by the calling component to ensure proper speaker routing
	// We don't override it here to maintain the caller's audio configuration

	const { sound } = await Audio.Sound.createAsync(
		{ uri: audioUri },
		{ shouldPlay: true },
		onPlaybackStatusUpdate
	);
	return sound;
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices() {
	try {
		const apiKey = getApiKey();
		if (!apiKey) {
			return Object.values(VOICE_CONFIGS);
		}

		const response = await fetch('https://api.elevenlabs.io/v1/voices', {
			headers: {
				'xi-api-key': apiKey,
			},
		});

		if (!response.ok) {
			console.error('Error fetching voices:', response.status);
			return Object.values(VOICE_CONFIGS);
		}

		const data = await response.json();
		return data.voices.map((voice: any) => ({
			voice_id: voice.voice_id,
			name: voice.name,
			description: voice.description || '',
		}));
	} catch (error) {
		console.error('Error fetching voices:', error);
		return Object.values(VOICE_CONFIGS);
	}
}

/**
 * Cleanup temporary audio files
 */
export async function cleanupTempAudioFiles() {
	try {
		const cacheDir = FileSystem.cacheDirectory;
		if (!cacheDir) return;

		const files = await FileSystem.readDirectoryAsync(cacheDir);
		const audioFiles = files.filter(
			file => file.startsWith('elevenlabs_') && file.endsWith('.mp3')
		);

		for (const file of audioFiles) {
			await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
		}
	} catch (error) {
		console.error('Error cleaning up audio files:', error);
	}
}

/**
 * Test ElevenLabs API connection
 */
export async function testElevenLabsConnection(): Promise<boolean> {
	try {
		const apiKey = getApiKey();
		if (!apiKey) {
			return false;
		}

		const response = await fetch('https://api.elevenlabs.io/v1/user', {
			headers: {
				'xi-api-key': apiKey,
			},
		});

		return response.ok;
	} catch (error) {
		console.error('ElevenLabs connection test failed:', error);
		return false;
	}
}
