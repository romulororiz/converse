import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	StatusBar,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../components/AuthProvider';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import {
	getUserInsights,
	type InsightCard,
	type ChatGoal,
} from '../services/insights';
import { ScreenHeader } from '../components';

const { width } = Dimensions.get('window');

type NavigationProp = {
	navigate: (screen: string, params?: any) => void;
	goBack: () => void;
};

export default function InsightsScreen() {
	const { theme, isDark } = useTheme();
	const { user } = useAuth();
	const navigation = useNavigation<NavigationProp>();
	const currentColors = colors[theme];
	const [loading, setLoading] = useState(true);
	const [insights, setInsights] = useState<InsightCard[]>([]);
	const [goals, setGoals] = useState<ChatGoal[]>([]);
	const [selectedPeriod, setSelectedPeriod] = useState<
		'week' | 'month' | 'year'
	>('month');

	useFocusEffect(
		React.useCallback(() => {
			if (user?.id) {
				loadInsights();
			}
		}, [user?.id, selectedPeriod])
	);

	const loadInsights = async () => {
		if (!user?.id) return;

		setLoading(true);
		try {
			const data = await getUserInsights(user.id, selectedPeriod);
			setInsights(data.insights);
			setGoals(data.goals);
		} catch (error) {
			console.error('Error loading insights:', error);
			// Fallback to empty arrays if there's an error
			setInsights([]);
			setGoals([]);
		} finally {
			setLoading(false);
		}
	};

	const renderSkeletonCards = () => (
		<View style={styles.insightsGrid}>
			{Array.from({ length: 6 }).map((_, index) => (
				<View
					key={index}
					style={[styles.skeletonCard, { backgroundColor: currentColors.card }]}
				>
					<View style={styles.skeletonCardHeader}>
						<SkeletonLoader width={24} height={24} borderRadius={12} />
						<SkeletonLoader width={80} height={16} />
					</View>
					<SkeletonLoader
						width={60}
						height={24}
						style={{ marginVertical: 8 }}
					/>
					<SkeletonLoader width={100} height={14} />
					<SkeletonLoader width={120} height={12} style={{ marginTop: 8 }} />
				</View>
			))}
		</View>
	);

	const renderInsightCard = (insight: InsightCard) => {
		const getTrendColor = () => {
			switch (insight.trend) {
				case 'up':
					return '#10B981';
				case 'down':
					return '#EF4444';
				default:
					return currentColors.mutedForeground;
			}
		};

		const getTrendIcon = () => {
			switch (insight.trend) {
				case 'up':
					return 'trending-up';
				case 'down':
					return 'trending-down';
				default:
					return 'remove';
			}
		};

		return (
			<TouchableOpacity
				key={insight.id}
				style={[
					styles.insightCard,
					{
						backgroundColor: currentColors.card,
						borderColor: currentColors.border,
					},
				]}
				activeOpacity={0.7}
			>
				<View style={styles.cardHeader}>
					<Ionicons
						name={insight.icon as any}
						size={24}
						color={currentColors.primary}
					/>
					<Text
						style={[styles.cardTitle, { color: currentColors.mutedForeground }]}
					>
						{insight.title}
					</Text>
				</View>

				<Text style={[styles.cardValue, { color: currentColors.foreground }]}>
					{insight.value}
				</Text>

				{insight.change && (
					<View style={styles.changeContainer}>
						<Ionicons name={getTrendIcon()} size={14} color={getTrendColor()} />
						<Text style={[styles.changeText, { color: getTrendColor() }]}>
							{insight.change}
						</Text>
					</View>
				)}

				<Text
					style={[
						styles.cardDescription,
						{ color: currentColors.mutedForeground },
					]}
				>
					{insight.description}
				</Text>
			</TouchableOpacity>
		);
	};

	const renderGoalCard = (goal: ChatGoal) => {
		const progress = Math.min((goal.current / goal.target) * 100, 100);
		const isCompleted = goal.current >= goal.target;

		return (
			<View
				key={goal.id}
				style={[
					styles.goalCard,
					{
						backgroundColor: currentColors.card,
						borderColor: currentColors.border,
					},
				]}
			>
				<View style={styles.goalHeader}>
					<Text style={[styles.goalTitle, { color: currentColors.foreground }]}>
						{goal.title}
					</Text>
					<Text style={[styles.goalProgress, { color: currentColors.primary }]}>
						{goal.current}/{goal.target} {goal.unit}
					</Text>
				</View>

				<View
					style={[styles.progressBar, { backgroundColor: currentColors.muted }]}
				>
					<View
						style={[
							styles.progressFill,
							{
								backgroundColor: isCompleted
									? '#10B981'
									: currentColors.primary,
								width: `${progress}%`,
							},
						]}
					/>
				</View>

				<Text
					style={[
						styles.progressText,
						{ color: currentColors.mutedForeground },
					]}
				>
					{progress.toFixed(0)}% complete{isCompleted ? ' 🎉' : ''}
				</Text>
			</View>
		);
	};

	if (!user) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: currentColors.background },
				]}
			>
				<StatusBar
					barStyle={isDark ? 'light-content' : 'dark-content'}
					backgroundColor={currentColors.background}
				/>
				<EmptyState
					icon={{
						name: 'analytics-outline',
						size: 64,
						color: currentColors.mutedForeground,
					}}
					title="Please sign in"
					subtitle="Sign in to view your chat insights and progress"
					containerStyle={styles.centerContainer}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: currentColors.background }]}
		>
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor={currentColors.background}
			/>

			{/* Header */}
			<ScreenHeader
				title="Insights"
				showBackButton={true}
				onBackPress={() => navigation.goBack()}
			/>

			{/* Fixed Header */}
			<View
				style={[
					styles.fixedContent,
					{ backgroundColor: currentColors.background },
				]}
			>
				{/* Page Description */}
				<View style={styles.descriptionContainer}>
					<Text
						style={[
							styles.descriptionTitle,
							{ color: currentColors.foreground },
						]}
					>
						Your Chat Insights
					</Text>
					<Text
						style={[
							styles.descriptionText,
							{ color: currentColors.mutedForeground },
						]}
					>
						Track your conversations with books, discover patterns, and
						celebrate your literary journey through chat.
					</Text>
				</View>

				{/* Period Selector */}
				<View style={styles.periodContainer}>
					{(['week', 'month', 'year'] as const).map(period => (
						<TouchableOpacity
							key={period}
							style={[
								styles.periodButton,
								selectedPeriod === period
									? { backgroundColor: currentColors.primary }
									: {
											backgroundColor: currentColors.card,
											borderColor: currentColors.border,
										},
							]}
							onPress={() => setSelectedPeriod(period)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.periodText,
									{
										color:
											selectedPeriod === period
												? currentColors.primaryForeground
												: currentColors.foreground,
									},
								]}
							>
								{period.charAt(0).toUpperCase() + period.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Scrollable Content */}
			<ScrollView
				style={styles.scrollableContent}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{loading ? (
					<>
						{renderSkeletonCards()}
						<View style={styles.skeletonGoals}>
							<SkeletonLoader
								width={200}
								height={20}
								style={{ marginBottom: 16 }}
							/>
							{Array.from({ length: 2 }).map((_, index) => (
								<View
									key={index}
									style={[
										styles.skeletonGoalCard,
										{ backgroundColor: currentColors.card },
									]}
								>
									<SkeletonLoader
										width={150}
										height={18}
										style={{ marginBottom: 8 }}
									/>
									<SkeletonLoader
										width={80}
										height={14}
										style={{ marginBottom: 12 }}
									/>
									<SkeletonLoader
										width={width - 64}
										height={8}
										borderRadius={4}
									/>
								</View>
							))}
						</View>
					</>
				) : (
					<>
						{/* Insights Grid */}
						<View style={styles.insightsGrid}>
							{insights.map(renderInsightCard)}
						</View>

						{/* Chat Goals */}
						<View style={styles.goalsSection}>
							<Text
								style={[
									styles.sectionTitle,
									{ color: currentColors.foreground },
								]}
							>
								Chat Goals
							</Text>
							{goals.map(renderGoalCard)}
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 16,
		borderBottomWidth: 1,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	headerRight: {
		width: 40,
	},
	fixedContent: {
		// Fixed content that doesn't scroll
	},
	scrollableContent: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 20,
	},
	descriptionContainer: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 20,
	},
	descriptionTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 14,
		lineHeight: 20,
	},
	periodContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingBottom: 16,
		gap: 8,
	},
	periodButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
	},
	periodText: {
		fontSize: 14,
		fontWeight: '500',
	},
	insightsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginBottom: 24,
	},
	insightCard: {
		width: (width - 44) / 2, // 2 columns with gaps and padding
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: '500',
	},
	cardValue: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	changeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 4,
	},
	changeText: {
		fontSize: 12,
		fontWeight: '500',
	},
	cardDescription: {
		fontSize: 12,
		lineHeight: 16,
	},
	goalsSection: {
		marginTop: 8,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	goalCard: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 12,
	},
	goalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	goalTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	goalProgress: {
		fontSize: 14,
		fontWeight: '600',
	},
	progressBar: {
		height: 8,
		borderRadius: 4,
		marginBottom: 8,
	},
	progressFill: {
		height: '100%',
		borderRadius: 4,
	},
	progressText: {
		fontSize: 12,
		textAlign: 'center',
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	// Skeleton styles
	skeletonCard: {
		width: (width - 44) / 2,
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
	},
	skeletonCardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
	},
	skeletonGoals: {
		marginTop: 24,
	},
	skeletonGoalCard: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 12,
	},
});
