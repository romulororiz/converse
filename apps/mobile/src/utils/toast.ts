import { Toast as ToastifyToast } from 'toastify-react-native';

/**
 * Professional toast notifications using toastify-react-native
 *
 * Features:
 * - Multiple toast types (success, error, info, warning)
 * - Customizable positioning and duration
 * - Progress bars and animations
 * - Dark/light theme support
 * - Auto-dismiss functionality
 *
 * Examples:
 * toast.success('Operation completed successfully!');
 * toast.error('Something went wrong', 'Please try again later');
 * toast.info('New feature available');
 * toast.warning('Low battery');
 *
 * Custom toast:
 * toast.show({
 *   type: 'success',
 *   title: 'Custom Success',
 *   description: 'This is a custom toast',
 *   position: 'bottom',
 *   duration: 5000,
 * });
 */

export const toast = {
	/**
	 * Show a success toast
	 */
	success: (message: string, description?: string) => {
		if (description) {
			ToastifyToast.show({
				type: 'success',
				text1: message,
				text2: description,
				position: 'top',
			});
		} else {
			ToastifyToast.success(message);
		}
	},

	/**
	 * Show an error toast
	 */
	error: (message: string, description?: string) => {
		if (description) {
			ToastifyToast.show({
				type: 'error',
				text1: message,
				text2: description,
				position: 'top',
			});
		} else {
			ToastifyToast.error(message);
		}
	},

	/**
	 * Show an info toast
	 */
	info: (message: string, description?: string) => {
		if (description) {
			ToastifyToast.show({
				type: 'info',
				text1: message,
				text2: description,
				position: 'top',
			});
		} else {
			ToastifyToast.info(message);
		}
	},

	/**
	 * Show a warning toast
	 */
	warning: (message: string, description?: string) => {
		if (description) {
			ToastifyToast.show({
				type: 'warn',
				text1: message,
				text2: description,
				position: 'top',
			});
		} else {
			ToastifyToast.warn(message);
		}
	},

	/**
	 * Show a custom toast with full configuration
	 */
	show: (options: {
		type?: 'success' | 'error' | 'info' | 'warn' | 'default';
		title: string;
		description?: string;
		position?: 'top' | 'center' | 'bottom';
		duration?: number;
		onPress?: () => void;
		onShow?: () => void;
		onHide?: () => void;
	}) => {
		ToastifyToast.show({
			type: options.type || 'default',
			text1: options.title,
			text2: options.description,
			position: options.position || 'top',
			visibilityTime: options.duration || 3000,
			onPress: options.onPress,
			onShow: options.onShow,
			onHide: options.onHide,
		});
	},

	/**
	 * Hide the current toast
	 */
	hide: () => {
		ToastifyToast.hide();
	},
};

// Export default for backward compatibility
export default toast;
