import { useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';

interface Insight {
	title: string;
	content: string;
}

export function InsightsAddForm({
	bookId,
	userId,
	onAdd,
}: {
	bookId: string;
	userId: string;
	onAdd: (insight: Insight) => void;
}) {
	const [newTitle, setNewTitle] = useState('');
	const [newContent, setNewContent] = useState('');
	const [adding, setAdding] = useState(false);

	const handleAddInsight = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTitle.trim() || !newContent.trim()) return;
		setAdding(true);
		const newInsight = { title: newTitle.trim(), content: newContent.trim() };
		onAdd(newInsight); // Optimistic update in parent
		setNewTitle('');
		setNewContent('');
		await fetch(`/api/chats/${bookId}/insights?userId=${userId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newInsight),
		});
		setAdding(false);
	};

	return (
		<form
			onSubmit={handleAddInsight}
			className='px-4 md:px-0 max-w-4xl mx-auto space-y-2 py-4 w-full'
		>
			<Input
				className='bg-card w-full px-3 py-2 rounded-lg border border-muted text-base focus:outline-none focus:ring-2 focus:ring-primary'
				placeholder='Insight title'
				value={newTitle}
				onChange={e => setNewTitle(e.target.value)}
				disabled={adding}
				maxLength={60}
			/>
			<textarea
				className='w-full px-3 py-2 rounded-lg border border-muted bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary'
				placeholder='Your insight...'
				value={newContent}
				onChange={e => setNewContent(e.target.value)}
				rows={3}
				disabled={adding}
				maxLength={300}
			/>
			<button
				type='submit'
				className='w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60'
				disabled={adding || !newTitle.trim() || !newContent.trim()}
			>
				{adding ? 'Adding...' : 'Add Insight'}
			</button>
		</form>
	);
}

export function InsightsList({
	bookId,
	userId,
	insights,
	setInsights,
}: {
	bookId: string;
	userId: string;
	insights: Insight[];
	setInsights: (insights: Insight[]) => void;
}) {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		fetch(`/api/chats/${bookId}/insights?userId=${userId}`)
			.then(res => res.json())
			.then(data => {
				setInsights(data || []);
				setLoading(false);
			});
	}, [bookId, userId, setInsights]);

	if (loading)
		return (
			<div className='p-8 text-center text-muted-foreground'>
				Loading insights...
			</div>
		);
	if (!insights.length)
		return (
			<div className='p-8 text-center text-muted-foreground'>
				No insights yet. Start chatting to generate insights!
			</div>
		);

	return (
		<div className='space-y-4 p-4 pt-8 drop-shadow-xs'>
			{insights.map((insight, idx) => (
				<div
					key={idx}
					className='max-w-4xl mx-auto bg-muted rounded-lg p-4 shadow'
				>
					<h3 className='font-semibold mb-2 flex items-center gap-2'>
						<span role='img' aria-label='insight'>
							💡
						</span>{' '}
						{insight.title}
					</h3>
					<p className='text-neutral-700'>{insight.content}</p>
				</div>
			))}
		</div>
	);
}

export default function InsightsPanel({
	bookId,
	userId,
}: {
	bookId: string;
	userId: string;
}) {
	const [insights, setInsights] = useState<Insight[]>([]);
	// Add insight optimistically
	const handleAdd = (insight: Insight) =>
		setInsights(prev => [insight, ...prev]);
	return (
		<div className='flex flex-col h-full'>
			<InsightsAddForm bookId={bookId} userId={userId} onAdd={handleAdd} />
			<div className='relative flex-1 min-h-0'>
				<ScrollArea className='h-full'>
					<InsightsList
						bookId={bookId}
						userId={userId}
						insights={insights}
						setInsights={setInsights}
					/>
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
		</div>
	);
}
