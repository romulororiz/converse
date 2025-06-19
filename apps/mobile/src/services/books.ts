import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type BookRow = Database['public']['Tables']['books']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];

export interface Book extends BookRow {
	author?: AuthorRow;
}

export async function getFeaturedBooks(limit: number = 6): Promise<Book[]> {
	try {
		console.log('Fetching featured books...');
		console.log('Supabase client:', supabase);

		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*,
				book_authors (
					authors (*)
				)
			`
			)
			.limit(limit)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching featured books:', error);
			return [];
		}

		console.log('Raw books data:', data);
		console.log('Number of books found:', data?.length || 0);

		// Transform the data to match our Book interface
		const books =
			data?.map(book => ({
				...book,
				author: book.book_authors?.[0]?.authors,
			})) || [];

		console.log('Transformed books:', books);
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
				book_authors!inner (
					authors (*)
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
				author: book.book_authors?.[0]?.authors,
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
				book_authors!inner (
					authors (*)
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
				author: book.book_authors?.[0]?.authors,
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
				book_authors!inner (
					authors (*)
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
				book_authors!inner (
					books (*)
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
					author.book_authors?.map(ba => ({
						...ba.books,
						author: author,
					}))
				)
				.filter(Boolean) || [];

		const books = [
			...(bookData || []).map(book => ({
				...book,
				author: book.book_authors?.[0]?.authors,
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
				book_authors!inner (
					authors (*)
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
			author: data.book_authors?.[0]?.authors || null,
		};
	} catch (error) {
		console.error('Error fetching book:', error);
		throw error;
	}
}

export async function checkBooksExist(): Promise<boolean> {
	try {
		const { data, error } = await supabase.from('books').select('id').limit(1);

		if (error) {
			console.error('Error checking books:', error);
			return false;
		}

		console.log('Books exist check:', data);
		return data && data.length > 0;
	} catch (error) {
		console.error('Error checking books:', error);
		return false;
	}
}
