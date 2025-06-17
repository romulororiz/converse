'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { FiX, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const { signIn, signUp } = useAuthStore();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			if (isSignUp) {
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
				});
				if (error) throw error;
				if (data.user) {
					await supabase.from('profiles').insert([
						{
							id: data.user.id,
							email: data.user.email,
							full_name: name,
						},
					]);
				}
			} else {
				await signIn(email, password);
			}
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50'
						onClick={onClose}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-xl z-50 p-6'
					>
						<div className='flex items-center justify-between mb-6'>
							<h2 className='text-2xl font-bold text-foreground'>
								{isSignUp ? 'Create Account' : 'Welcome Back'}
							</h2>
							<button
								onClick={onClose}
								className='p-2 hover:bg-secondary rounded-lg transition cursor-pointer'
							>
								<FiX size={24} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className='space-y-4'>
							{isSignUp && (
								<div className='space-y-2'>
									<label className='text-sm font-medium text-neutral-700'>
										Name
									</label>
									<div className='relative'>
										<FiUser className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400' />
										<input
											type='text'
											value={name}
											onChange={e => setName(e.target.value)}
											className='w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300'
											placeholder='Your name'
											required
										/>
									</div>
								</div>
							)}

							<div className='space-y-2'>
								<label className='text-sm font-medium text-neutral-700'>
									Email
								</label>
								<div className='relative'>
									<FiMail className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400' />
									<input
										type='email'
										value={email}
										onChange={e => setEmail(e.target.value)}
										className='w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300'
										placeholder='you@example.com'
										required
									/>
								</div>
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-medium text-neutral-700'>
									Password
								</label>
								<div className='relative'>
									<FiLock className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400' />
									<input
										type='password'
										value={password}
										onChange={e => setPassword(e.target.value)}
										className='w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300'
										placeholder='••••••••'
										required
									/>
								</div>
							</div>

							{error && <div className='text-red-500 text-sm'>{error}</div>}

							<button
								type='submit'
								disabled={isLoading}
								className='w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer'
							>
								{isLoading ? (
									<div className='flex items-center justify-center'>
										<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
									</div>
								) : isSignUp ? (
									'Create Account'
								) : (
									'Sign In'
								)}
							</button>
						</form>

						<div className='mt-6 text-center'>
							<button
								onClick={() => setIsSignUp(!isSignUp)}
								className='text-sm text-muted-foreground hover:text-foreground transition cursor-pointer'
							>
								{isSignUp
									? 'Already have an account? Sign in'
									: "Don't have an account? Sign up"}
							</button>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
