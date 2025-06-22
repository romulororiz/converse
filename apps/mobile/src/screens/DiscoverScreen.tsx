import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const allTags = [
	// Personal Development
	'Personal Growth',
	'Self-Discovery',
	'Mindfulness',
	'Emotional Intelligence',
	'Habits & Routines',
	'Spirituality',
	'Meditation',
	'Wellness',
	// Career & Business
	'Career Development',
	'Leadership',
	'Entrepreneurship',
	'Productivity',
	'Innovation',
	'Business Strategy',
	'Professional Skills',
	'Work-Life Balance',
	// Relationships
	'Relationships',
	'Communication',
	'Social Skills',
	'Family Dynamics',
	'Friendship',
	'Dating & Romance',
	'Conflict Resolution',
	'Empathy',
	// Mental Health
	'Mental Health',
	'Psychology',
	'Anxiety & Stress',
	'Depression',
	'Resilience',
	'Trauma Healing',
	'Self-Care',
	'Therapy',
	// Finance
	'Personal Finance',
	'Investing',
	'Wealth Building',
	'Financial Freedom',
	'Money Mindset',
	'Budgeting',
	'Retirement Planning',
	'Financial Education',
	// Creativity
	'Creativity',
	'Art & Design',
	'Writing',
	'Music',
	'Photography',
	'Storytelling',
	'Creative Thinking',
	'Visual Arts',
	// Science & Technology
	'Science',
	'Technology',
	'Artificial Intelligence',
	'Space & Astronomy',
	'Biology',
	'Physics',
	'Chemistry',
	'Mathematics',
	// Philosophy & History
	'Philosophy',
	'History',
	'Ethics',
	'Critical Thinking',
	'World Cultures',
	'Ancient Wisdom',
	'Modern Thought',
	'Social Sciences',
];

const TAGS_PER_PAGE = 12;

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
};

export default function DiscoverScreen() {
	const navigation = useNavigation<NavigationProp>();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [visibleTagsCount, setVisibleTagsCount] = useState(TAGS_PER_PAGE);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const visibleTags = allTags.slice(0, visibleTagsCount);
	const hasMoreTags = visibleTagsCount < allTags.length;

	const toggleTag = (tag: string) => {
		setSelectedTags(prev =>
			prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
		);
	};

	const loadMoreTags = () => {
		setIsLoadingMore(true);
		setTimeout(() => {
			setVisibleTagsCount(prev =>
				Math.min(prev + TAGS_PER_PAGE, allTags.length)
			);
			setIsLoadingMore(false);
		}, 500);
	};

	const handleFindBooks = () => {
		if (selectedTags.length === 0) return;

		// Navigate to BooksList with selected tags as filter
		navigation.navigate('BooksList', {
			tags: selectedTags,
			title: 'Discover Results',
		});
	};

	const clearAllTags = () => {
		setSelectedTags([]);
	};

	const renderTag = (tag: string, index: number) => {
		const isSelected = selectedTags.includes(tag);

		return (
			<TouchableOpacity
				key={tag}
				style={[
					styles.tagButton,
					isSelected ? styles.tagButtonSelected : styles.tagButtonDefault,
				]}
				onPress={() => toggleTag(tag)}
				activeOpacity={0.7}
			>
				<Text
					style={[
						styles.tagText,
						isSelected ? styles.tagTextSelected : styles.tagTextDefault,
					]}
				>
					{tag}
				</Text>
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerContent}>
					<Text style={styles.title}>Select Your Interests</Text>
					<Text style={styles.subtitle}>
						Choose one or more topics to help us find the perfect books for you
					</Text>
				</View>

				{/* Selected count and clear button */}
				{selectedTags.length > 0 && (
					<View style={styles.selectedInfo}>
						<Text style={styles.selectedCount}>
							{selectedTags.length} topic{selectedTags.length !== 1 ? 's' : ''}{' '}
							selected
						</Text>
						<TouchableOpacity onPress={clearAllTags} style={styles.clearButton}>
							<Text style={styles.clearButtonText}>Clear All</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Tags Grid */}
				<View style={styles.tagsContainer}>{visibleTags.map(renderTag)}</View>

				{/* Load More Button */}
				{hasMoreTags && (
					<TouchableOpacity
						style={styles.loadMoreButton}
						onPress={loadMoreTags}
						disabled={isLoadingMore}
						activeOpacity={0.7}
					>
						{isLoadingMore ? (
							<ActivityIndicator size='small' color={colors.light.primary} />
						) : (
							<>
								<Ionicons name='add' size={20} color={colors.light.primary} />
								<Text style={styles.loadMoreText}>Load More Topics</Text>
							</>
						)}
					</TouchableOpacity>
				)}

				{/* Bottom spacing for find books button */}
				<View style={styles.bottomSpacing} />
			</ScrollView>

			{/* Fixed Find Books Button */}
			<View style={styles.bottomContainer}>
				<TouchableOpacity
					style={[
						styles.findBooksButton,
						selectedTags.length === 0 && styles.findBooksButtonDisabled,
					]}
					onPress={handleFindBooks}
					disabled={selectedTags.length === 0}
					activeOpacity={0.8}
				>
					<Text
						style={[
							styles.findBooksButtonText,
							selectedTags.length === 0 && styles.findBooksButtonTextDisabled,
						]}
					>
						Find Books ({selectedTags.length})
					</Text>
					<Ionicons
						name='arrow-forward'
						size={20}
						color={
							selectedTags.length > 0
								? colors.light.primaryForeground
								: colors.light.mutedForeground
						}
					/>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.light.background,
	},
	header: {
		backgroundColor: colors.light.card,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.light.border,
	},
	headerContent: {
		alignItems: 'flex-start',
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.light.foreground,
		marginBottom: 8,
		textAlign: 'left',
	},
	subtitle: {
		fontSize: 16,
		color: colors.light.mutedForeground,
		textAlign: 'left',
		lineHeight: 22,
	},
	selectedInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: colors.light.border,
	},
	selectedCount: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.light.primary,
	},
	clearButton: {
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	clearButtonText: {
		fontSize: 14,
		color: colors.light.destructive,
		fontWeight: '500',
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginBottom: 20,
	},
	tagButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
		borderWidth: 1,
		minHeight: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	tagButtonDefault: {
		backgroundColor: colors.light.background,
		borderColor: colors.light.border,
	},
	tagButtonSelected: {
		backgroundColor: colors.light.primary,
		borderColor: colors.light.primary,
	},
	tagText: {
		fontSize: 14,
		fontWeight: '500',
		textAlign: 'center',
	},
	tagTextDefault: {
		color: colors.light.mutedForeground,
	},
	tagTextSelected: {
		color: colors.light.primaryForeground,
	},
	loadMoreButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		gap: 8,
		alignSelf: 'center',
		marginBottom: 20,
	},
	loadMoreText: {
		fontSize: 16,
		color: colors.light.primary,
		fontWeight: '500',
	},
	bottomSpacing: {
		height: 100, // Space for fixed button
	},
	bottomContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.light.card,
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 20,
		borderTopWidth: 1,
		borderTopColor: colors.light.border,
	},
	findBooksButton: {
		backgroundColor: colors.light.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		gap: 8,
	},
	findBooksButtonDisabled: {
		backgroundColor: colors.light.secondary,
	},
	findBooksButtonText: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.light.primaryForeground,
	},
	findBooksButtonTextDisabled: {
		color: colors.light.mutedForeground,
	},
});
