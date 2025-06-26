import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingDots } from '../../components/LoadingDots';

describe('LoadingDots', () => {
	it('renders correctly with default props', () => {
		const { getByTestId } = render(<LoadingDots />);

		// The component should render without crashing
		expect(getByTestId('loading-dots')).toBeTruthy();
	});

	it('renders with custom color', () => {
		const customColor = '#FF0000';
		const { getByTestId } = render(<LoadingDots color={customColor} />);

		expect(getByTestId('loading-dots')).toBeTruthy();
	});

	it('renders with custom size', () => {
		const customSize = 12;
		const { getByTestId } = render(<LoadingDots size={customSize} />);

		expect(getByTestId('loading-dots')).toBeTruthy();
	});

	it('renders with both custom color and size', () => {
		const customColor = '#00FF00';
		const customSize = 16;
		const { getByTestId } = render(
			<LoadingDots color={customColor} size={customSize} />
		);

		expect(getByTestId('loading-dots')).toBeTruthy();
	});
});
