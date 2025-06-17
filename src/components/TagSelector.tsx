'use client';
import { motion, AnimatePresence } from 'framer-motion';

export type Tag = {
	label: string;
	value: string;
};

export default function TagSelector({
	tags,
	selected,
	onChange,
	className = '',
}: {
	tags: Tag[];
	selected: string[];
	onChange: (selected: string[]) => void;
	className?: string;
}) {
	const toggleTag = (value: string) => {
		if (selected.includes(value)) {
			onChange(selected.filter(t => t !== value));
		} else {
			onChange([...selected, value]);
		}
	};
	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			<AnimatePresence initial={false}>
				{tags.map(tag => (
					<motion.button
						key={tag.value}
						type='button'
						layout
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.18 }}
						onClick={() => toggleTag(tag.value)}
						className={`px-4 py-2 rounded-full border text-sm font-medium transition shadow-sm select-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer ${
							selected.includes(tag.value)
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-card text-muted-foreground border-border hover:bg-secondary'
						}`}
					>
						{tag.label}
					</motion.button>
				))}
			</AnimatePresence>
		</div>
	);
}
