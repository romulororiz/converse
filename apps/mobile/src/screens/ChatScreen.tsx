import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

export default function ChatScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Chat</Text>
			<Text style={styles.subtitle}>Chat with AI about books</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.light.background,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		color: colors.light.foreground,
	},
	subtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
	},
});
