import { supabase } from '../lib/supabase';

export interface Book {
	id: string;
	title: string;
	author: string;
	description: string;
	coverImage: string;
	topics: string[];
	rating: number;
	year: number;
	pages: number;
	language: string;
	isbn: string;
	publisher: string;
	price: number;
	currency: string;
	availableFormats: string[];
	bestseller: boolean;
	awards?: string[];
	quotes?: string[];
}

export async function getFeaturedBooks(limit: number = 6): Promise<Book[]> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select('*')
			.eq('bestseller', true)
			.limit(limit)
			.order('rating', { ascending: false });

		if (error) {
			console.error('Error fetching featured books:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error fetching featured books:', error);
		return [];
	}
}

export async function getAllBooks(): Promise<Book[]> {
	try {
		const { data, error } = await supabase
			.from('books')
			.select('*')
			.order('title', { ascending: true });

		if (error) {
			console.error('Error fetching all books:', error);
			return [];
		}

		return data || [];
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
			.contains('topics', [category])
			.order('rating', { ascending: false });

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
		const { data, error } = await supabase
			.from('books')
			.select('*')
			.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
			.order('rating', { ascending: false });

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
