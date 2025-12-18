# Asset Generation Scripts

## Converting SVG to PNG

### Using ImageMagick (if installed)
```bash
# Convert icon
convert -background transparent -resize 512x512 public/images/miniapp/icon-512.svg public/images/miniapp/icon-512.png

# Convert splash
convert -background "#09090b" -resize 1200x1200 public/images/miniapp/splash-1200.svg public/images/miniapp/splash-1200.png

# Convert hero
convert -background "#09090b" -resize 1200x630 public/images/miniapp/hero-1200x630.svg public/images/miniapp/hero-1200x630.png

# Convert characters (example)
for file in public/images/branding/characters/*.svg; do
  name=$(basename "$file" .svg)
  convert -background transparent -resize 600x600 "$file" "public/images/branding/characters/${name}.png"
done
```

### Using Inkscape (if installed)
```bash
# Convert icon
inkscape public/images/miniapp/icon-512.svg --export-png=public/images/miniapp/icon-512.png --export-width=512 --export-height=512

# Convert splash
inkscape public/images/miniapp/splash-1200.svg --export-png=public/images/miniapp/splash-1200.png --export-width=1200 --export-height=1200 --export-background="#09090b"

# Convert hero
inkscape public/images/miniapp/hero-1200x630.svg --export-png=public/images/miniapp/hero-1200x630.png --export-width=1200 --export-height=630 --export-background="#09090b"
```

### Using Online Tools
1. Upload SVG to: https://cloudconvert.com/svg-to-png
2. Set dimensions and background color
3. Download and save to appropriate directory

## Screenshot Generation

### Manual Screenshots
1. Run the app: `npm run dev`
2. Navigate to each screen
3. Take screenshots at 1200x800px resolution
4. Save to `public/images/miniapp/screenshots/`

### Using Puppeteer (automated)
```javascript
// scripts/generate-screenshots.js
const puppeteer = require('puppeteer');

async function generateScreenshots() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  // Landing page
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: 'public/images/miniapp/screenshots/screenshot-1-landing.png' });
  
  // Gameplay (need to navigate to game)
  // ... add more screenshots
  
  await browser.close();
}
```

## Asset Checklist

- [ ] icon-512.png (512x512px)
- [ ] splash-1200.png (1200x1200px)
- [ ] hero-1200x630.png (1200x630px)
- [ ] screenshot-1-landing.png (1200x800px)
- [ ] screenshot-2-gameplay.png (1200x800px)
- [ ] screenshot-3-leaderboard.png (1200x800px)
- [ ] screenshot-4-loss.png (1200x800px)
- [ ] screenshot-5-streak.png (1200x800px)
- [ ] eth-character.png
- [ ] sol-character.png
- [ ] btc-character.png
- [ ] avnt-character.png
- [ ] hyper-character.png
- [ ] aero-character.png
- [ ] morpho-character.png
- [ ] well-character.png

## Notes

- SVG placeholders are provided as starting points
- Replace with final designed assets
- Ensure all assets match brand guidelines
- Optimize all PNG files for web
