import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

export default function HomeScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Interactive Library</Text>
			<Text style={styles.subtitle}>Welcome to your mobile app!</Text>
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
