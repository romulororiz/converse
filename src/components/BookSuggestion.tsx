'use client';

import { useState } from 'react';
import { Book } from '../data/books';
import { BookMatcher } from '../services/bookMatcher';
import { books } from '../data/books';

export default function BookSuggestion() {
	const [userInput, setUserInput] = useState('');
	const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const matches = BookMatcher.findMatchingBooks(userInput, books);
		setSuggestedBooks(matches);
	};

	return (
		<div className='max-w-4xl mx-auto p-6'>
			<form onSubmit={handleSubmit} className='mb-8'>
				<div className='mb-4'>
					<label
						htmlFor='userInput'
						className='block text-lg font-medium text-gray-700 mb-2'
					>
						Conte-nos sobre o que você está passando ou o que gostaria de
						explorar:
					</label>
					<textarea
						id='userInput'
						value={userInput}
						onChange={e => setUserInput(e.target.value)}
						className='w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						placeholder='Por exemplo: Estou me sentindo ansioso com minha carreira e gostaria de encontrar mais propósito...'
					/>
				</div>
				<button
					type='submit'
					className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
				>
					Encontrar Livros
				</button>
			</form>

			{suggestedBooks.length > 0 && (
				<div className='space-y-6'>
					<h2 className='text-2xl font-bold text-gray-800'>
						Livros Recomendados
					</h2>
					<div className='grid gap-6 md:grid-cols-2'>
						{suggestedBooks.map(book => (
							<div
								key={book.id}
								className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'
							>
								<h3 className='text-xl font-semibold text-gray-800 mb-2'>
									{book.title}
								</h3>
								<p className='text-gray-600 mb-2'>por {book.author}</p>
								<p className='text-gray-700 mb-4'>{book.description}</p>
								<div className='flex flex-wrap gap-2'>
									{book.topics.map(topic => (
										<span
											key={topic}
											className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm'
										>
											{topic}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
