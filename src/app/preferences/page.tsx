import BackHomeButton from '../../components/BackHomeButton';

export default function PreferencesPage() {
	return (
		<div className='flex flex-col min-h-screen items-center justify-center bg-background px-4'>
			<BackHomeButton />
			<div className='flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto'>
				<h2 className='text-2xl md:text-3xl font-serif text-center mb-8 text-foreground'>
					Preferências
				</h2>
				<div className='w-full flex flex-col gap-4 mb-8'>
					<label className='flex items-center gap-2 text-muted-foreground'>
						Tamo
						<select className='border border-border rounded px-2 py-1 bg-card'>
							<option>1</option>
							<option>2</option>
							<option>3</option>
						</select>
						Sg
					</label>
				</div>
				<div className='flex gap-2 w-full max-w-xs'>
					<button className='flex-1 py-3 rounded-lg bg-secondary text-muted-foreground text-base font-medium shadow-sm cursor-pointer'>
						Fam da convera
					</button>
					<button className='flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-base font-medium shadow transition hover:bg-primary/90 cursor-pointer'>
						U'garre
					</button>
				</div>
			</div>
		</div>
	);
}
