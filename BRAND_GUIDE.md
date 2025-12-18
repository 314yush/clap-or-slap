# CapOrSlap Brand Guide

## Design Language

**Theme**: "Dripping Liquid Crypto Battle Arena"

- **Vibe**: Playful, energetic, gooey, degen-friendly, cartoonish yet edgy
- **Mood**: Fun, confident, dynamic, slightly whimsical but competitive
- **Inspiration**: Liquid/slime aesthetics, cartoon characters, crypto trading, competitive gaming
- **Key Visual**: Dripping liquid effects, glossy/shiny surfaces, vibrant gradients, character-based illustrations

## Color Palette

### Primary Colors

#### Background
- **Primary**: `#09090b` (zinc-950) - Deep black
- **Secondary**: `#18181b` (zinc-900) - Card backgrounds
- **Tertiary**: `#27272a` (zinc-800) - Elevated surfaces

#### Cap (Blue) - Higher/Gains
- **Light**: `#60a5fa` (blue-400)
- **Base**: `#3b82f6` (blue-500)
- **Dark**: `#1e40af` (blue-800)
- **Gradient**: `from-blue-400 via-blue-500 to-blue-800`

#### Or (Orange) - Energy/Action
- **Light**: `#fb923c` (orange-400)
- **Base**: `#f97316` (orange-500)
- **Dark**: `#ea580c` (orange-600)
- **Gradient**: `from-orange-400 via-orange-500 to-orange-600`

#### Slap (Pink/Red) - Lower/Losses
- **Light**: `#f472b6` (pink-400)
- **Base**: `#ec4899` (pink-500)
- **Dark**: `#be185d` (pink-700)
- **Gradient**: `from-pink-400 via-pink-500 to-pink-700`

### Action Colors

- **Success**: `#34d399` (emerald-400) - Correct guesses
- **Success Dark**: `#059669` (emerald-600)
- **Danger**: `#fb7185` (rose-400) - Losses
- **Danger Dark**: `#e11d48` (rose-600)

### Logo Gradient

**Horizontal Gradient**: Blue (Cap) → Orange (Or) → Pink/Red (Slap)
- Tailwind: `from-blue-400 via-orange-500 to-pink-500`

## Typography

### Primary Font
**Space Grotesk** - Modern, geometric, tech-forward
- Weights: 400 (regular), 500 (medium), 700 (bold), 900 (black)
- Usage: Headlines, UI text, numbers

### Font Hierarchy

- **Display Hero**: `text-5xl md:text-6xl font-black tracking-tight`
- **H1**: `text-3xl md:text-4xl font-black tracking-tight`
- **H2**: `text-2xl md:text-3xl font-bold`
- **H3**: `text-xl md:text-2xl font-bold`
- **Body**: `text-base font-normal`
- **Small**: `text-sm font-normal`
- **Label**: `text-xs font-medium uppercase tracking-widest`

### Number Styles
- **Large**: `text-4xl md:text-5xl font-black tabular-nums`
- **Medium**: `text-2xl font-bold tabular-nums`
- **Small**: `text-lg font-bold tabular-nums`

## Logo

### Primary Logo
- **File**: `/images/branding/logo-wordmark.png`
- **Style**: Dripping liquid wordmark with gradient
- **Colors**: Blue → Orange → Pink gradient
- **Effect**: Glossy/shiny finish, dark outlines, white highlights
- **Usage**: Landing page hero, branding materials

### Icon Logo (To Be Created)
- **Size**: 512x512px minimum
- **Style**: Must maintain dripping liquid aesthetic
- **Usage**: App icon, favicon

## Character Illustrations

### Token Characters
8 character designs featuring token logos as faces:

**Base-focused tokens:**
- AVNT
- HYPER
- AERO
- WELL

**EVM-focused tokens:**
- ETH
- MORPHO

**Other major tokens:**
- SOL
- BTC

### Character Style
- **Face**: Token logo as character's face
- **Body**: Humanoid/cartoon character body
- **Poses**: Army/military stances (saluting, at attention, battle-ready, marching, facing off)
- **Style**: Cartoonish, playful, energetic
- **Effects**: Liquid drips, glossy surfaces matching logo style

## Visual Effects

### Liquid Drip Animations
- **Drip**: `animate-drip` - Vertical dripping motion
- **Flow**: `animate-liquid-flow` - Subtle movement
- **Glow**: `animate-liquid-glow` - Pulsing glow effect

### Glossy Effect
- **Class**: `glossy`
- **Effect**: Gradient overlay with backdrop blur for shiny surface

### CSS Utilities
- `.liquid-drip` - Adds drip effect after element
- `.animate-drip` - Drip animation
- `.animate-liquid-flow` - Flow animation
- `.animate-liquid-glow` - Glow animation

## Component Usage

### Landing Page
- Hero logo with liquid glow effect
- Character army formation (placeholder until illustrations ready)
- Brand color gradients for accents
- Liquid drip effects on background elements

### Leaderboard
- Brand color gradients for user highlights
- Trophy/medal emojis for top 3 ranks
- Gradient text for current user

### Buttons
- Use brand color gradients for primary actions
- Liquid effect on hover/active states

## Asset Specifications

### Mini-App Assets
- **Icon**: 512x512px PNG, transparent background
- **Splash**: 1200x1200px PNG, centered logo on dark background
- **Hero/OG**: 1200x630px PNG, game preview with branding
- **Screenshots**: 1200x800px each (5 total)

### Character Illustrations
- **Format**: PNG with transparent background
- **Size**: Optimized for web (recommended 400-600px width)
- **Location**: `/images/branding/characters/`

## Implementation Notes

### Brand Colors in Code
Import from `@/lib/branding`:
```typescript
import { brandColors } from '@/lib/branding';

// Access colors
brandColors.cap.base
brandColors.or.light
brandColors.slap.gradient
```

### Assets in Code
```typescript
import { assets } from '@/lib/branding';

// Access assets
assets.logos.wordmark
assets.characters.eth
assets.miniapp.icon
```

## Base Mini-App Integration

### Manifest
- **Route**: `/.well-known/farcaster.json`
- **File**: `src/app/.well-known/farcaster.json/route.ts`
- **Update**: Account association fields after domain verification

### SDK Integration
- **Hook**: `useMiniApp()` from `@/hooks`
- **Usage**: Automatically calls `sdk.actions.ready()` when in mini-app context
- **Detection**: Checks if running in Base app vs regular web

### Metadata
- **fc:miniapp**: Added to layout.tsx generateMetadata
- **OpenGraph**: Updated with hero image
- **Twitter**: Updated with card image

## Next Steps

1. **Character Illustrations**: Design and create 8 token character illustrations
2. **Icon Creation**: Design app icon maintaining liquid aesthetic
3. **Asset Generation**: Create all mini-app required images
4. **Domain Verification**: Generate account association credentials
5. **Testing**: Test in Base Build preview tool
