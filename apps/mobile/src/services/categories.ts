import { supabase } from '../lib/supabase';

export type Category = {
	name: string;
	count: number;
	icon: string;
	description: string;
	color: string;
};

export const getCategoriesWithCounts = async (): Promise<Category[]> => {
	try {
		// Query to get all categories with their book counts
		const { data: books, error } = await supabase
			.from('books')
			.select('categories');

		if (error) {
			console.error('Error fetching categories:', error);
			throw error;
		}

		console.log(
			'🔍 Sample book categories structure (first 5 books):',
			books?.slice(0, 5).map(book => ({
				categories: book.categories,
				type: typeof book.categories,
				isArray: Array.isArray(book.categories),
			}))
		);

		// Count occurrences of each category
		const categoryCounts: { [key: string]: number } = {};

		books?.forEach(book => {
			if (book.categories && Array.isArray(book.categories)) {
				book.categories.forEach((category: string) => {
					categoryCounts[category] = (categoryCounts[category] || 0) + 1;
				});
			}
		});

		console.log(
			'🔍 Category counts:',
			Object.entries(categoryCounts).slice(0, 10)
		);

		// Define category metadata with popularity-based ordering
		const categoryMetadata: {
			[key: string]: {
				icon: string;
				description: string;
				color: string;
				priority: number;
			};
		} = {
			Romance: {
				icon: 'heart',
				description: 'Love stories and relationships from classic authors',
				color: '#FF6B6B',
				priority: 1,
			},
			'Classic Literature': {
				icon: 'library',
				description: 'Timeless works from renowned authors',
				color: '#4ECDC4',
				priority: 2,
			},
			'Mystery & Detective': {
				icon: 'search',
				description: 'Puzzles, crimes, and suspenseful investigations',
				color: '#45B7D1',
				priority: 3,
			},
			Adventure: {
				icon: 'map',
				description: 'Thrilling journeys and exciting escapades',
				color: '#96CEB4',
				priority: 4,
			},
			'Science Fiction': {
				icon: 'rocket',
				description: 'Futuristic and speculative stories',
				color: '#A8E6CF',
				priority: 5,
			},
			'Gothic & Horror': {
				icon: 'skull',
				description: 'Dark tales of suspense and supernatural',
				color: '#FF8B94',
				priority: 6,
			},
			'Historical Fiction': {
				icon: 'time',
				description: 'Stories set in past eras and civilizations',
				color: '#F4A261',
				priority: 7,
			},
			Philosophy: {
				icon: 'bulb',
				description: 'Wisdom and deep thinking from great minds',
				color: '#E76F51',
				priority: 8,
			},
			"Children's Literature": {
				icon: 'happy',
				description: 'Delightful stories for young readers',
				color: '#FFEAA7',
				priority: 9,
			},
			Fantasy: {
				icon: 'sparkles',
				description: 'Magical and mythical worlds',
				color: '#DDA0DD',
				priority: 10,
			},
			'Drama & Theater': {
				icon: 'videocam',
				description: 'Classic plays and theatrical works',
				color: '#87CEEB',
				priority: 11,
			},
			'Religious & Spiritual': {
				icon: 'star',
				description: 'Sacred texts and spiritual guidance',
				color: '#D4AF37',
				priority: 12,
			},
			'Self-Help': {
				icon: 'trending-up',
				description: 'Personal development and growth',
				color: '#2A9D8F',
				priority: 13,
			},
			'Political Science': {
				icon: 'flag',
				description: 'Political theory and governance',
				color: '#B19CD9',
				priority: 14,
			},
			'Military Strategy': {
				icon: 'shield',
				description: 'Strategic thinking and warfare',
				color: '#8B4513',
				priority: 15,
			},
			'Social Fiction': {
				icon: 'people',
				description: 'Stories exploring social issues',
				color: '#20B2AA',
				priority: 16,
			},
			'Psychological Fiction': {
				icon: 'eye',
				description: 'Deep psychological character studies',
				color: '#9370DB',
				priority: 17,
			},
			Satire: {
				icon: 'happy-outline',
				description: 'Witty criticism through humor',
				color: '#FFD700',
				priority: 18,
			},
			'Family Saga': {
				icon: 'home',
				description: 'Multi-generational family stories',
				color: '#CD853F',
				priority: 19,
			},
			Nature: {
				icon: 'leaf',
				description: 'Stories celebrating the natural world',
				color: '#228B22',
				priority: 20,
			},
		};

		// Convert to array and sort by popularity priority, then by book count
		const categories: Category[] = Object.entries(categoryCounts)
			.map(([name, count]) => ({
				name,
				count,
				icon: categoryMetadata[name]?.icon || 'book',
				description:
					categoryMetadata[name]?.description || 'Classic literature',
				color: categoryMetadata[name]?.color || '#6C757D',
				priority: categoryMetadata[name]?.priority || 999,
			}))
			.sort((a, b) => {
				// First sort by priority (popularity), then by count for ties
				if (a.priority !== b.priority) {
					return a.priority - b.priority;
				}
				return b.count - a.count;
			});

		console.log('🔍 Final categories array (first 5):', categories.slice(0, 5));

		return categories;
	} catch (error) {
		console.error('Error in getCategoriesWithCounts:', error);
		throw error;
	}
};

