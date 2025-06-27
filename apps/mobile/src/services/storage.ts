import { supabase } from '../lib/supabase';
import { validateFileUpload } from '../utils/validation';

export interface UploadResult {
	url: string;
	path: string;
	error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload (blob or file object)
 * @param bucketName - The bucket name (default: 'avatars')
 * @param fileName - The file name
 * @param options - Upload options
 */
export async function uploadFile(
	file: Blob | File,
	bucketName: string = 'avatars',
	fileName: string,
	options: {
		cacheControl?: string;
		upsert?: boolean;
	} = {}
): Promise<UploadResult> {
	try {
		console.log(`Starting upload to bucket: ${bucketName}, file: ${fileName}`);
		console.log('File details:', {
			size: file.size,
			type: file.type,
			lastModified: (file as File).lastModified || 'N/A',
		});

		// Validate file using Zod
		try {
			validateFileUpload(fileName, file.size, file.type);
		} catch (error) {
			return {
				url: '',
				path: '',
				error:
					error instanceof Error ? error.message : 'File validation failed',
			};
		}

		// Validate file
		if (!file || file.size === 0) {
			throw new Error('File is empty or invalid');
		}

		// First, try to create the bucket if it doesn't exist
		await createBucketIfNotExists(bucketName);

		// Upload the file
		const { data, error } = await supabase.storage
			.from(bucketName)
			.upload(fileName, file, {
				cacheControl: options.cacheControl || '3600',
				upsert: options.upsert || false,
			});

		if (error) {
			console.error('Upload error:', error);
			return { url: '', path: '', error: error.message };
		}

		console.log('Upload successful, data:', data);

		// Get the public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from(bucketName).getPublicUrl(fileName);

		console.log('Generated public URL:', publicUrl);

		// Ensure the URL is properly formatted
		const finalUrl = publicUrl.startsWith('http')
			? publicUrl
			: `https://${publicUrl}`;
		console.log('Final URL:', finalUrl);

		// Verify the file was actually uploaded by checking its size
		try {
			const { data: fileInfo } = await supabase.storage
				.from(bucketName)
				.list('', {
					search: fileName,
				});

			if (fileInfo && fileInfo.length > 0) {
				console.log('File verification successful:', fileInfo[0]);
			} else {
				console.warn('File verification failed - file not found in listing');
			}
		} catch (verifyError) {
			console.warn('Could not verify file upload:', verifyError);
		}

		return {
			url: finalUrl,
			path: data.path,
		};
	} catch (error) {
		console.error('Storage service error:', error);
		return {
			url: '',
			path: '',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Create a bucket if it doesn't exist
 * Note: This requires admin privileges or proper RLS policies
 */
async function createBucketIfNotExists(bucketName: string): Promise<void> {
	try {
		// Try to list buckets to see if our bucket exists
		const { data: buckets, error } = await supabase.storage.listBuckets();

		if (error) {
			console.warn('Could not list buckets:', error);
			return; // Continue anyway, the upload might still work
		}

		const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

		if (!bucketExists) {
			console.log(
				`Bucket '${bucketName}' does not exist. Please create it in your Supabase dashboard.`
			);
			console.log(
				'Go to Storage > Create a new bucket with the following settings:'
			);
			console.log(`- Name: ${bucketName}`);
			console.log('- Public bucket: true');
			console.log('- File size limit: 50MB');
			console.log('- Allowed MIME types: image/*');
		}
	} catch (error) {
		console.warn('Error checking bucket existence:', error);
	}
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
	bucketName: string,
	fileName: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await supabase.storage
			.from(bucketName)
			.remove([fileName]);

		if (error) {
			console.error('Delete error:', error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		console.error('Delete service error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Get a public URL for a file
 */
export function getPublicUrl(bucketName: string, fileName: string): string {
	const {
		data: { publicUrl },
	} = supabase.storage.from(bucketName).getPublicUrl(fileName);

	return publicUrl;
}
