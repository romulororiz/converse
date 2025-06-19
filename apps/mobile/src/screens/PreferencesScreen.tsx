import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

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
