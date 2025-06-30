# Google OAuth Setup Guide - Fixed Version

This guide will help you set up Google OAuth properly for both Android and iOS to resolve the authentication issues you're experiencing.

## Current Issues Identified

1. **"Unable to exchange external code"** - This indicates problems with the OAuth callback handling
2. **"Invalid Refresh Token: Refresh Token Not Found"** - Session management issues
3. **Complex OAuth implementation** - The previous implementation was overly complex

## Step 1: Create Environment File

Create a `.env.local` file in the `apps/mobile/` directory with the following structure:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth Configuration
# You only need the Web Client ID for Supabase OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here

# Optional: Platform-specific IDs (not needed for current implementation)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here

# Other configurations
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## Step 2: Google Cloud Console Setup

### 2.1 Create/Configure Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing one
3. Enable the following APIs:
   - Google+ API
   - Google Identity API

### 2.2 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "Interactive Library"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email and any other test users)

### 2.3 Create OAuth 2.0 Client IDs

#### For Web (Primary - Required for Supabase):
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as application type
4. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `interactive-library://auth`
   - `https://auth.expo.io/@romulororiz/interactive-library`
5. Copy the Client ID and Client Secret

#### For Android (Optional - for native Google Sign-In):
1. Create another OAuth 2.0 Client ID
2. Choose "Android" as application type
3. Fill in:
   - Package name: `com.interactivelibrary.mobile`
   - SHA-1 certificate fingerprint: Get from `expo fetch:android:hashes`

#### For iOS (Optional - for native Google Sign-In):
1. Create another OAuth 2.0 Client ID
2. Choose "iOS" as application type
3. Fill in:
   - Bundle ID: `com.interactivelibrary.mobile`

## Step 3: Supabase Configuration

### 3.1 Configure Google Provider in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your credentials:
   - **Client ID**: Use your Web Client ID (from Step 2.3)
   - **Client Secret**: Use your Web Client Secret
5. Save the configuration

### 3.2 Configure Redirect URLs in Supabase

1. In Supabase dashboard, go to "Authentication" > "URL Configuration"
2. Add these redirect URLs:
   - `interactive-library://auth`
   - `https://auth.expo.io/@romulororiz/interactive-library`

## Step 4: App Configuration

### 4.1 Update app.json (Already configured correctly)

Your `app.json` already has the correct configuration:
- Scheme: `interactive-library`
- Bundle ID: `com.interactivelibrary.mobile`
- Intent filters for Android

### 4.2 Get SHA-1 Fingerprint (for Android)

Run this command to get your SHA-1 fingerprint:

```bash
cd apps/mobile
expo fetch:android:hashes
```

Add this fingerprint to your Android OAuth client ID in Google Cloud Console.

## Step 5: Testing

### 5.1 Development Testing

1. Rebuild your app:
   ```bash
   cd apps/mobile
   expo prebuild --clean
   ```

2. For Android:
   ```bash
   expo run:android
   ```

3. For iOS:
   ```bash
   expo run:ios
   ```

### 5.2 Test OAuth Flow

1. Open the app
2. Try to sign in with Google
3. Check the console logs for any errors
4. Verify that the user is created in Supabase

## Troubleshooting

### Common Issues and Solutions:

1. **"Unable to exchange external code"**
   - **Solution**: Make sure your Web Client ID and Secret are correctly configured in Supabase
   - **Check**: Verify the redirect URIs match exactly

2. **"Invalid Refresh Token"**
   - **Solution**: This is now handled by the simplified OAuth implementation
   - **Check**: Ensure Supabase is properly configured

3. **"Google Client ID not configured"**
   - **Solution**: Add the Web Client ID to your `.env.local` file
   - **Check**: Verify the environment variable name matches

4. **"Authentication cancelled"**
   - **Solution**: Check your OAuth consent screen configuration
   - **Check**: Ensure your email is added as a test user

5. **"No session established"**
   - **Solution**: The new implementation waits for Supabase to process the auth
   - **Check**: Verify Supabase Google provider is enabled

### Debug Steps:

1. **Check Environment Variables**:
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```

2. **Check Supabase Logs**:
   - Go to Supabase dashboard > Authentication > Logs
   - Look for any OAuth-related errors

3. **Check Google Cloud Console**:
   - Go to Google Cloud Console > APIs & Services > OAuth consent screen
   - Check if your app is properly configured

4. **Test with Different Accounts**:
   - Try with different Google accounts
   - Make sure test users are added to OAuth consent screen

## Security Notes

- Never commit `.env.local` to version control
- Keep your client secrets secure
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## What's Changed

The new implementation:
1. **Simplified OAuth flow** - Uses Supabase's built-in OAuth instead of manual token handling
2. **Better error handling** - More descriptive error messages
3. **Improved session management** - Properly waits for Supabase to process authentication
4. **Cross-platform compatibility** - Works the same way on both Android and iOS

## Support

If you continue to have issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are loaded correctly
3. Test with a fresh app install
4. Clear app data and try again
5. Check Supabase authentication logs
6. Ensure all redirect URIs are properly configured 