export const searchBooksByCategory = async (category: string) => {
	try {
		console.log('🔍 searchBooksByCategory called with:', category);

		// First try with contains
		let { data, error } = await supabase
			.from('books')
			.select('*')
			.contains('categories', [category]);

		if (error) {
			console.error('❌ Error with contains query:', error);
			// Try alternative approach with overlaps
			console.log('🔄 Trying alternative overlaps query...');
			const result = await supabase
				.from('books')
				.select('*')
				.overlaps('categories', [category]);

			data = result.data;
			error = result.error;
		}

		if (error) {
			console.error('❌ Error with overlaps query:', error);
			// Fallback: get all books and filter client-side
			console.log('🔄 Fallback: filtering client-side...');
			const allBooksResult = await supabase.from('books').select('*');

			if (allBooksResult.error) {
				console.error('❌ Error getting all books:', allBooksResult.error);
				throw allBooksResult.error;
			}

			// Filter client-side
			data =
				allBooksResult.data?.filter(
					book =>
						book.categories &&
						Array.isArray(book.categories) &&
						book.categories.includes(category)
				) || [];

			console.log('✅ Client-side filtering results:', data.length, 'books');
		}

		console.log(
			'✅ searchBooksByCategory results for',
			category,
			':',
			data?.length || 0,
			'books'
		);
		console.log(
			'🔍 Sample book categories (first 3):',
			data?.slice(0, 3).map(book => ({
				id: book.id,
				title: book.title,
				categories: book.categories,
			}))
		);

		return data || [];
	} catch (error) {
		console.error('❌ Error in searchBooksByCategory:', error);
		throw error;
	}
};

export const searchBooksByCategorySimple = async (category: string) => {
	try {
		console.log('🔍 searchBooksByCategorySimple called with:', category);

		// Get all books and filter client-side (simple approach)
		const { data: allBooks, error } = await supabase.from('books').select('*');

		if (error) {
			console.error('❌ Error getting all books:', error);
			throw error;
		}

		// Filter client-side
		const filteredBooks =
			allBooks?.filter(book => {
				const hasCategory =
					book.categories &&
					Array.isArray(book.categories) &&
					book.categories.includes(category);

				if (hasCategory) {
					console.log(
						'✅ Book matches category:',
						book.title,
						'categories:',
						book.categories
					);
				}

				return hasCategory;
			}) || [];

		console.log(
			'✅ searchBooksByCategorySimple results for',
			category,
			':',
			filteredBooks.length,
			'books'
		);

		return filteredBooks;
	} catch (error) {
		console.error('❌ Error in searchBooksByCategorySimple:', error);
		throw error;
	}
};
