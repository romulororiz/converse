import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { Book } from '../types/supabase';

type BookRow = Database['public']['Tables']['books']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];

export async function getFeaturedBooks(limit: number = 6): Promise<Book[]> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*
			`
			)
			.limit(limit)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching featured books:', error);
			return [];
		}

		return data;
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
				*
			`
			)
			.order('title', { ascending: true });

		if (error) {
			console.error('Error fetching all books:', error);
			return [];
		}

		return data;
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
				*
			`
			)
			.contains('metadata->>categories', [category])
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching books by category:', error);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Error fetching books by category:', error);
		return [];
	}
}

export async function searchBooks(query: string): Promise<Book[]> {
	try {
		// Search books by title or direct author field
		const { data: directBooks, error: directError } = await supabase
			.from('books')
			.select('*')
			.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
			.order('created_at', { ascending: false });

		if (directError) {
			console.error('Error searching books directly:', directError);
		}

		// Search books through the book_authors relationship
		const { data: authorBooks, error: authorError } = await supabase
			.from('book_authors')
			.select(
				`
				books (*),
				authors (*)
			`
			)
			.or(`authors.full_name.ilike.%${query}%`);

		if (authorError) {
			console.error('Error searching books by authors:', authorError);
		}

		// Combine results
		const allBooks: Book[] = [];

		// Add direct search results
		if (directBooks) {
			allBooks.push(...directBooks);
		}

		// Add books found through author relationships
		if (authorBooks) {
			const booksFromAuthors = authorBooks
				.map((item: any) => item.books)
				.filter((book: any) => book !== null) as Book[];
			allBooks.push(...booksFromAuthors);
		}

		// Remove duplicates based on book ID and sort by created_at
		const uniqueBooks = [
			...new Map(allBooks.map(item => [item.id, item])).values(),
		].sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);

		return uniqueBooks;
	} catch (error) {
		console.error('Error searching books:', error);
		return [];
	}
}

export async function getBookById(bookId: string): Promise<Book | null> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select(
				`
				*
			`
			)
			.eq('id', bookId)
			.single();

		if (error) {
			console.error('Error fetching book:', error);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error in getBookById:', error);
		return null;
	}
}
