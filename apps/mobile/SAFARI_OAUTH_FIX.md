# Fix: "Safari couldn't open the server" OAuth Error

This guide will help you fix the "Safari couldn't open the server" error that occurs after selecting your Google account during OAuth.

## What's Happening

The error occurs when Safari tries to redirect back to your app after Google OAuth, but the redirect URI doesn't match what's configured in your Google Cloud Console or Supabase.

## Quick Fix Steps

### 1. Check Your Redirect URIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your Web OAuth 2.0 Client ID
4. Click on it to edit
5. In "Authorized redirect URIs", make sure you have:
   ```
   interactive-library://auth
   https://auth.expo.io/@romulororiz/interactive-library
   ```

### 2. Check Your Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "URL Configuration"
3. Add these redirect URLs:
   ```
   interactive-library://auth
   https://auth.expo.io/@romulororiz/interactive-library
   ```

### 3. Check Your Supabase Google Provider

1. In Supabase dashboard, go to "Authentication" > "Providers"
2. Click on Google provider
3. Make sure it's enabled
4. Verify your Client ID and Client Secret are correct

### 4. Test the Fix

1. Clear your app data/cache
2. Restart your app
3. Try the Google sign-in again
4. Check the console logs for the redirect URI being used

## Debug Information

The updated code now logs:
- Primary Redirect URI: `interactive-library://auth`
- Fallback Redirect URI: `https://auth.expo.io/@romulororiz/interactive-library`
- Platform (iOS/Android)
- Supabase URL

Check these logs to ensure the redirect URI matches what's configured.

## Alternative Solutions

### If the issue persists, try these:

1. **Use Expo Auth Redirect Only:**
   - In Google Cloud Console, only use: `https://auth.expo.io/@romulororiz/interactive-library`
   - In Supabase, only use: `https://auth.expo.io/@romulororiz/interactive-library`

2. **Check for Typos:**
   - Make sure there are no extra spaces in your redirect URIs
   - Verify the scheme name is exactly `interactive-library`
   - Check that your Expo username is correct (`romulororiz`)

3. **Test on Different Devices:**
   - Try on both iOS and Android
   - Try on different browsers if testing on web

## Common Issues

1. **Wrong Expo Username:** Make sure `romulororiz` is your correct Expo username
2. **Wrong Project ID:** Verify your Expo project ID is `90bb907f-379f-4ca6-829a-b0d45fff7d06`
3. **Missing HTTPS:** All redirect URIs must use HTTPS (except for custom schemes)
4. **Case Sensitivity:** Redirect URIs are case-sensitive

## Still Having Issues?

If the problem persists:

1. Check the console logs for the exact redirect URI being used
2. Compare it with what's configured in Google Cloud Console
3. Make sure your Supabase project is in the same region as your app
4. Try creating a new OAuth client ID in Google Cloud Console
5. Verify your app's bundle ID matches: `com.interactivelibrary.mobile` 