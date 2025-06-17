'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiBook, FiClock, FiMessageSquare } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Chat = Database['public']['Tables']['chat_sessions']['Row'] & {
	books?: {
		title: string;
		cover_url: string | null;
	};
};

export default function ChatsPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [chats, setChats] = useState<Chat[]>([]);
	const [loading, setLoading] = useState(true);
	const user = useAuthStore(state => state.user);

	useEffect(() => {
		if (!user?.id) return;

		const fetchChats = async () => {
			try {
				setLoading(true);
				const { data, error } = await supabase
					.from('chat_sessions')
					.select('*, books(title, cover_url)')
					.eq('user_id', user.id)
					.order('updated_at', { ascending: false });

				if (error) throw error;
				setChats(data || []);
			} catch (error) {
				console.error('Error fetching chats:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchChats();

		// Subscribe to real-time updates
		const channel = supabase
			.channel('chat_sessions')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'chat_sessions',
					filter: `user_id=eq.${user.id}`,
				},
				payload => {
					if (payload.eventType === 'INSERT') {
						setChats(prev => [payload.new as Chat, ...prev]);
					} else if (payload.eventType === 'UPDATE') {
						setChats(prev =>
							prev.map(chat =>
								chat.id === payload.new.id ? (payload.new as Chat) : chat
							)
						);
					} else if (payload.eventType === 'DELETE') {
						setChats(prev => prev.filter(chat => chat.id !== payload.old.id));
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id]);

	const filteredChats = chats.filter(chat => {
		const title = chat.books?.title || '';
		return title.toLowerCase().includes(searchQuery.toLowerCase());
	});

	if (!user) {
		return (
			<div className='flex flex-col items-center justify-center h-[50vh] text-center'>
				<FiMessageSquare className='w-12 h-12 text-muted-foreground mb-4' />
				<h3 className='text-xl font-semibold mb-2'>Please sign in</h3>
				<p className='text-muted-foreground max-w-md'>
					Sign in to view your conversations
				</p>
			</div>
		);
	}

	return (
		<div className='w-full max-w-7xl mx-auto p-4 space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold'>Your Conversations</h1>
					<p className='text-muted-foreground mt-1'>
						Continue your literary journey
					</p>
				</div>
				<div className='relative w-full sm:w-72'>
					<FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground' />
					<Input
						type='text'
						placeholder='Search conversations...'
						value={searchQuery}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setSearchQuery(e.target.value)
						}
						className='pl-10 w-full'
					/>
				</div>
			</div>

			<ScrollArea className='h-[calc(100vh-12rem)]'>
				{loading ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{[...Array(6)].map((_, i) => (
							<div key={i} className='animate-pulse'>
								<div className='h-48 rounded-xl bg-muted' />
							</div>
						))}
					</div>
				) : filteredChats.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-[50vh] text-center'>
						<FiMessageSquare className='w-12 h-12 text-muted-foreground mb-4' />
						<h3 className='text-xl font-semibold mb-2'>No conversations yet</h3>
						<p className='text-muted-foreground max-w-md'>
							Start a new conversation by selecting a book from your library
						</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{filteredChats.map(chat => (
							<Link href={`/chat/${chat.book_id}`} key={chat.id}>
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className={cn(
										'group relative h-48 rounded-xl overflow-hidden',
										'bg-card hover:bg-accent/50 transition-all duration-300',
										'border border-border hover:border-primary/50',
										'shadow-sm hover:shadow-md'
									)}
								>
									{/* Book Cover Background */}
									<div className='absolute inset-0 bg-gradient-to-b from-transparent to-background/80' />
									{chat.books?.cover_url ? (
										<Image
											src={chat.books.cover_url}
											alt={chat.books.title}
											fill
											className='object-cover transition-transform duration-300 group-hover:scale-105'
										/>
									) : (
										<div className='absolute inset-0 bg-muted flex items-center justify-center'>
											<FiBook className='w-12 h-12 text-muted-foreground' />
										</div>
									)}

									{/* Content Overlay */}
									<div className='absolute inset-0 p-4 flex flex-col justify-end bg-black/50 text-accent'>
										<h3 className='max-w-3xs font-semibold text-lg mb-1 '>
											{chat.books?.title || 'Untitled Book'}
										</h3>
										<div className='flex items-center gap-2 text-sm text-accent'>
											<FiClock className='w-4 h-4' />
											<span>
												{new Date(chat.updated_at).toLocaleDateString(
													undefined,
													{
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													}
												)}
											</span>
										</div>
									</div>
								</motion.div>
							</Link>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
