'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import AuthModal from '../../components/AuthModal';

const allTags = [
	// Personal Development
	'Personal Growth',
	'Self-Discovery',
	'Mindfulness',
	'Emotional Intelligence',
	'Habits & Routines',
	'Spirituality',
	'Meditation',
	'Wellness',
	// Career & Business
	'Career Development',
	'Leadership',
	'Entrepreneurship',
	'Productivity',
	'Innovation',
	'Business Strategy',
	'Professional Skills',
	'Work-Life Balance',
	// Relationships
	'Relationships',
	'Communication',
	'Social Skills',
	'Family Dynamics',
	'Friendship',
	'Dating & Romance',
	'Conflict Resolution',
	'Empathy',
	// Mental Health
	'Mental Health',
	'Psychology',
	'Anxiety & Stress',
	'Depression',
	'Resilience',
	'Trauma Healing',
	'Self-Care',
	'Therapy',
	// Finance
	'Personal Finance',
	'Investing',
	'Wealth Building',
	'Financial Freedom',
	'Money Mindset',
	'Budgeting',
	'Retirement Planning',
	'Financial Education',
	// Creativity
	'Creativity',
	'Art & Design',
	'Writing',
	'Music',
	'Photography',
	'Storytelling',
	'Creative Thinking',
	'Visual Arts',
	// Science & Technology
	'Science',
	'Technology',
	'Artificial Intelligence',
	'Space & Astronomy',
	'Biology',
	'Physics',
	'Chemistry',
	'Mathematics',
	// Philosophy & History
	'Philosophy',
	'History',
	'Ethics',
	'Critical Thinking',
	'World Cultures',
	'Ancient Wisdom',
	'Modern Thought',
	'Social Sciences',
];

const TAGS_PER_PAGE = 8;

export default function DiscoverPage() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [visibleTagsCount, setVisibleTagsCount] = useState(TAGS_PER_PAGE);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);

	const visibleTags = allTags.slice(0, visibleTagsCount);
	const hasMoreTags = visibleTagsCount < allTags.length;

	const toggleTag = (tag: string) => {
		setSelectedTags(prev =>
			prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
		);
	};

	const loadMoreTags = () => {
		setIsLoadingMore(true);
		setTimeout(() => {
			setVisibleTagsCount(prev =>
				Math.min(prev + TAGS_PER_PAGE, allTags.length)
			);
			setIsLoadingMore(false);
		}, 500);
	};

	const handleFindBooks = () => {
		if (selectedTags.length === 0) return;
		if (!user) {
			setShowAuthModal(true);
		} else {
			router.push(`/results?tags=${selectedTags.join(',')}`);
		}
	};

	const handleAuthClose = () => {
		setShowAuthModal(false);
		// If user is now logged in, redirect
		if (useAuthStore.getState().user) {
			router.push(`/results?tags=${selectedTags.join(',')}`);
		}
	};

	return (
		<div className='max-w-4xl mx-auto px-4 py-8'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='text-center mb-12'
			>
				<h1 className='text-3xl font-bold mb-4'>Select Your Interests</h1>
				<p className='text-neutral-600'>
					Choose one or more topics to help us find the perfect books for you
				</p>
			</motion.div>

			<div className='space-y-8'>
				<div className='flex flex-wrap gap-3'>
					{visibleTags.map((tag, index) => (
						<motion.button
							key={tag}
							initial={
								index >= visibleTagsCount - TAGS_PER_PAGE
									? { opacity: 0, scale: 0.9 }
									: false
							}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								delay: (index % TAGS_PER_PAGE) * 0.05,
								duration: 0.2,
							}}
							onClick={() => toggleTag(tag)}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
								selectedTags.includes(tag)
									? 'bg-primary text-primary-foreground shadow-lg'
									: 'bg-background text-muted-foreground hover:bg-secondary border border-border'
							}`}
						>
							{tag}
						</motion.button>
					))}
				</div>

				{hasMoreTags && (
					<motion.button
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						onClick={loadMoreTags}
						disabled={isLoadingMore}
						className='flex items-center gap-2 mx-auto px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
					>
						<FiPlus size={20} />
						<span>Load More Topics</span>
					</motion.button>
				)}

				<motion.button
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					disabled={selectedTags.length === 0}
					onClick={handleFindBooks}
					className={`w-full py-4 rounded-xl text-lg font-medium transition-all cursor-pointer ${
						selectedTags.length > 0
							? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
							: 'bg-secondary text-muted-foreground cursor-not-allowed'
					}`}
				>
					Find Books
				</motion.button>
			</div>
			<AuthModal isOpen={showAuthModal} onClose={handleAuthClose} />
		</div>
	);
}
