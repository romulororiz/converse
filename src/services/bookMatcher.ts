import { Book } from '../data/books';

interface MatchScore {
	book: Book;
	score: number;
}

export class BookMatcher {
	private static calculateKeywordMatch(
		input: string,
		keywords: string[]
	): number {
		const inputWords = input.toLowerCase().split(/\s+/);
		let matchCount = 0;

		for (const keyword of keywords) {
			if (inputWords.some(word => word.includes(keyword.toLowerCase()))) {
				matchCount++;
			}
		}

		return matchCount / keywords.length;
	}

	private static calculateTopicMatch(input: string, topics: string[]): number {
		const inputWords = input.toLowerCase().split(/\s+/);
		let matchCount = 0;

		for (const topic of topics) {
			if (inputWords.some(word => word.includes(topic.toLowerCase()))) {
				matchCount++;
			}
		}

		return matchCount / topics.length;
	}

	private static calculateEmotionalMatch(
		input: string,
		emotionalThemes: string[]
	): number {
		const inputWords = input.toLowerCase().split(/\s+/);
		let matchCount = 0;

		for (const theme of emotionalThemes) {
			if (inputWords.some(word => word.includes(theme.toLowerCase()))) {
				matchCount++;
			}
		}

		return matchCount / emotionalThemes.length;
	}

	public static findMatchingBooks(input: string, books: Book[]): Book[] {
		const matchScores: MatchScore[] = books.map(book => {
			const keywordScore = this.calculateKeywordMatch(input, book.keywords);
			const topicScore = this.calculateTopicMatch(input, book.topics);
			const emotionalScore = this.calculateEmotionalMatch(
				input,
				book.emotionalThemes
			);

			// Pesos para cada tipo de correspondência
			const totalScore =
				keywordScore * 0.4 + topicScore * 0.3 + emotionalScore * 0.3;

			return {
				book,
				score: totalScore,
			};
		});

		// Ordena os livros por pontuação e retorna os top 5
		return matchScores
			.sort((a, b) => b.score - a.score)
			.filter(match => match.score > 0)
			.slice(0, 5)
			.map(match => match.book);
	}
}
