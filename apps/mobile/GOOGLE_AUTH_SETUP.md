# Google Authentication Setup Guide

This guide will help you set up Google authentication for your React Native mobile app using Supabase.

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **Google Cloud Console**: Access to Google Cloud Console to create OAuth credentials
3. **Environment Variables**: Properly configured environment variables

## Step 1: Configure Google Cloud Console

### 1.1 Create a Google Cloud Project (if you don't have one)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google OAuth2 API"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Select "Web application" as the application type
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For your Supabase project: `https://your-project-ref.supabase.co/auth/v1/callback`
   - For mobile deep linking: `interactive-library://auth`

### 1.4 Note Your Credentials
- Copy the **Client ID** and **Client Secret**
- You'll need these for Supabase configuration

## Step 2: Configure Supabase

### 2.1 Enable Google Provider
1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Find Google and click to configure
4. Enable the Google provider
5. Enter your Google OAuth Client ID and Client Secret
6. Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

### 2.2 Configure Site URL
1. In Authentication > Settings
2. Set your Site URL to your app's URL
3. Add additional redirect URLs if needed:
   - `interactive-library://auth`
   - `exp://localhost:19000/--/auth` (for Expo development)

## Step 3: Configure Your Mobile App

### 3.1 Environment Variables
Create or update your `.env.local` file in the mobile app directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3.2 App Configuration
The app is already configured with the correct scheme in `app.json`:

```json
{
  "expo": {
    "scheme": "interactive-library",
    "plugins": ["expo-web-browser"]
  }
}
```

## Step 4: Testing

### 4.1 Development Testing
1. Start your Expo development server: `npx expo start`
2. Open the app on your device or simulator
3. Navigate to the login screen
4. Tap "Continue with Google"
5. Complete the OAuth flow in the browser
6. You should be redirected back to the app and logged in

### 4.2 Production Testing
For production builds, make sure to:
1. Update the redirect URIs in Google Cloud Console
2. Update the Site URL in Supabase settings
3. Test the deep linking functionality

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Make sure all redirect URIs are properly configured in Google Cloud Console
   - Check that the scheme matches your app.json configuration

2. **"OAuth flow cancelled"**
   - This usually happens when the user cancels the authentication
   - The app handles this gracefully with an error message

3. **"Failed to get authentication tokens"**
   - Check your Supabase configuration
   - Verify that the Google provider is enabled
   - Make sure your environment variables are correct

4. **Deep linking not working**
   - Verify the scheme in app.json matches the one used in the auth service
   - Test the deep link manually: `interactive-library://auth`

### Debug Tips

1. Check the console logs for detailed error messages
2. Verify the redirect URI being generated: it should match what's configured
3. Test the OAuth flow in a web browser first
4. Make sure your Supabase project has the correct domain settings

## Security Notes

1. **Never expose your Google Client Secret** in client-side code
2. Use environment variables for all sensitive configuration
3. Regularly rotate your OAuth credentials
4. Monitor your Google Cloud Console for unusual activity

## Additional Features

The implementation supports:
- ✅ Google OAuth flow
- ✅ Automatic user profile creation
- ✅ Session management with AsyncStorage
- ✅ Error handling and user feedback
- ✅ Deep linking support
- ✅ Both login and signup flows

## Next Steps

After successful setup, you can:
1. Customize the user profile creation logic
2. Add additional OAuth providers (Apple, Facebook, etc.)
3. Implement user role management
4. Add social features like profile pictures from Google 