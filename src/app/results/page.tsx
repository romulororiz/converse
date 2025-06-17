'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiX } from 'react-icons/fi';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks } from '@/lib/db';
import type { Database } from '@/types/supabase';
import Image from 'next/image';

type BookMetadata = { topics?: string[] };

export default function ResultsPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const initialTags =
		searchParams.get('tags')?.split(',').filter(Boolean) || [];
	const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
	const [loading, setLoading] = useState(true);
	const [allBooks, setAllBooks] = useState<
		Database['public']['Tables']['books']['Row'][]
	>([]);
	const [recommendedBooks, setRecommendedBooks] = useState<
		Database['public']['Tables']['books']['Row'][]
	>([]);

	// Update URL when tags change
	useEffect(() => {
		router.replace(`/results?tags=${selectedTags.join(',')}`);
	}, [selectedTags, router]);

	useEffect(() => {
		setLoading(true);
		getBooks().then(data => {
			setAllBooks(data || []);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (!allBooks.length) return;
		setLoading(true);
		const filtered = allBooks.filter(book => {
			if (selectedTags.length === 0) return true;
			const meta = book.metadata as BookMetadata;
			const topics = Array.isArray(meta.topics) ? meta.topics : [];
			return topics.some((topic: string) => selectedTags.includes(topic));
		});
		setRecommendedBooks(filtered);
		setLoading(false);
	}, [selectedTags, allBooks]);

	const removeTag = (tag: string) => {
		setSelectedTags(prev => prev.filter(t => t !== tag));
	};

	return (
		<div className='max-w-6xl mx-auto px-4 py-8'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='mb-6'
			>
				<h1 className='text-3xl font-bold mb-2'>Recommended Books</h1>
				<p className='text-muted-foreground mb-4'>Based on your interests:</p>
				<div className='flex flex-wrap gap-2 mb-2'>
					{selectedTags.map(tag => (
						<span
							key={tag}
							className='flex items-center bg-secondary text-foreground px-3 py-1 rounded-full text-sm font-medium shadow-sm hover:bg-card transition cursor-pointer'
							onClick={() => removeTag(tag)}
						>
							{tag}
							<FiX className='ml-2 text-muted-foreground hover:text-foreground' />
						</span>
					))}
					{selectedTags.length === 0 && (
						<span className='text-muted-foreground text-sm'>
							No tags selected
						</span>
					)}
				</div>
			</motion.div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{loading
					? Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className='bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full p-4'
							>
								{/* Image skeleton */}
								<Skeleton className='w-full aspect-[3/4] max-h-64 mb-4' />
								{/* Title and author skeletons */}
								<Skeleton className='h-6 w-2/3 mb-2' />
								<Skeleton className='h-4 w-1/3 mb-4' />
								{/* Description skeleton */}
								<Skeleton className='h-4 w-full mb-1' />
								<Skeleton className='h-4 w-5/6 mb-1' />
								<Skeleton className='h-4 w-2/3 mb-4' />
								{/* Tag skeletons */}
								<div className='flex flex-wrap gap-2 mb-4'>
									<Skeleton className='h-6 w-24 rounded-full' />
									<Skeleton className='h-6 w-20 rounded-full' />
									<Skeleton className='h-6 w-20 rounded-full' />
								</div>
								{/* Button skeletons */}
								<div className='mt-auto flex gap-2'>
									<Skeleton className='h-10 w-36 rounded-lg' />
									<Skeleton className='h-10 w-28 rounded-lg' />
								</div>
							</div>
					  ))
					: recommendedBooks.map((book, index) => (
							<motion.div
								key={book.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.08 }}
								className='bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full cursor-pointer'
								style={{ minHeight: 0 }}
							>
								<div className='w-full aspect-[3/4] max-h-64 bg-secondary relative flex items-center justify-center'>
									{book.cover_url ? (
										<Image
											src={book.cover_url}
											alt={book.title}
											width={150}
											height={200}
											className='object-cover w-full h-full'
											style={{ maxHeight: '16rem' }}
										/>
									) : (
										<FiBook size={48} className='text-muted-foreground' />
									)}
								</div>
								<div className='p-4 flex flex-col flex-1'>
									<h2 className='text-lg font-bold mb-1 line-clamp-2'>
										{book.title}
									</h2>
									<p className='text-muted-foreground mb-2 text-sm'>
										by {book.author}
									</p>
									<p className='text-foreground mb-3 text-sm line-clamp-3'>
										{book.description}
									</p>
									<div className='flex flex-wrap gap-2 mb-4'>
										{((book.metadata as BookMetadata)?.topics || []).map(
											(topic: string) => (
												<span
													key={topic}
													className='px-3 py-1 bg-secondary text-muted-foreground rounded-full text-xs'
												>
													{topic}
												</span>
											)
										)}
									</div>
									<div className='mt-auto flex gap-2'>
										<button
											className='flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition text-sm shadow cursor-pointer'
											onClick={() => router.push(`/chat/${book.id}`)}
										>
											Talk to the Book
										</button>
										<button
											className='flex-1 py-2 rounded-lg bg-secondary text-foreground font-medium hover:bg-card transition text-sm shadow cursor-pointer'
											// onClick={() => ...} // Implement journal/insights navigation later
										>
											Journal
										</button>
									</div>
								</div>
							</motion.div>
					  ))}
			</div>

			{recommendedBooks.length === 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className='text-center py-12'
				>
					<p className='text-muted-foreground'>
						No books found matching your selected interests. Try selecting
						different topics.
					</p>
				</motion.div>
			)}
		</div>
	);
}
