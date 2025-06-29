# Google OAuth Setup Guide

This guide will help you set up Google OAuth for your Interactive Library app to resolve authentication issues on Android and iOS.

## Prerequisites

1. A Google Cloud Console account
2. Your Expo project ID: `90bb907f-379f-4ca6-829a-b0d45fff7d06`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity API

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Interactive Library"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email and any other test users)

## Step 3: Create OAuth 2.0 Client IDs

### For Android:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Android" as application type
4. Fill in the details:
   - Package name: `com.interactivelibrary.mobile`
   - SHA-1 certificate fingerprint: Get this from your Expo project
5. Copy the Client ID

### For iOS:
1. Create another OAuth 2.0 Client ID
2. Choose "iOS" as application type
3. Fill in the details:
   - Bundle ID: `com.interactivelibrary.mobile`
4. Copy the Client ID

### For Web (optional):
1. Create another OAuth 2.0 Client ID
2. Choose "Web application" as application type
3. Add authorized redirect URIs:
   - `https://auth.expo.io/@romulororiz/interactive-library`
   - `interactive-library://auth`
4. Copy the Client ID

## Step 4: Get SHA-1 Certificate Fingerprint

For Android, you need the SHA-1 fingerprint. Run this command in your project directory:

```bash
# For development
expo fetch:android:hashes

# For production (after building)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Step 5: Update Environment Variables

Create or update your `.env.local` file with the client IDs:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
```

## Step 6: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google Client IDs:
   - Client ID: Use your Web Client ID
   - Client Secret: Get this from Google Cloud Console

## Step 7: Test the Configuration

1. Rebuild your app:
   ```bash
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

## Troubleshooting

### Common Issues:

1. **"Google Client ID not configured"**
   - Make sure you've added the correct environment variables
   - Check that the client IDs match your platform

2. **"Authentication cancelled"**
   - Verify your OAuth consent screen is configured correctly
   - Check that your email is added as a test user
   - Ensure the redirect URI is correct

3. **"No session established"**
   - Check your Supabase Google provider configuration
   - Verify the client ID and secret in Supabase match Google Cloud Console

4. **Push Notification Errors**
   - Make sure you have the notification icon in `./assets/notification-icon.png`
   - Check that your Expo project ID is correct
   - Verify FCM configuration if using Firebase

### Debug Steps:

1. Check the console logs for detailed error messages
2. Verify all environment variables are loaded correctly
3. Test with a fresh app install
4. Clear app data and try again

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your client secrets secure
- Regularly rotate your OAuth credentials
- Monitor your OAuth usage in Google Cloud Console

## Support

If you continue to have issues:

1. Check the Expo documentation on OAuth
2. Review Google Cloud Console logs
3. Check Supabase authentication logs
4. Ensure all redirect URIs are properly configured 