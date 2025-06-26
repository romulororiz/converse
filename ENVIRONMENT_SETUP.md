# Environment Configuration Guide

This guide explains how to set up environment variables for different stages of development and deployment.

## Environment Files Structure

```
converse/
├── apps/
│   ├── mobile/
│   │   ├── .env.local          # Local development (gitignored)
│   │   ├── .env.staging        # Staging environment
│   │   ├── .env.production     # Production environment
│   │   └── env.example         # Template file
│   └── web/
│       ├── .env.local          # Local development (gitignored)
│       ├── .env.staging        # Staging environment
│       ├── .env.production     # Production environment
│       └── .env.example        # Template file
```

## Required Environment Variables

### Mobile App (.env.local)

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id_here

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Web App (.env.local)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Environment Setup Instructions

### 1. Local Development

1. Copy the example files:
   ```bash
   # Mobile app
   cp apps/mobile/env.example apps/mobile/.env.local
   
   # Web app
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Fill in your actual API keys and configuration values

3. Never commit `.env.local` files to version control

### 2. Staging Environment

1. Create `.env.staging` files with staging-specific values
2. Use staging API keys and endpoints
3. These files can be committed to version control (with non-sensitive data)

### 3. Production Environment

1. Create `.env.production` files with production values
2. Use production API keys and endpoints
3. These files should be managed securely (not in version control)

## Environment-Specific Configurations

### Development
- Use development API keys
- Enable debug logging
- Use local development URLs

### Staging
- Use staging API keys
- Enable limited logging
- Use staging URLs

### Production
- Use production API keys
- Disable debug logging
- Use production URLs
- Enable all security features

## Security Best Practices

1. **Never commit sensitive keys** to version control
2. **Use different API keys** for each environment
3. **Rotate keys regularly** for production
4. **Use environment-specific** Supabase projects
5. **Enable API key restrictions** where possible

## CI/CD Environment Variables

For GitHub Actions, set these secrets in your repository:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `NEXTAUTH_SECRET`

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Restart your development server
   - Check file naming (`.env.local` not `.env`)
   - Verify variable names match exactly

2. **API key errors**
   - Verify keys are correct
   - Check API key permissions
   - Ensure keys are for the right environment

3. **Build errors**
   - Check all required variables are set
   - Verify variable names in code match `.env` files
   - Ensure no typos in variable names

### Validation

Use the validation utilities to check your environment:

```bash
# Mobile app
cd apps/mobile
pnpm validate:env

# Web app
cd apps/web
pnpm validate:env
``` 