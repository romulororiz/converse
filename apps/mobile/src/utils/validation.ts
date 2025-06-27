import { z } from 'zod';

// Chat message validation
export const chatMessageSchema = z.object({
	content: z
		.string()
		.min(1, 'Message cannot be empty')
		.max(2000, 'Message too long (max 2000 characters)')
		.refine(
			content => content.trim().length > 0,
			'Message cannot be only whitespace'
		),
	bookId: z.string().uuid('Invalid book ID'),
});

// Auth validation schemas
export const emailSchema = z
	.string()
	.email('Invalid email address')
	.min(1, 'Email is required')
	.max(254, 'Email too long');

export const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.max(128, 'Password too long')
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
		'Password must contain at least one lowercase letter, one uppercase letter, and one number'
	);

export const confirmPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

export const nameSchema = z
	.string()
	.min(1, 'Name is required')
	.max(100, 'Name too long')
	.regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters');

// Profile validation
export const profileUpdateSchema = z.object({
	full_name: nameSchema.optional(),
	bio: z
		.string()
		.max(500, 'Bio too long (max 500 characters)')
		.optional()
		.nullable(),
	avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
	reading_preferences: z
		.string()
		.max(300, 'Reading preferences too long (max 300 characters)')
		.optional()
		.nullable(),
	favorite_genres: z
		.string()
		.max(200, 'Favorite genres too long (max 200 characters)')
		.optional()
		.nullable(),
	reading_goals: z
		.string()
		.max(200, 'Reading goals too long (max 200 characters)')
		.optional()
		.nullable(),
});

// Password change validation
export const passwordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: passwordSchema,
		confirmPassword: z.string().min(1, 'Please confirm your new password'),
	})
	.refine(data => data.newPassword === data.confirmPassword, {
		message: "New passwords don't match",
		path: ['confirmPassword'],
	});

// Search validation
export const searchQuerySchema = z
	.string()
	.min(1, 'Search query cannot be empty')
	.max(100, 'Search query too long')
	.refine(
		query => query.trim().length > 0,
		'Search query cannot be only whitespace'
	);

// Book ID validation
export const bookIdSchema = z.string().uuid('Invalid book ID');

// Insight validation
export const insightSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(60, 'Title too long (max 60 characters)'),
	content: z
		.string()
		.min(1, 'Content is required')
		.max(300, 'Content too long (max 300 characters)'),
});

// Login validation
export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, 'Password is required'),
});

// Sign up validation
export const signUpSchema = z
	.object({
		fullName: nameSchema,
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

// Forgot password validation
export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

// Voice transcription validation
export const voiceTranscriptionSchema = z
	.string()
	.min(1, 'Transcription cannot be empty')
	.max(2000, 'Transcription too long (max 2000 characters)')
	.refine(
		text => text.trim().length > 0,
		'Transcription cannot be only whitespace'
	);

// File upload validation
export const fileUploadSchema = z.object({
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name too long'),
	fileSize: z
		.number()
		.max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB limit
	fileType: z
		.string()
		.refine(
			type =>
				['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
			'Only JPEG, PNG, GIF, and WebP images are allowed'
		),
});

// Data sanitization utilities
export function sanitizeHtml(input: string): string {
	return input
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;');
}

export function sanitizeInput(input: string): string {
	return input.trim().replace(/\s+/g, ' ');
}

// SQL injection prevention
export function sanitizeForDatabase(input: string): string {
	return input
		.replace(/'/g, "''")
		.replace(/;/g, '')
		.replace(/--/g, '')
		.replace(/\/\*/g, '')
		.replace(/\*\//g, '');
}

// Validation helper functions
export function validateChatMessage(content: string, bookId: string) {
	try {
		const sanitizedContent = sanitizeInput(content);
		return chatMessageSchema.parse({
			content: sanitizedContent,
			bookId,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateEmail(email: string) {
	try {
		return emailSchema.parse(sanitizeInput(email));
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validatePassword(password: string) {
	try {
		return passwordSchema.parse(password);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateName(name: string) {
	try {
		return nameSchema.parse(sanitizeInput(name));
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateSearchQuery(query: string) {
	try {
		return searchQuerySchema.parse(sanitizeInput(query));
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateBookId(bookId: string) {
	try {
		return bookIdSchema.parse(bookId);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error('Invalid book ID');
		}
		throw error;
	}
}

export function validateInsight(title: string, content: string) {
	try {
		return insightSchema.parse({
			title: sanitizeInput(title),
			content: sanitizeInput(content),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateLogin(email: string, password: string) {
	try {
		return loginSchema.parse({
			email: sanitizeInput(email),
			password,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateSignUp(
	fullName: string,
	email: string,
	password: string,
	confirmPassword: string
) {
	try {
		return signUpSchema.parse({
			fullName: sanitizeInput(fullName),
			email: sanitizeInput(email),
			password,
			confirmPassword,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateForgotPassword(email: string) {
	try {
		return forgotPasswordSchema.parse({
			email: sanitizeInput(email),
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validatePasswordChange(
	currentPassword: string,
	newPassword: string,
	confirmPassword: string
) {
	try {
		return passwordChangeSchema.parse({
			currentPassword,
			newPassword,
			confirmPassword,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateProfileUpdate(profile: any) {
	try {
		return profileUpdateSchema.parse(profile);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateVoiceTranscription(text: string) {
	try {
		return voiceTranscriptionSchema.parse(sanitizeInput(text));
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

export function validateFileUpload(
	fileName: string,
	fileSize: number,
	fileType: string
) {
	try {
		return fileUploadSchema.parse({
			fileName,
			fileSize,
			fileType,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

// Rate limiting utility for client-side
export class ClientRateLimiter {
	private requests: Map<string, number[]> = new Map();

	constructor(
		private maxRequests: number = 10,
		private windowMs: number = 60000 // 1 minute
	) {}

	canMakeRequest(identifier: string): boolean {
		const now = Date.now();
		const windowStart = now - this.windowMs;

		const userRequests = this.requests.get(identifier) || [];
		const validRequests = userRequests.filter(time => time > windowStart);

		if (validRequests.length >= this.maxRequests) {
			return false;
		}

		validRequests.push(now);
		this.requests.set(identifier, validRequests);
		return true;
	}

	getRemainingRequests(identifier: string): number {
		const now = Date.now();
		const windowStart = now - this.windowMs;
		const userRequests = this.requests.get(identifier) || [];
		const validRequests = userRequests.filter(time => time > windowStart);

		return Math.max(0, this.maxRequests - validRequests.length);
	}
}

// API request validation
export function validateApiRequest(data: any, schema: z.ZodSchema) {
	try {
		return schema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Validation error: ${error.errors[0].message}`);
		}
		throw error;
	}
}
