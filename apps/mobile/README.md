# Interactive Library Mobile App

## Voice Chat Features

The mobile app now includes two powerful voice interaction modes that allow you to communicate with books naturally:

### 1. Quick Voice Message (Traditional)
- **Tap to Record**: Record a quick voice message 
- **Auto-Transcription**: Using OpenAI Whisper for accurate transcription
- **AI Response**: Get text-based AI responses
- **Add to Chat**: Transcribed conversation is added to your chat history

### 2. Conversational Voice Chat (NEW - ChatGPT Style)
- **Real-time Conversation**: Natural back-and-forth voice conversation
- **Live Transcription**: See what you're saying in real-time
- **ElevenLabs Integration**: Ultra-realistic voice responses using professional AI voices
- **Continuous Flow**: Automatic turn-taking with silence detection
- **Immersive UI**: Full-screen gradient orb interface similar to ChatGPT voice mode

## How to Use

### Quick Voice Message
1. **Open a Book Chat**: Navigate to any book and start a conversation
2. **Tap the Microphone**: Choose "Quick Voice Message" from the voice mode selection
3. **Record Your Message**: Tap to start recording, tap stop when done
4. **Get AI Response**: The AI responds with text that you can read
5. **Continue Chat**: The conversation is saved to your chat history

### Conversational Voice Chat  
1. **Open a Book Chat**: Navigate to any book and start a conversation
2. **Tap the Microphone**: Choose "Conversational Chat" from the voice mode selection
3. **Immersive Interface**: Full-screen dark mode with animated gradient orb
4. **Natural Conversation**: 
   - Book greets you with voice introduction
   - Speak naturally when the orb is listening (blue/purple gradient)
   - AI responds with realistic voice (green/blue gradient)
   - Automatic turn-taking continues the conversation
5. **Real-time Feedback**: See your words transcribed as you speak
6. **Close & Save**: Tap X to end - entire conversation is transcribed and saved

## Visual Indicators

### Orb States
- **Idle (Gray)**: Ready to start conversation
- **Listening (Blue/Purple)**: Recording your voice with pulse effects
- **Processing (Yellow)**: Transcribing and generating response  
- **Speaking (Green/Blue)**: AI is responding with voice

### Controls
- **Microphone Button**: Toggle between listening/muted
- **Close (X)**: End conversation and save to chat history

## Technical Features

### ElevenLabs Integration
- **Natural Voices**: Professional storyteller voices (Josh, George, Dave, Adam)
- **Streaming Audio**: Real-time audio generation and playback
- **Fallback Support**: Graceful fallback to expo-speech if ElevenLabs unavailable
- **Voice Caching**: Efficient audio file management

### Advanced Audio
- **High-Quality Recording**: 44.1kHz sample rate, AAC encoding
- **Voice Activity Detection**: Automatic speech end detection
- **Audio Session Management**: Proper iOS/Android audio handling
- **Background Audio**: Continues working in background

### AI Features
- **Contextual Responses**: AI maintains conversation context throughout
- **Book Character**: AI responds as the book itself with character knowledge
- **Natural Language**: Conversational, engaging responses optimized for voice
- **Smart Prompting**: Book-specific prompts for authentic character responses

## Setup Requirements

### Environment Variables
Add to your `.env.local` file:
```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### API Keys
1. **OpenAI API Key**: Required for Whisper transcription and GPT responses
2. **ElevenLabs API Key**: Optional but recommended for natural voice synthesis
   - Sign up at [elevenlabs.io](https://elevenlabs.io)
   - Get your API key from the account dashboard
   - Add to environment variables

### Device Permissions
- **Microphone Access**: Required for voice recording
- **Audio Playback**: Required for voice responses

## Voice Selection

The app uses different ElevenLabs voices for different moods:
- **Storyteller (Josh)**: Default - warm, engaging voice
- **Narrator (George)**: Professional, clear voice  
- **Wise (Dave)**: Thoughtful, sage-like voice
- **Conversational (Adam)**: Natural, friendly voice

## Performance & Optimization

### Audio Streaming
- **Chunked Audio**: Audio streams in real-time for immediate playback
- **Background Processing**: Non-blocking audio generation
- **Memory Management**: Automatic cleanup of temporary audio files

### Network Optimization
- **Efficient API Calls**: Optimized request sizes and caching
- **Fallback Handling**: Graceful degradation when services unavailable
- **Error Recovery**: Automatic retry logic for network issues

## Troubleshooting

### Common Issues
1. **No Voice Response**: Check ElevenLabs API key configuration
2. **Transcription Fails**: Verify OpenAI API key and network connection
3. **Audio Not Playing**: Check device audio permissions and volume
4. **Conversation Not Saving**: Ensure Supabase connection is working

### Debug Mode
Enable detailed logging by setting environment variable:
```env
EXPO_PUBLIC_DEBUG_VOICE=true
```

This enables comprehensive logging for voice features debugging. 