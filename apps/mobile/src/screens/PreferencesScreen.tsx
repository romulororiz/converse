import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PreferencesScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Preferences</Text>
			<Text style={styles.subtitle}>Customize your reading experience</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
	},
});
