import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type BookRow = Database['public']['Tables']['books']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];

export interface Book extends BookRow {
	author?: AuthorRow;
}

export async function getFeaturedBooks(limit: number = 6): Promise<Book[]> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*,
				book_authors (
					author: authors (*)
				)
			`
			)
			.limit(limit)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching featured books:', error);
			return [];
		}

		console.log('Raw book data:', JSON.stringify(data, null, 2));

		// Transform the data to match our Book interface
		const books =
			data?.map(book => {
				console.log(
					'Processing book:',
					book.title,
					'book_authors:',
					book.book_authors
				);
				return {
					...book,
					author: book.book_authors?.[0]?.author || null,
				};
			}) || [];

		console.log(
			'Transformed books:',
			books.map(b => ({ title: b.title, author: b.author?.name || 'Unknown' }))
		);

		return books;
	} catch (error) {
		console.error('Error fetching featured books:', error);
		return [];
	}
}

export async function getAllBooks(): Promise<Book[]> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*,
				book_authors (
					author: authors (*)
				)
			`
			)
			.order('title', { ascending: true });

		if (error) {
			console.error('Error fetching all books:', error);
			return [];
		}

		// Transform the data to match our Book interface
		const books =
			data?.map(book => ({
				...book,
				author: book.book_authors?.[0]?.author,
			})) || [];

		return books;
	} catch (error) {
		console.error('Error fetching all books:', error);
		return [];
	}
}

export async function getBooksByCategory(category: string): Promise<Book[]> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*,
				book_authors (
					author: authors (*)
				)
			`
			)
			.contains('metadata->>categories', [category])
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching books by category:', error);
			return [];
		}

		// Transform the data to match our Book interface
		const books =
			data?.map(book => ({
				...book,
				author: book.book_authors?.[0]?.author,
			})) || [];

		return books;
	} catch (error) {
		console.error('Error fetching books by category:', error);
		return [];
	}
}

export async function searchBooks(query: string): Promise<Book[]> {
	try {
		const { data: bookData, error: bookError } = await supabase
			.from('books')
			.select(
				`
				*,
				book_authors (
					author: authors (*)
				)
			`
			)
			.or(`title.ilike.%${query}%`)
			.order('created_at', { ascending: false });

		if (bookError) {
			console.error('Error searching books:', bookError);
			return [];
		}

		// Also search in authors
		const { data: authorData, error: authorError } = await supabase
			.from('authors')
			.select(
				`
				books:book_authors (
					book:books (*)
				)
			`
			)
			.ilike('name', `%${query}%`);

		if (authorError) {
			console.error('Error searching authors:', authorError);
			return [];
		}

		// Combine and deduplicate results
		const authorBooks =
			authorData
				?.flatMap(author =>
					author.books?.map(ba => ({
						...ba.book,
						author: author,
					}))
				)
				.filter(Boolean) || [];

		const books = [
			...(bookData || []).map(book => ({
				...book,
				author: book.book_authors?.[0]?.author,
			})),
			...authorBooks,
		];

		// Remove duplicates
		const uniqueBooks = Array.from(
			new Map(books.map(book => [book.id, book])).values()
		);

		return uniqueBooks;
	} catch (error) {
		console.error('Error searching books:', error);
		return [];
	}
}

export async function getBookById(bookId: string): Promise<Book> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*,
				book_authors (
					author: authors (*)
				)
			`
			)
			.eq('id', bookId)
			.single();

		if (error) {
			console.error('Error fetching book:', error);
			throw error;
		}

		// Transform the data to match our Book interface
		return {
			...data,
			author: data.book_authors?.[0]?.author || null,
		};
	} catch (error) {
		console.error('Error fetching book:', error);
		throw error;
	}
}

export async function checkAndPopulateDatabase(): Promise<void> {
	try {
		// Check if we have any books
		const { data: books, error: booksError } = await supabase
			.from('books')
			.select('*')
			.limit(1);

		if (booksError) {
			console.error('Error checking books:', booksError);
			return;
		}

		if (!books || books.length === 0) {
			console.log('No books found, populating with sample data...');
			await populateSampleData();
		} else {
			console.log('Books found:', books.length);
		}

		// Check if we have any authors
		const { data: authors, error: authorsError } = await supabase
			.from('authors')
			.select('*')
			.limit(1);

		if (authorsError) {
			console.error('Error checking authors:', authorsError);
			return;
		}

		if (!authors || authors.length === 0) {
			console.log('No authors found, populating with sample data...');
			await populateSampleAuthors();
		} else {
			console.log('Authors found:', authors.length);
		}
	} catch (error) {
		console.error('Error checking database:', error);
	}
}

async function populateSampleAuthors(): Promise<void> {
	const sampleAuthors = [
		{
			name: 'Jane Austen',
			bio: 'English novelist known for her romantic fiction',
		},
		{
			name: 'Mary Shelley',
			bio: 'English novelist best known for Frankenstein',
		},
		{ name: 'Lewis Carroll', bio: 'English writer and mathematician' },
		{ name: 'Bram Stoker', bio: 'Irish author best known for Dracula' },
		{ name: 'Arthur Conan Doyle', bio: 'British writer and physician' },
		{ name: 'Charlotte Brontë', bio: 'English novelist and poet' },
	];

	for (const author of sampleAuthors) {
		const { error } = await supabase.from('authors').insert(author);

		if (error) {
			console.error('Error inserting author:', error);
		}
	}
}

async function populateSampleData(): Promise<void> {
	const sampleBooks = [
		{
			title: 'Pride and Prejudice',
			description: 'A romantic novel of manners that follows Elizabeth Bennet.',
			cover_url: 'https://covers.openlibrary.org/b/id/10523338-L.jpg',
			metadata: {
				rating: 4.8,
				year: 1813,
				pages: 432,
				categories: ['Romance', 'Classic Literature'],
			},
		},
		{
			title: 'Frankenstein',
			description: 'A Gothic novel about Victor Frankenstein and his creation.',
			cover_url: 'https://covers.openlibrary.org/b/id/8228691-L.jpg',
			metadata: {
				rating: 4.6,
				year: 1818,
				pages: 280,
				categories: ['Gothic Fiction', 'Science Fiction'],
			},
		},
		{
			title: "Alice's Adventures in Wonderland",
			description: 'A novel about Alice who falls through a rabbit hole.',
			cover_url: 'https://covers.openlibrary.org/b/id/10958382-L.jpg',
			metadata: {
				rating: 4.7,
				year: 1865,
				pages: 192,
				categories: ['Fantasy', "Children's Literature"],
			},
		},
	];

	for (const book of sampleBooks) {
		const { data: insertedBook, error: bookError } = await supabase
			.from('books')
			.insert(book)
			.select()
			.single();

		if (bookError) {
			console.error('Error inserting book:', bookError);
			continue;
		}

		// Find the corresponding author
		let authorName = '';
		if (book.title === 'Pride and Prejudice') authorName = 'Jane Austen';
		else if (book.title === 'Frankenstein') authorName = 'Mary Shelley';
		else if (book.title === "Alice's Adventures in Wonderland")
			authorName = 'Lewis Carroll';

		if (authorName) {
			const { data: author, error: authorError } = await supabase
				.from('authors')
				.select('id')
				.eq('name', authorName)
				.single();

			if (author && !authorError) {
				// Create the book-author relationship
				await supabase.from('book_authors').insert({
					book_id: insertedBook.id,
					author_id: author.id,
				});
			}
		}
	}
}
