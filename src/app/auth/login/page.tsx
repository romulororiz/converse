'use client';
import AuthModal from '@/components/AuthModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(true);

	// After successful login, redirect to the intended page
	const redirectTo = searchParams.get('redirectTo') || '/';

	const handleClose = () => {
		setOpen(false);
		router.replace(redirectTo);
	};

	return (
		<div className='flex items-center justify-center min-h-screen bg-neutral-50'>
			<AuthModal isOpen={open} onClose={handleClose} />
		</div>
	);
}
