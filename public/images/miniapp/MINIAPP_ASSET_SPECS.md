# Mini-App Asset Specifications

## Required Assets

### 1. Icon (icon-512.png)
- **Size**: 512x512px
- **Format**: PNG with transparent background
- **Content**: App icon maintaining dripping liquid aesthetic
- **Design**: 
  - Simplified version of logo or "COS" monogram
  - Must be recognizable at small sizes
  - Use brand gradient colors (blue → orange → pink)
  - Include liquid drip effects
- **Usage**: App icon, favicon

### 2. Splash Screen (splash-1200.png)
- **Size**: 1200x1200px
- **Format**: PNG
- **Background**: #09090b (dark)
- **Content**: 
  - Centered logo (dripping liquid wordmark)
  - Subtitle: "Higher or Lower • Crypto Edition"
  - Liquid drip effects
  - Subtle background pattern/gradients
- **Usage**: Loading splash screen in Base app

### 3. Hero/OG Image (hero-1200x630.png)
- **Size**: 1200x630px
- **Format**: PNG
- **Background**: #09090b (dark)
- **Content**:
  - Logo prominently displayed
  - Tagline: "Guess the market cap. Beat your streak."
  - Character army formation preview (3-5 characters)
  - Brand colors and gradients
- **Usage**: OpenGraph image, social sharing, app store preview

### 4. Screenshots (5 total)

#### screenshot-1-landing.png
- **Size**: 1200x800px
- **Content**: Landing page with logo, character formation, CTA buttons
- **Show**: Brand identity, value proposition

#### screenshot-2-gameplay.png
- **Size**: 1200x800px
- **Content**: Active game screen showing split-screen token comparison
- **Show**: Core gameplay, UI, tokens

#### screenshot-3-leaderboard.png
- **Size**: 1200x800px
- **Content**: Leaderboard with top players, rankings
- **Show**: Competition, social features

#### screenshot-4-loss.png
- **Size**: 1200x800px
- **Content**: Loss screen with share prompt
- **Show**: Social sharing, engagement

#### screenshot-5-streak.png
- **Size**: 1200x800px
- **Content**: Streak milestone celebration
- **Show**: Progression, achievements

## Design Guidelines

### Color Palette
- **Background**: #09090b (dark)
- **Primary Gradient**: Blue (#3B82F6) → Orange (#F97316) → Pink (#EC4899)
- **Text**: White (#FAFAFA) or brand gradient
- **Accents**: Use brand colors consistently

### Typography
- **Font**: Space Grotesk (or similar geometric sans-serif)
- **Weights**: Bold/Black for headlines
- **Sizes**: Large and readable

### Effects
- **Liquid Drips**: Include dripping liquid effects matching logo style
- **Glossy/Shiny**: Add highlights and gradients for 3D effect
- **Glow**: Subtle glow effects on key elements

### Consistency
- All assets should feel cohesive
- Match the dripping liquid aesthetic from logo
- Use consistent brand colors
- Maintain professional yet playful tone

## Export Settings

### PNG Export
- **Color Space**: RGB, sRGB
- **Compression**: Optimized for web
- **Quality**: High (90%+)
- **Transparency**: Enabled where needed

### Optimization
- Use tools like ImageOptim, TinyPNG, or Squoosh
- Target file sizes:
  - Icon: < 100KB
  - Splash: < 300KB
  - Hero: < 200KB
  - Screenshots: < 250KB each

## Tools & Resources

### Design Tools
- Figma (recommended for vector-based design)
- Adobe Illustrator
- Photoshop (for final exports)

### Reference Assets
- Logo: `/images/branding/logo-wordmark.png`
- Brand Guide: `/BRAND_GUIDE.md`
- Character specs: `/images/branding/characters/CHARACTER_SPECS.md`

### Placeholder SVGs
- SVG placeholders provided in this directory
- Can be converted to PNG using:
  - Online converters
  - ImageMagick: `convert file.svg file.png`
  - Inkscape: `inkscape file.svg --export-png=file.png`

## Next Steps

1. **Design Phase**: Create designs in Figma/Illustrator
2. **Review**: Ensure consistency with brand guidelines
3. **Export**: Generate PNG files at specified sizes
4. **Optimize**: Compress files for web
5. **Replace**: Replace SVG placeholders with final PNG assets
