# Setup Guide - Fix Database and Storage Issues

## 1. Database Schema Update

Run the following SQL in your Supabase SQL Editor to add the missing columns to the profiles table:

```sql
-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS reading_preferences TEXT,
ADD COLUMN IF NOT EXISTS favorite_genres TEXT,
ADD COLUMN IF NOT EXISTS reading_goals TEXT;

-- Update existing profiles to have default values for new columns
UPDATE profiles 
SET 
    bio = COALESCE(bio, ''),
    reading_preferences = COALESCE(reading_preferences, ''),
    favorite_genres = COALESCE(favorite_genres, ''),
    reading_goals = COALESCE(reading_goals, '')
WHERE bio IS NULL OR reading_preferences IS NULL OR favorite_genres IS NULL OR reading_goals IS NULL;
```

## 2. Storage Bucket Setup

### Create the Avatars Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Configure the bucket with these settings:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Checked (Enable public access)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `image/*`

### Storage Policies (Optional but Recommended)

After creating the bucket, you may want to set up Row Level Security (RLS) policies:

```sql
-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow public read access to avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 3. Verify the Setup

After running the SQL and creating the bucket:

1. **Test Profile Updates**: Try editing your profile information in the app
2. **Test Image Upload**: Try uploading a profile picture
3. **Check Console**: Look for any remaining errors in the console

## 4. Troubleshooting

### If you still get "Bucket not found" error:
- Make sure the bucket name is exactly `avatars` (lowercase)
- Verify the bucket is public
- Check that your Supabase credentials are correct

### If you get database column errors:
- Make sure you ran the ALTER TABLE SQL commands
- Check that the columns were added successfully
- Verify the column names match exactly (case-sensitive)

### If image upload fails:
- Check the file size (should be under 50MB)
- Verify the file is an image (jpg, png, etc.)
- Check the browser console for detailed error messages

## 5. Additional Notes

- The new storage service includes better error handling and will provide helpful messages if the bucket doesn't exist
- The database types have been updated to include all the new columns
- The profile service now properly handles the new fields
- All changes are backward compatible with existing data 