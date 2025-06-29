# ElevenLabs Setup Guide

This guide will help you set up ElevenLabs for natural voice synthesis in your Interactive Library app.

## Why ElevenLabs?

ElevenLabs provides high-quality, natural-sounding voice synthesis that's much more realistic than the default expo-speech fallback. It's essential for a premium voice chat experience.

## Step 1: Get an ElevenLabs API Key

1. **Visit ElevenLabs**: Go to [https://elevenlabs.io](https://elevenlabs.io)
2. **Sign up/Login**: Create an account or log in to your existing account
3. **Get API Key**: 
   - Go to your profile settings
   - Navigate to the API section
   - Copy your API key (it should look like: `1234567890abcdef1234567890abcdef`)

## Step 2: Configure Environment Variables

1. **Open your environment file**: 
   - If you have `.env.local`, open it
   - If not, create it by copying `env.example`

2. **Add your ElevenLabs API key**:
   ```bash
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
   ```

3. **Example**:
   ```bash
   EXPO_PUBLIC_ELEVENLABS_API_KEY=1234567890abcdef1234567890abcdef
   ```

## Step 3: Restart Your App

After adding the API key, you need to restart your development server:

```bash
# Stop your current server (Ctrl+C)
# Then restart
npm start
# or
expo start
```

## Step 4: Test the Setup

1. **Open your app** and navigate to a book chat
2. **Tap the microphone button** (premium users only)
3. **Check the console logs** - you should see:
   ```
   🎤 ElevenLabs API key available: true
   🎤 Starting ElevenLabs TTS for text: ...
   🎤 Selected voice ID: ...
   🎤 ElevenLabs TTS successful, audio URI: ...
   ```

## Troubleshooting

### Issue: Still getting robotic voice
**Solution**: Check your console logs. If you see:
```
🎤 ElevenLabs API key available: false
🎤 ElevenLabs TTS failed, falling back to expo-speech
```

This means your API key is not configured correctly.

### Issue: API key not found
**Solutions**:
1. Make sure you copied the entire API key correctly
2. Ensure the environment variable name is exactly: `EXPO_PUBLIC_ELEVENLABS_API_KEY`
3. Restart your development server after adding the key
4. Check that your `.env.local` file is in the correct location (root of mobile app)

### Issue: API errors
**Solutions**:
1. Verify your ElevenLabs account has sufficient credits
2. Check that your API key is valid in the ElevenLabs dashboard
3. Ensure you're not exceeding rate limits

## Voice Selection

The app automatically selects the best voice based on the book's author and characteristics:

- **Female authors** (Jane Austen, Charlotte Brontë, etc.) → Female voices
- **Male authors** (Charles Dickens, Mark Twain, etc.) → Male voices
- **Unknown authors** → Default conversational voice

## Available Voices

The app includes several high-quality voices:
- **George** - Professional narrator (male)
- **Josh** - Warm storyteller (male)
- **Bella** - Elegant, sophisticated (female)
- **Elli** - Warm, nurturing (female)
- **Adam** - Natural, conversational (male)

## Cost Information

ElevenLabs offers:
- **Free tier**: 10,000 characters per month
- **Paid plans**: Starting at $5/month for 30,000 characters
- **Pay-as-you-go**: $0.30 per 1,000 characters

For typical book conversations, the free tier should be sufficient for testing and light usage.

## Support

If you continue having issues:
1. Check the console logs for specific error messages
2. Verify your API key in the ElevenLabs dashboard
3. Test with a simple text-to-speech request in the ElevenLabs playground 