import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testElevenLabsConnection } from '../services/elevenlabs';

export const ElevenLabsTest = () => {
	const [testing, setTesting] = useState(false);
	const [result, setResult] = useState<string>('');

	const testConnection = async () => {
		setTesting(true);
		setResult('Testing...');

		try {
			// Test the connection
			const isConnected = await testElevenLabsConnection();

			if (isConnected) {
				setResult('✅ ElevenLabs connection successful!');
				Alert.alert('Success', 'ElevenLabs API key is working correctly.');
			} else {
				setResult('❌ ElevenLabs connection failed');
				Alert.alert(
					'Error',
					'ElevenLabs API key is not working. Check your configuration.'
				);
			}
		} catch (error) {
			setResult(`❌ Error: ${error.message}`);
			Alert.alert('Error', `Test failed: ${error.message}`);
		} finally {
			setTesting(false);
		}
	};

	const checkEnvironment = () => {
		const { apiKeyManager } = require('../utils/apiSecurity');
		const apiKey = apiKeyManager.getElevenLabsKey();
		const hasKey = !!apiKey;
		const keyLength = apiKey ? apiKey.length : 0;

		const message = `Environment Check:
API Key Present: ${hasKey ? 'Yes' : 'No'}
Key Length: ${keyLength} characters
Expected Length: 32 characters

If API Key Present is "No", you need to:
1. Create a .env.local file in the mobile app root
2. Add: EXPO_PUBLIC_ELEVENLABS_API_KEY=your_key_here
3. Restart your development server`;

		Alert.alert('Environment Check', message);
		setResult(
			hasKey ? '✅ API Key found in environment' : '❌ API Key not found'
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>ElevenLabs Test</Text>

			<TouchableOpacity
				style={styles.button}
				onPress={checkEnvironment}
				disabled={testing}
			>
				<Text style={styles.buttonText}>Check Environment</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[styles.button, styles.testButton]}
				onPress={testConnection}
				disabled={testing}
			>
				<Text style={styles.buttonText}>
					{testing ? 'Testing...' : 'Test ElevenLabs Connection'}
				</Text>
			</TouchableOpacity>

			<Text style={styles.result}>{result}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		backgroundColor: '#f5f5f5',
		borderRadius: 10,
		margin: 20,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	button: {
		backgroundColor: '#007AFF',
		padding: 15,
		borderRadius: 8,
		marginBottom: 10,
	},
	testButton: {
		backgroundColor: '#34C759',
	},
	buttonText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: '600',
	},
	result: {
		marginTop: 20,
		padding: 10,
		backgroundColor: 'white',
		borderRadius: 5,
		fontFamily: 'monospace',
		fontSize: 12,
	},
});
