import { validation } from '../../utils/validation';

describe('validation', () => {
	describe('email', () => {
		it('should validate correct email addresses', () => {
			expect(validation.email('test@example.com')).toBe(true);
			expect(validation.email('user.name@domain.co.uk')).toBe(true);
			expect(validation.email('user+tag@example.org')).toBe(true);
		});

		it('should reject invalid email addresses', () => {
			expect(validation.email('invalid-email')).toBe(false);
			expect(validation.email('test@')).toBe(false);
			expect(validation.email('@example.com')).toBe(false);
			expect(validation.email('')).toBe(false);
		});

		it('should reject emails longer than 254 characters', () => {
			const longEmail = 'a'.repeat(250) + '@example.com';
			expect(validation.email(longEmail)).toBe(false);
		});
	});

	describe('password', () => {
		it('should validate strong passwords', () => {
			const result = validation.password('StrongPass123!');
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject weak passwords', () => {
			const result = validation.password('weak');
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should provide specific error messages', () => {
			const result = validation.password('weak');
			expect(result.errors).toContain(
				'Password must be at least 8 characters long'
			);
		});
	});

	describe('name', () => {
		it('should validate valid names', () => {
			expect(validation.name('John')).toBe(true);
			expect(validation.name('Mary Jane')).toBe(true);
			expect(validation.name('José María')).toBe(true);
		});

		it('should reject invalid names', () => {
			expect(validation.name('A')).toBe(false); // Too short
			expect(validation.name('')).toBe(false);
			expect(validation.name('   ')).toBe(false);
		});
	});

	describe('message', () => {
		it('should validate valid messages', () => {
			expect(validation.message('Hello world')).toBe(true);
			expect(validation.message('A')).toBe(true);
		});

		it('should reject invalid messages', () => {
			expect(validation.message('')).toBe(false);
			expect(validation.message('   ')).toBe(false);
		});
	});

	describe('sanitizeInput', () => {
		it('should remove dangerous characters', () => {
			expect(validation.sanitizeInput('<script>alert("xss")</script>')).toBe(
				'scriptalert("xss")/script'
			);
		});

		it('should trim whitespace', () => {
			expect(validation.sanitizeInput('  hello world  ')).toBe('hello world');
		});

		it('should handle empty strings', () => {
			expect(validation.sanitizeInput('')).toBe('');
		});
	});
});
