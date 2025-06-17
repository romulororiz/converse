'use client';

import { ReactNode } from 'react';
import Drawer from './Drawer';

interface AppShellProps {
	children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
	return (
		<div className='min-h-screen bg-background'>
			<Drawer />
			<main className='md:p-0'>{children}</main>
		</div>
	);
}
