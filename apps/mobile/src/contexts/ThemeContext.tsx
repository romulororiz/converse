import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
	isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const [theme, setThemeState] = useState<Theme>('light');

	useEffect(() => {
		loadTheme();
	}, []);

	const loadTheme = async () => {
		try {
			const savedTheme = await AsyncStorage.getItem('theme');
			if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
				setThemeState(savedTheme);
			}
		} catch (error) {
			console.error('Error loading theme:', error);
		}
	};

	const setTheme = async (newTheme: Theme) => {
		try {
			setThemeState(newTheme);
			await AsyncStorage.setItem('theme', newTheme);
		} catch (error) {
			console.error('Error saving theme:', error);
		}
	};

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	const value: ThemeContextType = {
		theme,
		toggleTheme,
		setTheme,
		isDark: theme === 'dark',
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};
