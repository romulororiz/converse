// Color palette matching the web app's design system
export const colors = {
	// Light theme colors
	light: {
		background: '#f8f6f2',
		foreground: '#322e28',
		card: '#f3efe7',
		cardForeground: '#322e28',
		popover: '#f3efe7',
		popoverForeground: '#322e28',
		primary: '#645846',
		primaryForeground: '#f8f6f2',
		secondary: '#e6e1d3',
		secondaryForeground: '#322e28',
		muted: '#e6e1d3',
		mutedForeground: '#8b8578',
		accent: '#b6aa97',
		accentForeground: '#f8f6f2',
		destructive: '#d97a7a',
		border: '#dcd9d3',
		input: '#e0ddd6',
		ring: '#b6aa97',
		sidebar: '#f3efe7',
		sidebarForeground: '#322e28',
		sidebarPrimary: '#b6aa97',
		sidebarPrimaryForeground: '#f8f6f2',
		sidebarAccent: '#e6e1d3',
		sidebarAccentForeground: '#322e28',
		sidebarBorder: '#e0ddd6',
		sidebarRing: '#b6aa97',
		success: '#76b900',
	},
	// Dark theme colors
	dark: {
		background: '#23201b',
		foreground: '#f8f6f2',
		card: '#2c2923',
		cardForeground: '#f8f6f2',
		popover: '#2c2923',
		popoverForeground: '#f8f6f2',
		primary: '#b6aa97',
		primaryForeground: '#23201b',
		secondary: '#322e28',
		secondaryForeground: '#f8f6f2',
		muted: '#322e28',
		mutedForeground: '#b6aa97',
		accent: '#b6aa97',
		accentForeground: '#23201b',
		destructive: '#d97a7a',
		border: '#39352d',
		input: '#39352d',
		ring: '#b6aa97',
		sidebar: '#2c2923',
		sidebarForeground: '#f8f6f2',
		sidebarPrimary: '#b6aa97',
		sidebarPrimaryForeground: '#23201b',
		sidebarAccent: '#322e28',
		sidebarAccentForeground: '#f8f6f2',
		sidebarBorder: '#39352d',
		sidebarRing: '#b6aa97',
	},
	// Chart colors
	chart: {
		chart1: 'oklch(0.646 0.222 41.116)',
		chart2: 'oklch(0.6 0.118 184.704)',
		chart3: 'oklch(0.398 0.07 227.392)',
		chart4: 'oklch(0.828 0.189 84.429)',
		chart5: 'oklch(0.769 0.188 70.08)',
	},
	// Chart colors for dark mode
	chartDark: {
		chart1: 'oklch(0.488 0.243 264.376)',
		chart2: 'oklch(0.696 0.17 162.48)',
		chart3: 'oklch(0.769 0.188 70.08)',
		chart4: 'oklch(0.627 0.265 303.9)',
		chart5: 'oklch(0.645 0.246 16.439)',
	},
};

// Helper function to get colors based on theme
export const getColors = (isDark: boolean = false) => {
	return isDark ? colors.dark : colors.light;
};

// Common color combinations
export const colorSchemes = {
	primary: {
		main: colors.light.primary,
		text: colors.light.primaryForeground,
		background: colors.light.background,
	},
	secondary: {
		main: colors.light.secondary,
		text: colors.light.secondaryForeground,
	},
	accent: {
		main: colors.light.accent,
		text: colors.light.accentForeground,
	},
	muted: {
		main: colors.light.muted,
		text: colors.light.mutedForeground,
	},
};
