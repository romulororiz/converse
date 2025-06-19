# 📚 Interactive Library

> **Talk to books as if they were real people** - Get insights, information, and deep understanding through conversational AI-powered book interactions.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49-black?style=for-the-badge&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-1.10-black?style=for-the-badge&logo=turborepo)](https://turbo.build/)

## 🎯 What is Interactive Library?

Interactive Library is a revolutionary platform that transforms how you engage with books. Instead of just reading, you can now have meaningful conversations with any book in your library. Ask questions, get insights, explore themes, and dive deeper into the content through AI-powered chat interactions.

### ✨ Key Features

- **🤖 AI-Powered Book Conversations** - Chat with any book 
- **📚 Extensive Book Library** - Access to thousands of books across all genres
- **💡 Intelligent Insights** - Get personalized recommendations and reading insights
- **🔍 Deep Analysis** - Explore themes, characters, and plot elements through conversation
- **🎯 Personalized Experience** - AI learns your preferences and reading style

## 🏗️ Architecture

This project is built as a **monorepo** using [Turborepo](https://turbo.build/) and [pnpm workspaces](https://pnpm.io/workspaces) for optimal development experience.

```
interactive-library/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native mobile app (Expo)
├── packages/
│   └── shared/       # Shared types and utilities
└── docs/             # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework for web
- **React Native** - Cross-platform mobile development
- **Expo** - React Native development platform
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service (Database, Auth, Real-time)
- **OpenAI API** - AI-powered conversations
- **Vercel** - Web app deployment
- **Expo Application Services** - Mobile app deployment

### Development Tools
- **Turborepo** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+
- **Expo CLI** (for mobile development)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/romulororiz/converse.git
   cd interactive-library
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp apps/web/.env.example apps/web/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   ```

4. **Configure your environment variables**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   ```

### Development

#### Web App
```bash
# Start the web development server
pnpm dev --filter=web

# Open http://localhost:3000
```

#### Mobile App
```bash
# Start the mobile development server
pnpm dev --filter=mobile

# Scan QR code with Expo Go app
```

#### Both Apps
```bash
# Start both web and mobile
pnpm dev
```

## 📱 Mobile App Setup

1. **Install Expo Go** on your device
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the development server**
   ```bash
   cd apps/mobile
   pnpm start
   ```

3. **Scan the QR code** with Expo Go to run the app on your device

## 🎨 UI/UX Design

The app features a modern, Audible-inspired design with:

- **Clean, minimalist interface** with focus on content
- **Intuitive navigation** with bottom tabs on mobile
- **Smooth animations** and transitions
- **Accessible design** following WCAG guidelines
- **Responsive layout** that works on all devices
- **Dark/light mode** support (coming soon)

## 🔧 Available Scripts

### Root Level
```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps for production
pnpm lint         # Lint all packages
pnpm test         # Run tests across all packages
pnpm clean        # Clean all build artifacts
```

### Web App
```bash
pnpm dev --filter=web     # Start web development server
pnpm build --filter=web   # Build web app for production
pnpm start --filter=web   # Start production web server
```

### Mobile App
```bash
pnpm dev --filter=mobile  # Start mobile development server
pnpm build --filter=mobile # Build mobile app
pnpm eject --filter=mobile # Eject from Expo managed workflow
```

## 📁 Project Structure

```
interactive-library/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/              # Next.js app router pages
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── lib/             # Utilities and configurations
│   │   │   ├── services/        # API services
│   │   │   └── types/           # TypeScript type definitions
│   │   └── public/              # Static assets
│   └── mobile/
│       ├── src/
│       │   ├── screens/         # Mobile app screens
│       │   ├── components/      # Mobile-specific components
│       │   ├── navigation/      # React Navigation setup
│       │   ├── services/        # Mobile API services
│       │   └── utils/           # Mobile utilities
│       └── assets/              # Mobile assets
├── packages/
│   └── shared/
│       └── src/
│           └── types/           # Shared TypeScript types
├── docs/                        # Documentation
├── turbo.json                   # Turborepo configuration
├── pnpm-workspace.yaml          # pnpm workspace configuration
└── package.json                 # Root package.json
```

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   pnpm lint
   pnpm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Create a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the AI capabilities
- **Supabase** for the backend infrastructure
- **Vercel** for hosting and deployment
- **Expo** for the mobile development platform
- **Turborepo** for the monorepo tooling

## 🚀 Roadmap

- [ ] **Audio narration** for book conversations
- [ ] **Multi-language support** for international users
- [ ] **Social features** - share insights with friends
- [ ] **Advanced analytics** - detailed insights
- [ ] **Voice commands** - hands-free book interactions

---

<div align="center">
  <p>Made with ❤️ by the Interactive Library team</p>
  <p>
    <a href="https://github.com/romulororiz/converse/stargazers">
      <img src="https://img.shields.io/github/stars/romulororiz/converse?style=social" alt="Stars">
    </a>
    <a href="https://github.com/romulororiz/converse/network/members">
      <img src="https://img.shields.io/github/forks/romulororiz/converse?style=social" alt="Forks">
    </a>
    <a href="https://github.com/romulororiz/converse/issues">
      <img src="https://img.shields.io/github/issues/romulororiz/converse" alt="Issues">
    </a>
  </p>
</div> 