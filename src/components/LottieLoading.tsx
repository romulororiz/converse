'use client';
import { Player } from 'lottie-react';

export default function LottieLoading({
	className = 'w-24 h-24',
}: {
	className?: string;
}) {
	return (
		<div className={className}>
			<Player
				autoplay
				loop
				src='https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json'
				style={{ width: '100%', height: '100%' }}
			/>
		</div>
	);
}
