import Link from 'next/link';
import Image from 'next/image';
import BackHomeButton from '../../components/BackHomeButton';

const authors = [
	{
		name: 'Eckhart Tolle',
		desc: 'Amacheuy | Ontanna Anoyvat',
		img: 'https://randomuser.me/api/portraits/men/32.jpg',
		value: 'eckhart-tolle',
	},
	{
		name: 'Manther Bark',
		desc: 'Unsacmendi is equirino deor',
		img: 'https://randomuser.me/api/portraits/men/44.jpg',
		value: 'manther-bark',
	},
];

export default async function AuthorPage({
	searchParams,
}: {
	searchParams: { topic?: string };
}) {
	return (
		<div className='flex flex-col min-h-screen items-center justify-center bg-background px-4'>
			<BackHomeButton />
			<div className='flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto'>
				<h2 className='text-2xl md:text-3xl font-serif text-center mb-8 text-foreground'>
					Choose an author to chat with
				</h2>
				<div className='flex flex-col gap-4 w-full'>
					{authors.map(author => (
						<Link
							key={author.value}
							href={`/chat?author=${author.value}&topic=${
								searchParams.topic || ''
							}`}
							className='w-full'
						>
							<div className='flex items-center gap-4 p-4 rounded-lg border border-border bg-card shadow-sm hover:bg-secondary transition cursor-pointer'>
								<Image
									src={author.img}
									alt={author.name}
									width={48}
									height={48}
									className='rounded-full object-cover'
								/>
								<div className='flex flex-col'>
									<span className='font-medium text-lg text-foreground'>
										{author.name}
									</span>
									<span className='text-muted-foreground text-sm'>
										{author.desc}
									</span>
								</div>
							</div>
						</Link>
					))}
				</div>
				<p className='text-muted-foreground text-sm mt-6'>
					Not sure where to start
				</p>
			</div>
		</div>
	);
}
