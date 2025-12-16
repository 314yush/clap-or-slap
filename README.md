# CapOrSlap

A fast, social, skill-based crypto intuition game. Guess whether the next token's market cap is higher or lower, build streaks, and challenge others!

## Features

- **Instant Play**: No login, no wallet required
- **Real-time Data**: Token data from DexScreener API
- **Global Leaderboards**: Weekly and all-time rankings
- **Social Sharing**: Challenge friends via URL or Warpcast
- **Mobile-first**: Designed for one-handed play

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: Upstash Redis (leaderboards)
- **Data Source**: DexScreener API
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Upstash Redis account (for leaderboards)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/caporslap.git
cd caporslap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Upstash credentials

# Run development server
npm run dev
```

### Environment Variables

```env
# DexScreener (no key needed)
DEXSCREENER_BASE_URL=https://api.dexscreener.com

# Upstash Redis (required for leaderboards)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Feature Flags
FEATURE_REPRIEVE=false
FEATURE_WALLET_CONNECT=false

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── game/          # Game endpoints
│   │   ├── leaderboard/   # Leaderboard endpoints
│   │   └── tokens/        # Token data endpoints
│   ├── leaderboard/       # Leaderboard page
│   └── page.tsx           # Main game page
├── components/            # React components
│   ├── game/              # Game UI components
│   └── leaderboard/       # Leaderboard components
├── hooks/                 # Custom React hooks
│   ├── useGame.ts         # Game state management
│   ├── useIdentity.ts     # User identity
│   └── useEnvironment.ts  # Environment detection
└── lib/                   # Core logic
    ├── game-core/         # Game mechanics
    ├── data/              # DexScreener integration
    ├── identity/          # User management
    ├── social/            # Sharing system
    └── redis.ts           # Leaderboard storage
```

## Game Flow

1. User sees a token with its market cap
2. Two buttons: **CAP** (next is higher) or **SLAP** (next is lower)
3. Correct guess → streak increases → next token appears
4. Wrong guess → game over → share option

## Architecture

The app is designed with three layers:

1. **Game Core**: Immutable game logic (comparison, streaks, sequencing)
2. **Social Layer**: Identity, sharing, leaderboards (environment-specific)
3. **Container Layer**: Web or Mini-App rendering

## Phase Roadmap

### Phase 0 (Current) - Web
- [x] Core gameplay
- [x] Anonymous users
- [x] Global leaderboard
- [x] URL sharing

### Phase 1 - Base Mini-App
- [ ] Farcaster SDK integration
- [ ] Social identity (FID)
- [ ] Cast embeds
- [ ] Friends leaderboard
- [ ] Reprieve system (paid)

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## License

MIT
