import {
	validateEmail,
	validatePassword,
	validateName,
	validateChatMessage,
	sanitizeInput,
} from '../../utils/validation';

describe('validation', () => {
	describe('email', () => {
		it('should validate correct email addresses', () => {
			expect(() => validateEmail('test@example.com')).not.toThrow();
			expect(() => validateEmail('user.name@domain.co.uk')).not.toThrow();
			expect(() => validateEmail('user+tag@example.org')).not.toThrow();
		});

		it('should reject invalid email addresses', () => {
			expect(() => validateEmail('invalid-email')).toThrow();
			expect(() => validateEmail('test@')).toThrow();
			expect(() => validateEmail('@example.com')).toThrow();
			expect(() => validateEmail('')).toThrow();
		});

		it('should reject emails longer than 254 characters', () => {
			const longEmail = 'a'.repeat(250) + '@example.com';
			expect(() => validateEmail(longEmail)).toThrow();
		});
	});

	describe('password', () => {
		it('should validate strong passwords', () => {
			expect(() => validatePassword('StrongPass123!')).not.toThrow();
		});

		it('should reject weak passwords', () => {
			expect(() => validatePassword('weak')).toThrow();
		});

		it('should provide specific error messages', () => {
			try {
				validatePassword('weak');
			} catch (error) {
				expect(error.message).toContain('8 characters');
			}
		});
	});

	describe('name', () => {
		it('should validate valid names', () => {
			expect(() => validateName('John')).not.toThrow();
			expect(() => validateName('Mary Jane')).not.toThrow();
			expect(() => validateName('José María')).not.toThrow();
		});

		it('should reject invalid names', () => {
			expect(() => validateName('A')).toThrow(); // Too short
			expect(() => validateName('')).toThrow();
			expect(() => validateName('   ')).toThrow();
		});
	});

	describe('message', () => {
		it('should validate valid messages', () => {
			expect(() =>
				validateChatMessage(
					'Hello world',
					'f47ac10b-58cc-4372-a567-0e02b2c3d479'
				)
			).not.toThrow();
			expect(() =>
				validateChatMessage('A', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
			).not.toThrow();
		});

		it('should reject invalid messages', () => {
			expect(() =>
				validateChatMessage('', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
			).toThrow();
			expect(() =>
				validateChatMessage('   ', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
			).toThrow();
		});
	});

	describe('sanitizeInput', () => {
		it('should trim whitespace', () => {
			expect(sanitizeInput('  hello world  ')).toBe('hello world');
		});

		it('should normalize multiple spaces', () => {
			expect(sanitizeInput('hello    world')).toBe('hello world');
		});

		it('should handle empty strings', () => {
			expect(sanitizeInput('')).toBe('');
		});
	});
});
