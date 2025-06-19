import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Interactive Library Mobile</Text>
			<Text style={styles.subtitle}>Custom App is Working!</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f0f0f0',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
	},
});
