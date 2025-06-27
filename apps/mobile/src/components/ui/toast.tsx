import React, { createContext, useContext, useState, useCallback } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Animated,
	Dimensions,
	StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

const { width } = Dimensions.get('window');

export type ToastProps = {
	id: string;
	title?: string;
	description?: string;
	action?: {
		altText: string;
		label: string;
		onPress: () => void;
	};
	variant?: 'default' | 'destructive' | 'success';
	duration?: number;
};

type ToastContextType = {
	toast: (props: Omit<ToastProps, 'id'>) => void;
	dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook to use the toast system
 *
 * @example
 * ```tsx
 * const { toast } = useToast();
 *
 * // Success toast
 * toast({
 *   title: 'Success!',
 *   description: 'Your message was sent successfully.',
 *   variant: 'success',
 * });
 *
 * // Error toast
 * toast({
 *   title: 'Error',
 *   description: 'Something went wrong.',
 *   variant: 'destructive',
 * });
 *
 * // Toast with action
 * toast({
 *   title: 'Update Available',
 *   description: 'A new version is available.',
 *   action: {
 *     label: 'Update',
 *     altText: 'Update the app',
 *     onPress: () => handleUpdate(),
 *   },
 * });
 * ```
 */
export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastProps[]>([]);

	const toast = useCallback((props: Omit<ToastProps, 'id'>) => {
		const id = Math.random().toString(36).substr(2, 9);
		const newToast: ToastProps = {
			...props,
			id,
			duration: props.duration ?? 5000,
		};

		setToasts(prev => [...prev, newToast]);

		// Auto dismiss
		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				dismiss(id);
			}, newToast.duration);
		}
	}, []);

	const dismiss = useCallback((id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ toast, dismiss }}>
			{children}
			<ToastViewport toasts={toasts} dismiss={dismiss} />
		</ToastContext.Provider>
	);
}

function ToastViewport({
	toasts,
	dismiss,
}: {
	toasts: ToastProps[];
	dismiss: (id: string) => void;
}) {
	return (
		<View style={styles.viewport}>
			{toasts.map(toast => (
				<ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
			))}
		</View>
	);
}

function ToastItem({
	toast,
	dismiss,
}: {
	toast: ToastProps;
	dismiss: (id: string) => void;
}) {
	const [animation] = useState(new Animated.Value(0));

	React.useEffect(() => {
		Animated.spring(animation, {
			toValue: 1,
			useNativeDriver: true,
		}).start();
	}, []);

	const handleDismiss = () => {
		Animated.timing(animation, {
			toValue: 0,
			duration: 100,
			useNativeDriver: true,
		}).start(() => {
			dismiss(toast.id);
		});
	};

	const getVariantStyles = () => {
		switch (toast.variant) {
			case 'destructive':
				return {
					backgroundColor: colors.light.destructive,
					borderColor: colors.light.destructive,
				};
			case 'success':
				return {
					backgroundColor: colors.light.success,
					borderColor: colors.light.success,
				};
			default:
				return {
					backgroundColor: colors.light.background,
					borderColor: colors.light.border,
				};
		}
	};

	const getIcon = () => {
		switch (toast.variant) {
			case 'destructive':
				return 'close-circle';
			case 'success':
				return 'checkmark-circle';
			default:
				return 'information-circle';
		}
	};

	return (
		<Animated.View
			style={[
				styles.toast,
				getVariantStyles(),
				{
					opacity: animation,
					transform: [
						{
							translateY: animation.interpolate({
								inputRange: [0, 1],
								outputRange: [-20, 0],
							}),
						},
					],
				},
			]}
		>
			<View style={styles.content}>
				<Ionicons
					name={getIcon() as any}
					size={20}
					color={
						toast.variant === 'destructive'
							? colors.light.background
							: colors.light.foreground
					}
					style={styles.icon}
				/>
				<View style={styles.textContainer}>
					{toast.title && (
						<Text
							style={[
								styles.title,
								{
									color:
										toast.variant === 'destructive'
											? colors.light.background
											: colors.light.foreground,
								},
							]}
						>
							{toast.title}
						</Text>
					)}
					{toast.description && (
						<Text
							style={[
								styles.description,
								{
									color:
										toast.variant === 'destructive'
											? colors.light.background
											: colors.light.mutedForeground,
								},
							]}
						>
							{toast.description}
						</Text>
					)}
				</View>
			</View>
			{toast.action && (
				<TouchableOpacity style={styles.action} onPress={toast.action.onPress}>
					<Text
						style={[
							styles.actionText,
							{
								color:
									toast.variant === 'destructive'
										? colors.light.background
										: colors.light.primary,
							},
						]}
					>
						{toast.action.label}
					</Text>
				</TouchableOpacity>
			)}
			<TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
				<Ionicons
					name="close"
					size={16}
					color={
						toast.variant === 'destructive'
							? colors.light.background
							: colors.light.mutedForeground
					}
				/>
			</TouchableOpacity>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	viewport: {
		position: 'absolute',
		top: 50,
		left: 20,
		right: 20,
		zIndex: 9999,
	},
	toast: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		marginBottom: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	icon: {
		marginRight: 12,
		marginTop: 2,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2,
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
	},
	action: {
		marginLeft: 12,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
	},
	actionText: {
		fontSize: 14,
		fontWeight: '500',
	},
	closeButton: {
		marginLeft: 8,
		padding: 4,
	},
});
