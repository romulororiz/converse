/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/**/*.{js,jsx,ts,tsx}',
		'./App.{js,jsx,ts,tsx}',
		'./app/**/*.{js,jsx,ts,tsx}',
	],
  theme: {
		extend: {
			colors: {
				// Custom colors will be added here later
				primary: '#645846',
				secondary: '#e6e1d3',
				background: '#f8f6f2',
				foreground: '#322e28',
				card: '#f3efe7',
				muted: '#e6e1d3',
				'muted-foreground': '#8b8578',
				accent: '#b6aa97',
				destructive: '#d97a7a',
				border: '#e0ddd6',
			},
		},
  },
  plugins: [],
};
