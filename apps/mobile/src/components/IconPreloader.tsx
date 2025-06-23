import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconPreloaderProps = {
	icons: Array<keyof typeof Ionicons.glyphMap>;
	size?: number;
	color?: string;
};

export const IconPreloader: React.FC<IconPreloaderProps> = ({
	icons,
	size = 1,
	color = 'transparent',
}) => {
	return (
		<View style={styles.container}>
			{icons.map((iconName, index) => (
				<Ionicons
					key={index}
					name={iconName}
					size={size}
					color={color}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		opacity: 0,
		pointerEvents: 'none',
		top: -1000,
		left: -1000,
	},
}); 