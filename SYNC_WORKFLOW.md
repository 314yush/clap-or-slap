# Quick Sync Workflow - Adding Features to Both Platforms

## The Simple Process

When you add a new feature to the **mini-app** and want it on **desktop**:

### Step 1: Check if it's Shared Code

**Ask yourself:** "Is this game logic, UI component, or shared functionality?"

**Check `ARCHITECTURE.md`** → "Shared Code" section:
- ✅ **If listed** → It's shared, sync it!
- ❌ **If NOT listed** → It's platform-specific, skip it

### Step 2: Quick Decision Tree

```
New Feature Added to Mini-App
    │
    ├─ Is it in src/lib/game-core/? → ✅ SYNC
    ├─ Is it in src/lib/data/? → ✅ SYNC
    ├─ Is it in src/lib/leaderboard/? → ✅ SYNC
    ├─ Is it in src/components/game/? → ✅ SYNC
    ├─ Is it in src/hooks/useGame.ts or useGameTimer.ts? → ✅ SYNC
    ├─ Is it in src/app/api/game/ or api/leaderboard/? → ✅ SYNC
    │
    ├─ Is it in src/lib/auth/platforms/farcaster.ts? → ❌ SKIP (platform-specific)
    ├─ Is it in src/hooks/useAuth.ts? → ❌ SKIP (different implementations)
    ├─ Is it in src/components/auth/? → ❌ SKIP (platform-specific)
    └─ Is it Farcaster-specific (casts, FID, etc.)? → ❌ SKIP
```

### Step 3: Sync the Files

**Option A: Manual Copy (Easiest)**
```bash
# 1. Copy file from mini-app to desktop
cp /path/to/mini-app/src/lib/game-core/new-feature.ts \
   /path/to/desktop/src/lib/game-core/new-feature.ts

# 2. Review for any platform-specific code (usually none for shared code)

# 3. Test on desktop
cd /path/to/desktop
npm run dev

# 4. Commit
git add src/lib/game-core/new-feature.ts
git commit -m "Sync: Add new-feature from mini-app"
```

**Option B: Using Git (For multiple files)**
```bash
# In mini-app repo
git log --oneline --since="1 week ago"  # See what changed

# Copy specific files
cp src/lib/game-core/feature.ts /path/to/desktop/src/lib/game-core/
cp src/components/game/Feature.tsx /path/to/desktop/src/components/game/

# In desktop repo
git add src/lib/game-core/feature.ts src/components/game/Feature.tsx
git commit -m "Sync: Add feature from mini-app"
```

### Step 4: Test

- [ ] Run `npm run dev` on desktop
- [ ] Test the new feature works
- [ ] Check for TypeScript errors: `npm run build`
- [ ] Verify no console errors

### Step 5: Done!

That's it! The feature is now on both platforms.

## Common Examples

### ✅ Example 1: New Game Feature
**Mini-app:** Added new difficulty level in `src/lib/game-core/difficulty.ts`
- ✅ **Decision:** It's in `game-core/` → SYNC
- **Action:** Copy `difficulty.ts` to desktop
- **Result:** Works on both platforms

### ✅ Example 2: UI Improvement
**Mini-app:** Updated `TokenCard.tsx` design
- ✅ **Decision:** It's in `components/game/` → SYNC
- **Action:** Copy `TokenCard.tsx` to desktop
- **Result:** Same UI on both platforms

### ✅ Example 3: New API Endpoint
**Mini-app:** Added `/api/leaderboard/prizepool` route
- ✅ **Decision:** It's in `api/leaderboard/` → SYNC
- **Action:** Copy `prizepool/route.ts` to desktop
- **Result:** Same API on both platforms

### ❌ Example 4: Farcaster-Specific Feature
**Mini-app:** Added cast embed sharing
- ❌ **Decision:** Uses Farcaster SDK → SKIP
- **Action:** Implement equivalent for desktop (clipboard/share links)
- **Result:** Different implementations, same UX

### ❌ Example 5: Auth Change
**Mini-app:** Updated Farcaster login flow
- ❌ **Decision:** It's in `platforms/farcaster.ts` → SKIP
- **Action:** Update Privy login in desktop if needed
- **Result:** Platform-specific auth, unified interface

## Key Files Reference

### Always Sync (Shared Code)
- `src/lib/game-core/*` - All game logic
- `src/lib/data/*` - Token data & APIs
- `src/lib/leaderboard/*` - Leaderboard logic
- `src/lib/redis.ts` - Redis operations
- `src/components/game/*` - Game UI components
- `src/hooks/useGame.ts` - Game state
- `src/hooks/useGameTimer.ts` - Timer logic
- `src/app/api/game/*` - Game API routes
- `src/app/api/leaderboard/*` - Leaderboard API routes
- `src/lib/payments/usdc-payment.ts` - Payment logic
- `src/lib/branding/*` - Branding assets
- `src/lib/feature-flags.ts` - Feature flags

### Never Sync (Platform-Specific)
- `src/lib/auth/platforms/farcaster.ts` - Farcaster auth (mini-app only)
- `src/lib/auth/platforms/privy.ts` - Privy auth (desktop only)
- `src/hooks/useAuth.ts` - Different implementations
- `src/components/auth/*` - Different UI per platform
- `src/components/providers/MiniAppProvider.tsx` - Mini-app only
- `src/app/.well-known/farcaster.json/` - Farcaster config (mini-app only)
- `src/lib/notifications/*` - Farcaster notifications (mini-app only)

## Pro Tips

1. **Check ARCHITECTURE.md first** - It's your source of truth
2. **When in doubt** - If it uses `userId` (normalized), it's probably shared
3. **If it uses `fid` or Farcaster SDK** - It's platform-specific
4. **Test both platforms** - Always verify after syncing
5. **Commit with clear message** - `"Sync: <feature> from mini-app"`

## Need Help?

- **What to sync?** → Check `ARCHITECTURE.md` → "Shared Code" section
- **How to sync?** → Follow `SYNC_GUIDE.md` → Step-by-step process
- **Auth issues?** → See `AUTH_ABSTRACTION.md` → How auth works





