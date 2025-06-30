# Fix: "Unable to exchange external code" Error

This error occurs when Google OAuth successfully returns an authorization code, but Supabase cannot exchange it for access tokens. This is almost always a configuration issue.

## Root Cause

The error `Unable to exchange external code: 4/0AVMBsJj64h2OkD7nEW12gnCBIWy8Bxwjruom1tj4JASRHXn9LdUMJdvCBhioFP24-UTCrw` means:
- ✅ OAuth flow is working (you got an authorization code)
- ❌ Supabase can't exchange the code for tokens

## Step-by-Step Fix

### 1. Check Supabase Google Provider Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Click on "Google" provider
4. **VERIFY THESE SETTINGS:**

   **Client ID:** Must be your **Web OAuth 2.0 Client ID** (not Android/iOS)
   - Format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   
   **Client Secret:** Must be your **Web OAuth 2.0 Client Secret**
   - Format: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
   
   **Enabled:** Must be checked ✅

### 2. Check Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your **Web OAuth 2.0 Client ID** (the one you're using in Supabase)
4. Click on it to edit
5. **VERIFY THESE SETTINGS:**

   **Authorized redirect URIs:**
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   interactive-library://auth
   https://auth.expo.io/@romulororiz/interactive-library
   ```

   **Authorized JavaScript origins:**
   ```
   https://your-project-ref.supabase.co
   ```

### 3. Check Supabase URL Configuration

1. In Supabase dashboard, go to "Authentication" > "URL Configuration"
2. **Add these redirect URLs:**
   ```
   interactive-library://auth
   https://auth.expo.io/@romulororiz/interactive-library
   ```

### 4. Verify Your Project Reference

Replace `your-project-ref` in the URLs above with your actual Supabase project reference.

To find your project reference:
1. Go to Supabase dashboard
2. Look at the URL: `https://app.supabase.com/project/your-project-ref`
3. Use that `your-project-ref` in the redirect URIs

### 5. Common Mistakes to Check

#### ❌ Wrong Client ID Type
- **Problem:** Using Android/iOS Client ID in Supabase
- **Solution:** Use only the **Web OAuth 2.0 Client ID**

#### ❌ Missing Client Secret
- **Problem:** Client Secret field is empty in Supabase
- **Solution:** Add your Web OAuth 2.0 Client Secret

#### ❌ Wrong Redirect URI
- **Problem:** Redirect URI doesn't match exactly
- **Solution:** Copy-paste the exact URLs, no extra spaces

#### ❌ OAuth Consent Screen Issues
- **Problem:** App not published or test users not added
- **Solution:** Add your email as a test user in OAuth consent screen

### 6. Test the Fix

1. **Clear your app cache**
2. **Restart your app**
3. **Try Google sign-in again**
4. **Check Supabase logs:**
   - Go to Supabase dashboard > Authentication > Logs
   - Look for any OAuth-related errors

### 7. Alternative: Create New OAuth Client

If the issue persists, create a fresh OAuth client:

1. In Google Cloud Console, create a new "Web application" OAuth 2.0 Client ID
2. Add the correct redirect URIs
3. Copy the new Client ID and Secret
4. Update Supabase with the new credentials
5. Test again

### 8. Debug Information

The updated code logs:
- Which redirect URI is being used
- Platform information
- Supabase URL

Check these logs to ensure everything matches your configuration.

## Still Having Issues?

If the problem persists:

1. **Check Supabase Authentication Logs** for detailed error messages
2. **Verify your Google Cloud Console project** has the correct APIs enabled
3. **Make sure your OAuth consent screen** is properly configured
4. **Try with a different Google account** to rule out account-specific issues
5. **Check if your Supabase project** is in the same region as your app

## Quick Checklist

- [ ] Using Web OAuth 2.0 Client ID (not Android/iOS)
- [ ] Client Secret is properly set in Supabase
- [ ] Redirect URIs match exactly in both Google and Supabase
- [ ] OAuth consent screen has test users added
- [ ] Supabase Google provider is enabled
- [ ] No extra spaces in any URLs 