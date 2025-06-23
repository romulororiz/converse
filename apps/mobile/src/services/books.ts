import { supabase } from '../lib/supabase';
import { Book } from '../types/supabase';

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
			.select('*')
			.contains('categories', [category])
			.order('title', { ascending: true });

		if (error) {
			console.error('Error fetching books by category:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error fetching books by category:', error);
		return [];
	}
}

export async function searchBooks(query: string): Promise<Book[]> {
	try {
		// Search books by title, author, or description
		const { data, error } = await supabase
			.from('books')
			.select('*')
			.or(
				`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`
			)
			.order('title', { ascending: true });

		if (error) {
			console.error('Error searching books:', error);
			return [];
		}

		return data || [];
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
