import React, { useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	Dimensions,
	Platform,
	ScrollView,
	Image,
	Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

const { height } = Dimensions.get('window');

interface PremiumPaywallDrawerProps {
	visible: boolean;
	onClose: () => void;
	onPurchase: (plan: 'weekly' | 'monthly' | 'yearly') => void;
	onRestore: () => void;
	onPrivacyPolicy: () => void;
}

const avatars = [
	{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' },
	{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
	{ uri: 'https://randomuser.me/api/portraits/men/65.jpg' },
	{ uri: 'https://randomuser.me/api/portraits/women/68.jpg' },
	{ uri: 'https://randomuser.me/api/portraits/men/12.jpg' },
	{ uri: 'https://randomuser.me/api/portraits/women/21.jpg' },
];

export const PremiumPaywallDrawer: React.FC<PremiumPaywallDrawerProps> = ({
	visible,
	onClose,
	onPurchase,
	onRestore,
	onPrivacyPolicy,
}) => {
	const backgroundOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			// Fade in the background when modal becomes visible
			Animated.timing(backgroundOpacity, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
		} else {
			// Reset for next time
			backgroundOpacity.setValue(0);
		}
	}, [visible]);

	return (
		<>
			{/* Fixed background overlay - appears instantly and dims */}
			{visible && (
				<Animated.View
					style={[
						styles.fixedBackground,
						{
							opacity: backgroundOpacity,
						},
					]}
				></Animated.View>
			)}

			{/* Sliding drawer modal - transparent background */}
			<Modal
				visible={visible}
				animationType='slide'
				transparent
				onRequestClose={onClose}
			>
				<TouchableOpacity
					style={styles.touchableArea}
					activeOpacity={1}
					onPress={onClose}
				/>
				<View style={styles.transparentContainer}>
					<View style={styles.drawer}>
						{/* Close button */}
						<TouchableOpacity style={styles.closeButton} onPress={onClose}>
							<Ionicons
								name='close'
								size={28}
								color={colors.light.mutedForeground}
							/>
						</TouchableOpacity>

						{/* Avatars row */}
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.avatarsRow}
						>
							{avatars.map((src, idx) => (
								<View key={idx} style={styles.avatarCircle}>
									<Image
										source={src}
										style={styles.avatarImg}
										resizeMode='cover'
									/>
								</View>
							))}
						</ScrollView>

						{/* Title and features */}
						<Text style={styles.title}>Hello History - Unlimited</Text>
						<View style={styles.featuresList}>
							<FeatureItem text='Use advanced text AI models' />
							<FeatureItem text='Generate realistic voice messages' />
							<FeatureItem text='Receive priority support' />
							<FeatureItem text='Help us improve the app' />
						</View>

						{/* Plans */}
						<View style={styles.plansContainer}>
							<PlanButton
								label='CHF 4.00 Weekly'
								onPress={() => onPurchase('weekly')}
							/>
							<PlanButton
								label='CHF 6.00 Monthly access'
								onPress={() => onPurchase('monthly')}
							/>
							<PlanButton
								label='CHF 35.00 Yearly access'
								highlight
								badge='Best value'
								onPress={() => onPurchase('yearly')}
							/>
						</View>

						{/* Info */}
						<Text style={styles.infoText}>
							Recurring billing. You will be charged to your App Store account.
							You can cancel your subscription anytime. Read more in the{' '}
							<Text style={styles.link} onPress={onPrivacyPolicy}>
								Terms of usage
							</Text>
						</Text>

						{/* Footer */}
						<View style={styles.footerRow}>
							<TouchableOpacity onPress={onRestore}>
								<Text style={styles.footerLink}>Restore Purchase</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={onPrivacyPolicy}>
								<Text style={styles.footerLink}>Privacy Policy</Text>
							</TouchableOpacity>
						</View>

						{/* Unlock button */}
						<TouchableOpacity
							style={styles.unlockBtn}
							onPress={() => onPurchase('yearly')}
						>
							<Text style={styles.unlockBtnText}>Unlock Full Access</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</>
	);
};

const FeatureItem = ({ text }: { text: string }) => (
	<View style={styles.featureItem}>
		<Ionicons
			name='checkmark-circle'
			size={20}
			color={colors.light.primary}
			style={{ marginRight: 8 }}
		/>
		<Text style={styles.featureText}>{text}</Text>
	</View>
);

const PlanButton = ({
	label,
	highlight,
	badge,
	onPress,
}: {
	label: string;
	highlight?: boolean;
	badge?: string;
	onPress: () => void;
}) => (
	<TouchableOpacity
		style={[styles.planBtn, highlight && styles.planBtnHighlight]}
		onPress={onPress}
		activeOpacity={0.85}
	>
		<Text
			style={[styles.planBtnText, highlight && styles.planBtnTextHighlight]}
		>
			{label}
		</Text>
		{badge && (
			<View style={styles.badge}>
				<Text style={styles.badgeText}>{badge}</Text>
			</View>
		)}
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.85)',
		justifyContent: 'flex-end',
	},
	fixedBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.85)',
		zIndex: 1000,
	},
	transparentContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'transparent',
	},
	touchableArea: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	drawer: {
		backgroundColor: colors.light.card,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		paddingBottom: Platform.OS === 'ios' ? 36 : 24,
		minHeight: height * 0.7,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 12,
	},
	closeButton: {
		position: 'absolute',
		top: 4,
		right: 4,
		zIndex: 10,
		padding: 8,
	},
	avatarsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 16,
		marginBottom: 24,
	},
	avatarCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: colors.light.background,
		marginHorizontal: 4,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: colors.light.cardForeground,
	},
	avatarImg: {
		width: '100%',
		height: '100%',
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: colors.light.foreground,
		textAlign: 'center',
		marginBottom: 18,
		marginTop: 4,
	},
	featuresList: {
		marginBottom: 18,
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	featureText: {
		fontSize: 16,
		color: colors.light.foreground,
	},
	plansContainer: {
		marginBottom: 18,
	},
	planBtn: {
		backgroundColor: colors.light.background,
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 18,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: colors.light.border,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	planBtnHighlight: {
		backgroundColor: '#fffbe6',
		borderColor: colors.light.primary,
		borderWidth: 2,
	},
	planBtnText: {
		fontSize: 16,
		color: colors.light.foreground,
		fontWeight: '600',
	},
	planBtnTextHighlight: {
		color: colors.light.primary,
	},
	badge: {
		backgroundColor: colors.light.primary,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginLeft: 10,
	},
	badgeText: {
		color: colors.light.primaryForeground,
		fontSize: 12,
		fontWeight: 'bold',
	},
	infoText: {
		fontSize: 13,
		color: colors.light.mutedForeground,
		textAlign: 'center',
		marginBottom: 18,
		marginTop: 2,
	},
	link: {
		color: colors.light.primary,
		textDecorationLine: 'underline',
	},
	footerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 18,
		marginTop: 2,
	},
	footerLink: {
		color: colors.light.primary,
		fontWeight: '600',
		fontSize: 15,
	},
	unlockBtn: {
		backgroundColor: colors.light.primary,
		borderRadius: 30,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 2,
	},
	unlockBtnText: {
		color: colors.light.primaryForeground,
		fontSize: 18,
		fontWeight: 'bold',
	},
});

export default PremiumPaywallDrawer;
