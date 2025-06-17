'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

export default function BackHomeButton() {
	const router = useRouter();
	return (
		<motion.button
			whileTap={{ scale: 0.92 }}
			whileHover={{ scale: 1.05 }}
			onClick={() => router.push('/')}
			className='fixed top-4 right-4 z-30 p-2 rounded-lg bg-background shadow-md hover:bg-primary/90 transition md:top-6 md:right-6 text-foreground cursor-pointer'
			aria-label='Voltar para a página inicial'
		>
			<FiArrowLeft size={24} />
		</motion.button>
	);
}
