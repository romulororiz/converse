import BackHomeButton from '../../components/BackHomeButton';

export default function InsightsPage() {
	return (
		<div className='flex flex-col min-h-screen items-center justify-center bg-background px-4'>
			<BackHomeButton />
			<div className='flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto'>
				<h2 className='text-2xl md:text-3xl font-serif text-center mb-8 text-foreground'>
					Insights Prefavados
				</h2>
				<div className='w-full flex flex-col gap-4 mb-8'>
					<div className='bg-card border border-border rounded-lg p-4 text-muted-foreground shadow-sm'>
						Lhante-se da domínio da sao trema. Daptrinuqera eitu no presante.
						D'agera e's sau caperine.
					</div>
				</div>
				<button className='w-full max-w-xs py-3 rounded-lg bg-primary text-primary-foreground text-lg font-medium shadow transition hover:bg-primary/90 cursor-pointer'>
					Guardar novo
				</button>
			</div>
		</div>
	);
}
