export interface Book {
	id: string;
	title: string;
	author: string;
	description: string;
	coverImage: string;
	topics: string[];
	rating: number;
	year: number;
	pages: number;
	language: string;
	isbn: string;
	publisher: string;
	price: number;
	currency: string;
	availableFormats: string[];
	bestseller: boolean;
	awards?: string[];
	quotes?: string[];
}

export const books: Book[] = [
	{
		id: 'pride-prejudice',
		title: 'Pride and Prejudice',
		author: 'Jane Austen',
		description:
			'A romantic novel of manners that follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of the British Regency.',
		coverImage: 'https://covers.openlibrary.org/b/id/10523338-L.jpg',
		topics: ['Romance', 'Classic Literature', 'Social Commentary', 'Marriage'],
		rating: 4.8,
		year: 1813,
		pages: 432,
		language: 'English',
		isbn: '978-0141439518',
		publisher: 'Penguin Classics',
		price: 9.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
			'Vanity and pride are different things, though the words are often used synonymously.',
		],
	},
	{
		id: 'frankenstein',
		title: 'Frankenstein',
		author: 'Mary Shelley',
		description:
			'A Gothic novel that tells the story of Victor Frankenstein, a young scientist who creates a sapient creature in an unorthodox scientific experiment.',
		coverImage: 'https://covers.openlibrary.org/b/id/8228691-L.jpg',
		topics: ['Gothic Fiction', 'Science Fiction', 'Horror', 'Philosophy'],
		rating: 4.6,
		year: 1818,
		pages: 280,
		language: 'English',
		isbn: '978-0141439471',
		publisher: 'Penguin Classics',
		price: 8.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'Beware; for I am fearless, and therefore powerful.',
			'Nothing is so painful to the human mind as a great and sudden change.',
		],
	},
	{
		id: 'alice-wonderland',
		title: "Alice's Adventures in Wonderland",
		author: 'Lewis Carroll',
		description:
			'A novel that tells the story of a young girl named Alice who falls through a rabbit hole into a fantasy world populated by peculiar, anthropomorphic creatures.',
		coverImage: 'https://covers.openlibrary.org/b/id/10958382-L.jpg',
		topics: ['Fantasy', "Children's Literature", 'Adventure', 'Nonsense'],
		rating: 4.7,
		year: 1865,
		pages: 192,
		language: 'English',
		isbn: '978-0141439761',
		publisher: 'Penguin Classics',
		price: 7.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: ['Curiouser and curiouser!', "We're all mad here."],
	},
	{
		id: 'dracula',
		title: 'Dracula',
		author: 'Bram Stoker',
		description:
			"An epistolary novel that tells the story of Count Dracula's attempt to move from Transylvania to England so that he may find new blood and spread the undead curse.",
		coverImage: 'https://covers.openlibrary.org/b/id/8167896-L.jpg',
		topics: ['Gothic Fiction', 'Horror', 'Vampires', 'Victorian Literature'],
		rating: 4.6,
		year: 1897,
		pages: 418,
		language: 'English',
		isbn: '978-0141439846',
		publisher: 'Penguin Classics',
		price: 9.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'I am Dracula, and I bid you welcome.',
			'There are darknesses in life and there are lights, and you are one of the lights.',
		],
	},
	{
		id: 'sherlock-holmes',
		title: 'The Adventures of Sherlock Holmes',
		author: 'Arthur Conan Doyle',
		description:
			'A collection of twelve short stories featuring the famous detective Sherlock Holmes and his companion Dr. Watson.',
		coverImage: 'https://covers.openlibrary.org/b/id/10523339-L.jpg',
		topics: ['Mystery', 'Detective Fiction', 'Crime', 'Victorian Literature'],
		rating: 4.4,
		year: 1892,
		pages: 307,
		language: 'English',
		isbn: '978-0140439073',
		publisher: 'Penguin Classics',
		price: 8.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		quotes: [
			'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
			'It is a capital mistake to theorize before one has data.',
		],
	},
	{
		id: 'jane-eyre',
		title: 'Jane Eyre',
		author: 'Charlotte Brontë',
		description:
			'A novel that follows the experiences of its eponymous heroine, including her growth to adulthood and her love for Mr. Rochester.',
		coverImage: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
		topics: ['Gothic Fiction', 'Romance', 'Victorian Literature', 'Feminism'],
		rating: 4.6,
		year: 1847,
		pages: 532,
		language: 'English',
		isbn: '978-0141441146',
		publisher: 'Penguin Classics',
		price: 9.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'I am no bird; and no net ensnares me: I am a free human being with an independent will.',
			'Do you think, because I am poor, obscure, plain, and little, I am soulless and heartless?',
		],
	},
	{
		id: 'war-peace',
		title: 'War and Peace',
		author: 'Leo Tolstoy',
		description:
			'A novel that chronicles the French invasion of Russia and the impact of the Napoleonic era on Tsarist society through the stories of five Russian aristocratic families.',
		coverImage: 'https://covers.openlibrary.org/b/id/11153223-L.jpg',
		topics: ['Historical Fiction', 'War', 'Philosophy', 'Russian Literature'],
		rating: 4.5,
		year: 1869,
		pages: 1225,
		language: 'English',
		isbn: '978-0140447934',
		publisher: 'Penguin Classics',
		price: 14.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'We can know only that we know nothing. And that is the highest degree of human wisdom.',
			'If everyone fought for their own convictions there would be no war.',
		],
	},
	{
		id: 'great-expectations',
		title: 'Great Expectations',
		author: 'Charles Dickens',
		description:
			'A bildungsroman that depicts the personal growth and personal development of an orphan nicknamed Pip.',
		coverImage: 'https://covers.openlibrary.org/b/id/10523340-L.jpg',
		topics: [
			'Victorian Literature',
			'Coming of Age',
			'Social Criticism',
			'Class',
		],
		rating: 4.7,
		year: 1861,
		pages: 544,
		language: 'English',
		isbn: '978-0141439563',
		publisher: 'Penguin Classics',
		price: 9.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'We need never be ashamed of our tears.',
			"Take nothing on its looks; take everything on evidence. There's no better rule.",
		],
	},
	{
		id: 'moby-dick',
		title: 'Moby-Dick',
		author: 'Herman Melville',
		description:
			"A novel that tells the story of the obsessive quest of Ahab, captain of a whaling ship, seeking revenge on Moby Dick, the white whale that on the ship's previous voyage bit off Ahab's leg at the knee.",
		coverImage: 'https://covers.openlibrary.org/b/id/10523341-L.jpg',
		topics: ['Adventure', 'Philosophy', 'Whaling', 'American Literature'],
		rating: 4.6,
		year: 1851,
		pages: 635,
		language: 'English',
		isbn: '978-0142437247',
		publisher: 'Penguin Classics',
		price: 12.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'Call me Ishmael.',
			'It is better to fail in originality than to succeed in imitation.',
		],
	},
	{
		id: 'don-quixote',
		title: 'Don Quixote',
		author: 'Miguel de Cervantes',
		description:
			'A novel that follows the adventures of Alonso Quixano, a retired country gentleman who becomes so obsessed with chivalric romances that he decides to become a knight-errant himself.',
		coverImage: 'https://covers.openlibrary.org/b/id/10523342-L.jpg',
		topics: ['Adventure', 'Satire', 'Spanish Literature', 'Classic'],
		rating: 4.7,
		year: 1605,
		pages: 863,
		language: 'English',
		isbn: '978-0142437230',
		publisher: 'Penguin Classics',
		price: 13.99,
		currency: 'USD',
		availableFormats: ['Hardcover', 'Paperback', 'E-book', 'Audiobook'],
		bestseller: true,
		awards: ["BBC's The Big Read Top 100"],
		quotes: [
			'Too much sanity may be madness. And maddest of all, to see life as it is and not as it should be.',
			'When life itself seems lunatic, who knows where madness lies?',
		],
	},
];
