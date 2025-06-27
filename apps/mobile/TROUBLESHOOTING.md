# Troubleshooting Guide

## 🚨 Current Issues & Solutions

### 1. Crypto 'subtle' Undefined Error
**Error**: `TypeError: Cannot read property 'subtle' of undefined`

**Solution**: ✅ **FIXED**
- Added crypto polyfill in `src/lib/polyfills.js`
- Provides basic crypto operations for React Native environment

### 2. EventTarget Reference Error
**Error**: `ReferenceError: Property 'EventTarget' doesn't exist`

**Solution**: ✅ **FIXED**
- Added EventTarget, Event, and CustomEvent polyfills
- Provides DOM event system for React Native environment

### 3. React Reference Error
**Error**: `ReferenceError: Property 'React' doesn't exist`

**Solution**: ✅ **FIXED**
- Added missing React import to ToastProvider component
- Updated babel configuration to use modern JSX transform
- Removed deprecated `@babel/plugin-transform-react-jsx` plugin

### 4. Section Component Error
**Error**: `View config getter callback for component 'section' must be a function`

**Solution**: ✅ **FIXED**
- Replaced web-based `sonner` toast library with custom React Native toast component
- Created shadcn-style toast system compatible with React Native
- Removed `sonner` dependency and updated all toast usages

### 5. Expo AV Deprecation Warning
**Warning**: `expo-av has been deprecated and will be removed in SDK 54`

**Solution**: ⚠️ **PLANNED MIGRATION**
- Current: Using `expo-av` for audio functionality
- Future: Migrate to `expo-audio` and `expo-video` packages
- **Action**: Plan migration for SDK 54 upgrade

### 6. Expo Notifications Limitation
**Warning**: `Android Push notifications functionality was removed from Expo Go with SDK 53`

**Solution**: ✅ **CONFIGURED**
- Created EAS build configuration (`eas.json`)
- Added development build scripts
- **Action**: Use development builds instead of Expo Go

## 🛠️ Development Build Setup

### Prerequisites
1. Install EAS CLI:
```bash
npm install -g @expo/eas-cli
```

2. Login to Expo:
```bash
eas login
```

### Build Development Client
```bash
# Build for all platforms
npm run build:dev

# Build for specific platform
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Install Development Build
1. Download the build from EAS
2. Install on your device
3. Run `expo start --dev-client`

## 🔄 Migration Plan

### Phase 1: Immediate (Current)
- ✅ Fix crypto polyfill
- ✅ Fix EventTarget polyfill
- ✅ Fix React import issues
- ✅ Update JSX transform configuration
- ✅ Replace web-based toast with React Native compatible solution
- ✅ Configure development builds
- ✅ Add build scripts

### Phase 2: Short-term (Next Sprint)
- [ ] Migrate from `expo-av` to `expo-audio`/`expo-video`
- [ ] Test all audio functionality
- [ ] Update voice components

### Phase 3: Long-term (SDK 54)
- [ ] Complete audio migration
- [ ] Update all dependencies
- [ ] Performance optimization

## 🧪 Testing

### Current Status
- ✅ Crypto polyfill working
- ✅ EventTarget polyfill working
- ✅ React imports fixed
- ✅ JSX transform updated
- ✅ Toast system replaced with React Native compatible solution
- ✅ Development build configuration ready
- ⚠️ Audio functionality needs testing with development build

### Test Checklist
- [ ] App launches without crypto errors
- [ ] App launches without EventTarget errors
- [ ] App launches without React reference errors
- [ ] App launches without section component errors
- [ ] JSX transform works correctly
- [ ] Toast notifications work properly
- [ ] Voice recording works in development build
- [ ] Audio playback functions correctly
- [ ] Notifications work in development build
- [ ] All existing features remain functional

## 📱 Development Workflow

### For Development
1. Use development build instead of Expo Go
2. Run `npm run build:dev` to create development client
3. Install development build on device
4. Use `expo start --dev-client` for development

### For Testing
1. Use preview builds for testing
2. Run `npm run build:preview`
3. Share build with testers

### For Production
1. Use production builds
2. Run `npm run build:prod`
3. Submit to app stores

## 🔍 Debug Commands

```bash
# Clear Metro cache
npx expo start --clear

# Clear all caches
npx expo start --clear --reset-cache

# Check for issues
npx expo doctor

# Validate configuration
eas build:configure
```

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Expo documentation
3. Check EAS build logs
4. Test with development build 