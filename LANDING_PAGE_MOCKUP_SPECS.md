# Landing Page Mockup Specifications

This document provides detailed specifications for designing assets for the CapOrSlap landing page. The landing page uses a minimal design with a plain black background, allowing your custom assets to shine.

## Layout Overview

**Container:**
- Full viewport height (`min-h-screen`)
- Centered content (`flex flex-col items-center justify-center`)
- Horizontal padding: `px-6` (24px)
- Max content width: `max-w-4xl` (896px)
- Background: Pure black (`#000000` or `bg-black`)

**Vertical Stack (top to bottom):**
1. Logo (spacing: `mb-12` - 48px)
2. Tagline (spacing: `mb-8` - 32px)
3. Comparison Cards Section (spacing: `mb-8` - 32px)
4. CTA Buttons (spacing: `mb-8` - 32px)
5. Background Characters Row (spacing: `mb-8` - 32px)
6. Stats Section (spacing: `mb-8` - 32px)
7. Footer (absolute bottom, 24px from bottom)

## Asset Specifications

### 1. Logo Image

**File Path**: `/public/images/branding/logo-wordmark.png`

**Current Status**: ✅ Already exists

**Display Specifications:**
- **Container**: `max-w-lg` (512px) on desktop, full width with padding on mobile
- **Aspect Ratio**: Maintain original (approximately 2.5:1)
- **Position**: Centered, top of content stack
- **Styling**: No CSS filters, no effects - just the image as-is
- **Responsive**: Scales down proportionally on mobile

