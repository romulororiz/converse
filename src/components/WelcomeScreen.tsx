'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
	const router = useRouter();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='flex flex-col items-center justify-center min-h-[80vh] text-center'
		>
			<motion.h1
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className='text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
			>
				Interactive Library
			</motion.h1>

			<motion.p
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className='text-xl text-muted-foreground mb-12 max-w-2xl'
			>
				Discover books that transform lives. Connect with authors and explore
				new perspectives through a unique interactive experience.
			</motion.p>

			<motion.button
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.6 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => router.push('/discover')}
				className='px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl cursor-pointer'
			>
				Start Exploring
			</motion.button>
		</motion.div>
	);
}
