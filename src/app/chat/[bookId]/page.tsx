'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { FiSend, FiBook } from 'react-icons/fi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import InsightsPanel from '@/components/InsightsPanel';

interface Message {
	id: string;
	content: string;
	role: 'user' | 'assistant';
	created_at: string;
	session_id: string | null;
}

interface Book {
	id: string;
	title: string;
	cover_url: string | null;
	author: string;
}

export default function ChatPage() {
	const { bookId } = useParams<{ bookId: string }>();
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [book, setBook] = useState<Book | null>(null);
	const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
	const [loading, setLoading] = useState(true);
	const [, setSessionId] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			const supabase = createClientComponentClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUserId(user?.id || null);
		};
		fetchUser();
	}, []);

	useEffect(() => {
		if (!bookId || !userId) return;
		const fetchData = async () => {
			try {
				const bookRes = await fetch(`/api/books/${bookId}`);
				const bookData = await bookRes.json();
				setBook(bookData);

				const sessionRes = await fetch(`/api/chats/${bookId}?userId=${userId}`);
				const sessionData = await sessionRes.json();
				setSessionId(sessionData.id);

				const messagesRes = await fetch(
					`/api/chats/${bookId}/messages?userId=${userId}`
				);
				const messagesData = await messagesRes.json();
				if (!Array.isArray(messagesData)) {
					setMessages([]);
					console.error('Failed to load messages:', messagesData);
					return;
				}
				setMessages(messagesData);
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [bookId, userId]);

	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	const handleSendMessage = async () => {
		if (!newMessage.trim() || !userId) return;

		const tempMessage: Message = {
			id: 'temp-' + Date.now(),
			content: newMessage,
			role: 'user',
			created_at: new Date().toISOString(),
			session_id: null,
		};

		setMessages(prev => [...prev, tempMessage]);
		setNewMessage('');

		try {
			const response = await fetch(
				`/api/chats/${bookId}/messages?userId=${userId}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						content: newMessage,
						role: 'user',
					}),
				}
			);

			const data = await response.json();
			// If the response is an array (user + AI), append them; else, replace temp
			if (Array.isArray(data)) {
				setMessages(prev => [
					...prev.filter(msg => !(msg.id && msg.id.startsWith('temp-'))),
					...data,
				]);
			} else {
				setMessages(prev =>
					prev.map(msg => (msg.id === tempMessage.id ? data : msg))
				);
			}
		} catch (error) {
			console.error('Error sending message:', error);
			// Remove the temporary message on error
			setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
		}
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
			</div>
		);
	}

	return (
		<div className='h-screen flex flex-col bg-background'>
			{/* Book Info Header */}
			<div className='bg-background pt-8 pb-4 flex flex-col items-center justify-center'>
				<div className='w-fit h-fit overflow-hidden bg-card flex items-center justify-center shadow-sm mb-3'>
					{book?.cover_url ? (
						<Image
							src={book.cover_url}
							alt={book.title}
							width={120}
							height={150}
							className='object-cover'
						/>
					) : (
						<FiBook className='w-24 h-32 text-muted-foreground' />
					)}
				</div>
				<h1 className='text-xl font-bold text-foreground text-center'>
					{book?.title}
				</h1>
				<p className='text-sm text-muted-foreground text-center'>
					{book?.author}
				</p>
			</div>

			{/* Modern Tabs */}
			<div className='flex justify-center mb-4'>
				<div className='flex bg-card rounded-full p-1 gap-2 shadow-sm text-sm'>
					<button
						onClick={() => setActiveTab('chat')}
						className={cn(
							'px-6 py-2 rounded-full font-medium transition-all cursor-pointer',
							activeTab === 'chat'
								? 'bg-primary text-primary-foreground shadow'
								: 'bg-transparent text-muted-foreground hover:text-foreground'
						)}
					>
						Chat
					</button>
					<button
						onClick={() => setActiveTab('insights')}
						className={cn(
							'px-6 py-2 rounded-full font-medium transition-all cursor-pointer',
							activeTab === 'insights'
								? 'bg-primary text-primary-foreground shadow'
								: 'bg-transparent text-muted-foreground hover:text-foreground'
						)}
					>
						Insights
					</button>
				</div>
			</div>

			{/* Chat Messages */}
			{activeTab === 'chat' ? (
				<div className='relative flex-1 min-h-0'>
					<ScrollArea className='h-full'>
						<div className='max-w-2xl mx-auto space-y-4 pb-4 pt-12 px-2 bg-background'>
							{messages.length === 0 ? (
								<div className='flex justify-center'>
									<div
										className='bg-muted text-muted-foreground px-4 py-3 rounded-full text-center text-sm opacity-80 shadow-sm'
										style={{ maxWidth: 360 }}
									>
										No messages yet. Start the conversation!
									</div>
								</div>
							) : (
								messages.map((message, index) => {
									const isUser = message.role === 'user';
									const MessageBubble = (
										<div
											key={message.id || index}
											className={cn(
												'flex',
												isUser ? 'justify-end' : 'justify-start'
											)}
										>
											<div
												className={cn(
													'px-5 py-3 rounded-2xl max-w-[80%] shadow-sm',
													isUser
														? 'bg-primary text-primary-foreground rounded-br-md'
														: 'bg-secondary text-foreground rounded-bl-md'
												)}
											>
												{message.content}
											</div>
										</div>
									);
									return index === messages.length - 1 ? (
										<motion.div
											key={message.id || index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
										>
											{MessageBubble}
										</motion.div>
									) : (
										MessageBubble
									);
								})
							)}
							<div ref={bottomRef} />
						</div>
					</ScrollArea>
					{/* Fade overlays */}
					<div
						className='pointer-events-none absolute -top-1 left-0 w-full h-12 z-30'
						style={{
							background:
								'linear-gradient(to bottom, var(--background) 20%, transparent)',
						}}
					/>
					<div
						className='pointer-events-none absolute -bottom-1 left-0 w-full h-12 z-30'
						style={{
							background:
								'linear-gradient(to top, var(--background) 20%, transparent)',
						}}
					/>
				</div>
			) : (
				<div className='relative flex-1 min-h-0'>
					<InsightsPanel bookId={bookId} userId={userId || ''} />
				</div>
			)}

			{/* Message Input */}
			{activeTab === 'chat' && (
				<div className='p-4 bg-background mt-2'>
					<div className='max-w-2xl mx-auto'>
						<div className='flex gap-2 bg-card rounded-xl shadow-sm px-4 py-2'>
							<textarea
								rows={2}
								style={{ resize: 'none' }}
								value={newMessage}
								onChange={e => setNewMessage(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
								placeholder='Type your message...'
								className='flex-1 bg-transparent border-none shadow-none focus:ring-0 outline-none'
							/>
							<button
								onClick={handleSendMessage}
								className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm'
							>
								<FiSend className='w-5 h-5' />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
