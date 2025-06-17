'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
	FiMenu,
	FiX,
	FiHome,
	FiMessageSquare,
	FiBarChart2,
	FiSettings,
	FiLogIn,
	FiLogOut,
	FiUser,
} from 'react-icons/fi';
import { useAuthStore } from '@/lib/store/auth';
import AuthModal from './AuthModal';

const menuItems = [
	{ name: 'Home', href: '/', icon: FiHome },
	{ name: 'Chats', href: '/chats', icon: FiMessageSquare, requiresAuth: true },
	{
		name: 'Insights',
		href: '/insights',
		icon: FiBarChart2,
		requiresAuth: true,
	},
	{
		name: 'Preferences',
		href: '/preferences',
		icon: FiSettings,
		requiresAuth: true,
	},
];

export default function Drawer() {
	const [isOpen, setIsOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const pathname = usePathname();
	const { user, profile, signOut } = useAuthStore();

	const toggleMenu = () => setIsOpen(!isOpen);
	const closeMenu = () => setIsOpen(false);

	const handleAuthClick = () => {
		if (user) {
			signOut();
		} else {
			setIsAuthModalOpen(true);
		}
		closeMenu();
	};

	return (
		<>
			<button
				onClick={toggleMenu}
				className='fixed top-6 right-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground cursor-pointer shadow-lg transition'
			>
				{isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
			</button>

			<AnimatePresence>
				{isOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40'
							onClick={closeMenu}
						/>
						<motion.div
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							className='fixed top-0 right-0 h-full w-64 bg-sidebar shadow-xl z-40 p-6 text-sidebar-foreground'
						>
							<div className='flex pt-14 flex-col h-full'>
								<div className='flex-1'>
									<nav className='space-y-2'>
										{menuItems.map(item => {
											if (item.requiresAuth && !user) return null;

											return (
												<Link
													key={item.name}
													href={item.href}
													onClick={closeMenu}
													className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
														pathname === item.href
															? 'bg-neutral-100 text-neutral-900'
															: 'text-neutral-600 hover:bg-primary hover:text-sidebar-primary-foreground'
													}`}
												>
													<item.icon size={20} />
													<span>{item.name}</span>
												</Link>
											);
										})}
									</nav>
								</div>

								<div className='pt-4 border-t'>
									{user ? (
										<div className='flex items-center space-x-3 p-2'>
											<div className='w-10 h-10 rounded-full bg-neutral-100 shadow-sm flex items-center justify-center'>
												<FiUser size={16} />
											</div>
											<div className='flex-1 min-w-0'>
												<p className='text-sm font-medium text-neutral-900 truncate'>
													{profile?.full_name || user.email}
												</p>
											</div>
										</div>
									) : null}

									<button
										onClick={handleAuthClick}
										className='cursor-pointer w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-neutral-600 hover:bg-primary hover:text-sidebar-primary-foreground transition'
									>
										{user ? (
											<>
												<FiLogOut size={20} />
												<span>Sign Out</span>
											</>
										) : (
											<>
												<FiLogIn size={20} />
												<span>Sign In</span>
											</>
										)}
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
}
