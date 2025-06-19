// API Configuration
export const API_CONFIG = {
	// Change this to your web app URL when deploying
	BASE_URL: __DEV__
		? 'http://localhost:3000/api' // Development
		: 'https://your-web-app-domain.com/api', // Production
};

// You can also add other API-related configurations here
export const API_ENDPOINTS = {
	CHATS: '/chats',
	MESSAGES: '/messages',
	BOOKS: '/books',
} as const;