**Design Requirements:**
- ✅ Transparent background PNG
- ✅ Works on pure black background (#000000)
- ✅ High resolution (recommended: 1000x400px for retina displays)
- ✅ No effects needed in CSS (any glow/effects should be baked into the image)
- ✅ Should be clearly visible against black background

**Recommended Dimensions:**
- Base: 500x200px (or maintain 2.5:1 aspect ratio)
- Retina: 1000x400px (2x for high-DPI displays)

---

### 2. Background Characters

**File Path**: `/public/images/branding/characters/characters.png`

**Note**: A single image file containing all characters arranged horizontally (sprite sheet). Each character will be displayed from a different position in the image.

**Display Specifications:**
- **Container**: Full width, centered, flex-wrap enabled
- **Layout**: Horizontal row on desktop, wraps to multiple rows on mobile
- **Spacing**: `gap-4` (16px) between characters
- **Character Size**: 
  - Desktop: `w-24 h-24` (96px × 96px)
  - Mobile: `w-16 h-16` (64px × 64px)
- **Position**: Below CTA buttons, above stats section
- **Z-index**: Same as main content (z-10)
- **Opacity**: 70% (`opacity-70`) - characters are subtle background elements
- **Method**: CSS background-image with background-position to show different regions

**Design Requirements:**
- ✅ PNG format with transparent background
- ✅ All characters arranged horizontally in a single row
- ✅ Each character should be evenly spaced/positioned
- ✅ Image should be wide enough to accommodate all characters
- ✅ Should be visible but not overpowering

**Recommended Dimensions:**
- **Width**: 8 × character width (e.g., if each character is 200px wide, image should be 1600px wide)
- **Height**: Character height (e.g., 200px to 400px)
- **Layout**: Characters arranged left-to-right, evenly spaced
- **Format**: PNG with alpha channel

**Example Layout:**
If you have 8 characters, arrange them horizontally:
```
[Character 1] [Character 2] [Character 3] [Character 4] [Character 5] [Character 6] [Character 7] [Character 8]
```

**Design Notes:**
- Characters should maintain the "dripping liquid" aesthetic from the logo
- All characters should be the same size and evenly spaced
- Can be token characters or generic crypto characters
- Consider army/military poses as specified in brand guide
- The code automatically extracts each character using CSS background-position

**Implementation:**
Upload your sprite sheet image to:
`/public/images/branding/characters/characters.png`

The landing page will automatically display each character from different positions in the image. The code uses CSS `background-position` to show each character (positions: 0%, 14.3%, 28.6%, 42.9%, 57.1%, 71.4%, 85.7%, 100%).

---

### 3. Background Pattern/Image (Optional)

**File Path**: `/public/images/branding/background-pattern.png` (or similar name)

**Display Specifications:**
- **Position**: Absolute, full viewport (`absolute inset-0`)
- **Z-index**: `z-0` (behind everything)
- **Styling**: 
  - Opacity: `opacity-10` to `opacity-30` (10-30% opacity)
  - `object-cover` if single image
  - Can be repeating pattern or single full-screen image
- **Background Color**: Pure black (#000000) behind pattern

**Design Requirements:**
- ✅ Very subtle design (low opacity)
- ✅ Works on pure black background
- ✅ Can be a texture, pattern, or abstract design
- ✅ Must not interfere with readability of content
- ✅ Consider liquid drip patterns, grid, or abstract shapes matching brand

**Recommended Dimensions:**
- Single Image: 1920x1080px or larger (full HD minimum)
- Repeating Pattern: 512x512px or 1024x1024px (tileable)
- Format: PNG with transparency or JPG

**Design Notes:**
- Should be extremely subtle - barely visible
- Consider using brand colors (blue, orange, pink) at very low opacity
- Can include liquid drip effects, grid patterns, or abstract shapes
- Test at 10-30% opacity to ensure it doesn't distract

**Implementation Example:**
```tsx
<div className="absolute inset-0 z-0 opacity-10">
  <Image
    src="/images/branding/background-pattern.png"
    alt=""
    fill
    className="object-cover"
    priority
  />
</div>
```

---

### 4. Comparison Cards

**Status**: ✅ Already implemented (simplified, no decorative elements needed)

**Current Design:**
- Simple border: `border-2 border-white/20` (2px white border at 20% opacity)
- Subtle background: `bg-white/5` (5% white overlay)
- Border radius: `rounded-2xl` (16px)
- Padding: `p-6` (24px)
- No effects, glows, or animations

**Content:**
- Token symbol (large, centered, white text)
- Market cap value or "?" (centered below, white text)

**Design Notes:**
- Cards are minimal by design - no decorative elements needed
- If you want to customize, you can add subtle background colors or patterns
- Keep it clean and simple to maintain focus on your uploaded assets

---

## Responsive Breakpoints

### Mobile (< 768px)
- **Logo**: Full width with horizontal padding (24px)
- **Characters**: Smaller (64px × 64px), wrap to multiple rows if needed
- **Comparison Cards**: Stack vertically or smaller side-by-side
- **Stats**: Stack vertically
- **Tagline**: Smaller text sizes (`text-xl` instead of `text-2xl`)

### Desktop (≥ 768px)
- **Logo**: Max 512px width, centered
- **Characters**: Larger (96px × 96px), single row if possible
- **Comparison Cards**: Side-by-side with "VS" in middle
- **Stats**: Horizontal row
- **Tagline**: Larger text sizes (`text-2xl` and `text-4xl`)

---

## Color Palette Reference

**Background**: Pure black `#000000`

**Text Colors:**
- Primary: White `#FFFFFF`
- Secondary: `#A1A1AA` (zinc-400)
- Accent: Yellow `#FACC15` (yellow-400)

**Border Colors:**
- Subtle white: `rgba(255, 255, 255, 0.2)` (20% opacity)

---

## Design Checklist

### Logo
- [ ] Transparent background PNG
- [ ] Works on pure black (#000000)
- [ ] Size: 500x200px base (or maintain aspect ratio)
- [ ] High resolution (2x for retina: 1000x400px)
- [ ] No CSS effects needed (effects baked into image)

### Characters (Single sprite sheet)
- [ ] Single image with all characters - `characters.png`
- [ ] Transparent background PNG
- [ ] Characters arranged horizontally in a row
- [ ] Width: 8 × character width (e.g., 1600px for 8 × 200px characters)
- [ ] Height: Character height (e.g., 200px to 400px)
- [ ] All characters evenly spaced
- [ ] Visible but subtle (70% opacity applied in code)

### Background Pattern (Optional)
- [ ] Subtle pattern/texture
- [ ] Works on black background
- [ ] Low opacity design (10-30%)
- [ ] Size: 1920x1080px or larger
- [ ] Can be repeating pattern or full image

---

## File Structure

```
public/
└── images/
    └── branding/
        ├── logo-wordmark.png          ✅ (already exists)
        ├── background-pattern.png     ⏳ (optional, to be created)
        └── characters/
            └── characters.png         ⏳ (sprite sheet with all characters, to be created)
```

---

## Testing Guidelines

After uploading assets:

1. **Logo**: Verify it displays correctly on black background, scales properly on mobile
2. **Characters**: Check all 8 characters load, are properly sized, and maintain aspect ratio
3. **Background Pattern**: If added, verify it's subtle and doesn't interfere with readability
4. **Responsive**: Test on mobile (< 768px) and desktop (≥ 768px) breakpoints
5. **Performance**: Ensure images are optimized (compressed PNGs, appropriate sizes)

---

## Implementation Notes

### Adding Characters Sprite Sheet to Landing Page

Once your sprite sheet image is ready, simply upload it to:
`/public/images/branding/characters/characters.png`

The landing page is already configured to automatically extract and display each character from different positions in the image. If you need to change the image path, update it in `LandingPage.tsx`:

```tsx
{/* Background Characters - Single image with all characters */}
<div className="w-full mb-8 flex justify-center items-center gap-4 flex-wrap">
  {Array.from({ length: 8 }).map((_, i) => (
    <div 
      key={i} 
      className="w-16 h-16 md:w-24 md:h-24 relative opacity-70"
      style={{
        backgroundImage: 'url(/images/branding/characters/characters.png)',
        backgroundSize: '800% 100%', // 8 characters = 800% width
        backgroundPosition: `${(i * 100) / 7}% 0%`, // Distribute across 8 positions
        backgroundRepeat: 'no-repeat',
      }}
    />
  ))}
</div>
```

**How it works:**
- The image is set as a background-image
- `backgroundSize: '800% 100%'` scales the image so each character takes up 1/8 of the container
- `backgroundPosition` shifts the view to show each character (0%, 14.3%, 28.6%, etc.)
- Each div displays a different character from the sprite sheet

### Adding Background Pattern

Once background pattern is ready, uncomment the background section in `LandingPage.tsx`:

```tsx
{/* Optional: Background pattern/image */}
<div className="absolute inset-0 z-0 opacity-10">
  <Image
    src="/images/branding/background-pattern.png"
    alt=""
    fill
    className="object-cover"
    priority
  />
</div>
```

---

## Questions?

If you need clarification on any specifications, refer to:
- `BRAND_GUIDE.md` - Overall brand guidelines
- `src/components/landing/LandingPage.tsx` - Current implementation
- `src/lib/branding/` - Brand asset management
