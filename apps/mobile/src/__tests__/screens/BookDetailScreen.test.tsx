import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BookDetailScreen from '../../screens/BookDetailScreen';
import { getBookById } from '../../services/books';

// Mock the services
jest.mock('../../services/books');
jest.mock('../../components/LoadingState', () => ({
	LoadingState: ({ text }: { text: string }) => <div>Loading: {text}</div>,
}));
jest.mock('../../components/EmptyState', () => ({
	EmptyState: ({ title, subtitle }: { title: string; subtitle: string }) => (
		<div>
			Empty: {title} - {subtitle}
		</div>
	),
}));

const Stack = createStackNavigator();

const TestNavigator = ({ bookId }: { bookId: string }) => (
	<NavigationContainer>
		<Stack.Navigator>
			<Stack.Screen
				name="BookDetail"
				component={BookDetailScreen}
				initialParams={{ bookId }}
			/>
		</Stack.Navigator>
	</NavigationContainer>
);

describe('BookDetailScreen', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows loading state initially', () => {
		const mockGetBookById = getBookById as jest.MockedFunction<
			typeof getBookById
		>;
		mockGetBookById.mockImplementation(() => new Promise(() => {})); // Never resolves

		const { getByText } = render(<TestNavigator bookId="test-id" />);

		expect(getByText('Loading: Loading book details...')).toBeTruthy();
	});

	it('shows book details when loaded successfully', async () => {
		const mockBook = {
			id: 'test-id',
			title: 'Test Book',
			author: 'Test Author',
			description: 'Test description',
			cover_url: 'https://example.com/cover.jpg',
			year: 2023,
			metadata: {
				rating: 4.5,
				pages: 300,
				language: 'English',
				genres: ['Fiction', 'Adventure'],
			},
			created_at: '2023-01-01',
			updated_at: '2023-01-01',
		};

		const mockGetBookById = getBookById as jest.MockedFunction<
			typeof getBookById
		>;
		mockGetBookById.mockResolvedValue(mockBook);

		const { getByText } = render(<TestNavigator bookId="test-id" />);

		await waitFor(() => {
			expect(getByText('Test Book')).toBeTruthy();
			expect(getByText('by Test Author')).toBeTruthy();
			expect(getByText('Test description')).toBeTruthy();
			expect(getByText('4.5/5.0')).toBeTruthy();
			expect(getByText('2023')).toBeTruthy();
			expect(getByText('300 pages')).toBeTruthy();
			expect(getByText('English')).toBeTruthy();
			expect(getByText('Fiction, Adventure')).toBeTruthy();
		});
	});

	it('shows error state when book not found', async () => {
		const mockGetBookById = getBookById as jest.MockedFunction<
			typeof getBookById
		>;
		mockGetBookById.mockResolvedValue(null);

		const { getByText } = render(<TestNavigator bookId="invalid-id" />);

		await waitFor(() => {
			expect(
				getByText(
					"Empty: Book Not Found - We couldn't find the book you're looking for"
				)
			).toBeTruthy();
		});
	});

	it('shows error state when API fails', async () => {
		const mockGetBookById = getBookById as jest.MockedFunction<
			typeof getBookById
		>;
		mockGetBookById.mockRejectedValue(new Error('API Error'));

		const { getByText } = render(<TestNavigator bookId="test-id" />);

		await waitFor(() => {
			expect(
				getByText('Empty: Book Not Found - Failed to load book details')
			).toBeTruthy();
		});
	});
});
