# Production Deployment Checklist - Base Testnet with Mystery Box

## ✅ Pre-Deployment Verification

### 1. Network Configuration ⚠️ CRITICAL
**Required Environment Variable:**
```bash
NEXT_PUBLIC_NETWORK=testnet
```

**Verification:**
- ✅ Code defaults to `mainnet` if not set
- ✅ Must explicitly set `NEXT_PUBLIC_NETWORK=testnet` for Base Sepolia
- ✅ Network config will use:
  - Chain ID: `84532` (Base Sepolia)
  - RPC URL: `https://sepolia.base.org`
  - Block Explorer: `https://sepolia-explorer.base.org`

**Code Location:** `src/lib/network-config.ts`

---

### 2. Mystery Box Feature Flags ⚠️ CRITICAL
**Required Environment Variables:**
```bash
FEATURE_MYSTERY_BOX=true              # Server-side (API routes)
NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true   # Client-side (UI components)
```

**Verification:**
- ✅ API routes check `FEATURE_MYSTERY_BOX`:
  - `/api/mystery-box/check`
  - `/api/mystery-box/claim`
  - `/api/mystery-box/airdrop`
  - `/api/mystery-box/pool`
- ✅ Client components check `NEXT_PUBLIC_FEATURE_MYSTERY_BOX`:
  - `LossScreen.tsx` - Shows mystery box button
  - `MysteryBox.tsx` - Renders mystery box UI

**Code Locations:**
- Server: `src/app/api/mystery-box/**/route.ts`
- Client: `src/components/game/LossScreen.tsx`
- Feature flags: `src/lib/feature-flags.ts`

---

### 3. Testnet Token Configuration ✅
**Current Testnet Setup:**
- **USDC Address:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Decimals:** 6
- **Symbol:** USDC
- **Only USDC configured for testnet** (other tokens are mainnet-only)

**Verification:**
- ✅ Token address is in `src/lib/mystery-box/tokens.ts` → `TESTNET_TOKENS` array
- ✅ Code automatically selects testnet tokens when `NEXT_PUBLIC_NETWORK=testnet`
- ✅ Testnet uses fallback prices (testnet tokens don't have real prices)

**Code Location:** `src/lib/mystery-box/tokens.ts` (lines 72-86)

---

### 4. Treasury Wallet Configuration ⚠️ CRITICAL
**Required Environment Variable:**
```bash
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTestnetTreasuryAddress
```

**Requirements:**
- ✅ Must be a **Base Sepolia testnet** wallet address
- ✅ Must be funded with:
  - **Testnet ETH**: For gas fees (at least 0.01 ETH)
  - **Testnet USDC**: For airdrops (amount depends on expected usage)
- ✅ Wallet must be able to **send** tokens (not just receive)

**Verification:**
- ✅ Treasury address is used in airdrop transactions
- ✅ Different addresses should be used for mainnet vs testnet

**Code Location:** `src/lib/mystery-box/airdrop.ts`

---

### 5. Required Infrastructure
**Redis (Upstash):**
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```
- ✅ Required for mystery box storage (daily pool, claims, eligibility)

**Privy Auth:**
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret
```
- ✅ Required for wallet connection

---

### 6. Optional Configuration
**Identity Resolution (Optional):**
```bash
NEYNAR_API_KEY=your-neynar-key          # For Farcaster identity
NEXT_PUBLIC_ALCHEMY_ID=your-alchemy-id  # For ENS resolution
```

**App Configuration:**
```bash
NEXT_PUBLIC_APP_URL=https://your-production-url.com
```

---

## 🔍 Code Verification Checklist

### Network Selection Logic
- [x] `getCurrentNetwork()` defaults to `mainnet` if env var not set
- [x] `getNetworkConfig()` returns Base Sepolia config when `NEXT_PUBLIC_NETWORK=testnet`
- [x] `getMysteryBoxTokens()` returns `TESTNET_TOKENS` when on testnet
- [x] `ClaimFlow.tsx` uses `baseSepolia` chain when `NEXT_PUBLIC_NETWORK=testnet`
- [x] Airdrop route uses `baseSepolia` when on testnet

### Feature Flag Checks
- [x] All API routes check `FEATURE_MYSTERY_BOX` before processing
- [x] Client components check `NEXT_PUBLIC_FEATURE_MYSTERY_BOX` before showing UI
- [x] Feature flags are properly typed in `FeatureFlags` interface

### Testnet-Specific Behavior
- [x] Price fetching uses fallback prices on testnet (no API calls)
- [x] Only USDC token configured for testnet
- [x] Chain ID 84532 (Base Sepolia) used for transactions

---

## 🚨 Critical Warnings

### ⚠️ Network Mismatch Risk
**If `NEXT_PUBLIC_NETWORK` is not set or set to `mainnet`:**
- ❌ Will use Base Mainnet (real tokens, real money!)
- ❌ Will use mainnet token addresses
- ❌ Will attempt to fetch real prices
- ❌ Will use mainnet treasury address

**Solution:** Always verify `NEXT_PUBLIC_NETWORK=testnet` in production environment

### ⚠️ Feature Flag Mismatch
**If only one flag is set:**
- ❌ `FEATURE_MYSTERY_BOX=true` but `NEXT_PUBLIC_FEATURE_MYSTERY_BOX=false` → API works but UI hidden
- ❌ `FEATURE_MYSTERY_BOX=false` but `NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true` → UI shows but API rejects

**Solution:** Always set both flags to `true` together

### ⚠️ Treasury Wallet
**If treasury wallet is not funded:**
- ❌ Airdrop transactions will fail
- ❌ Users will see errors when claiming
- ❌ Mystery boxes will be generated but not claimable

**Solution:** Verify treasury wallet has sufficient testnet tokens before deployment

---

## 📋 Final Pre-Deployment Checklist

Before pushing to production, verify:

- [ ] `NEXT_PUBLIC_NETWORK=testnet` is set in production environment
- [ ] `FEATURE_MYSTERY_BOX=true` is set in production environment
- [ ] `NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true` is set in production environment
- [ ] `NEXT_PUBLIC_TREASURY_ADDRESS` is set to a **testnet** wallet address
- [ ] Treasury wallet is funded with testnet ETH and USDC
- [ ] Testnet USDC address matches: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- [ ] Redis is configured and accessible
- [ ] Privy is configured with correct app ID
- [ ] All other required env vars are set

---

## 🧪 Post-Deployment Testing

After deployment, test:

1. **Network Verification:**
   - [ ] Wallet connects to Base Sepolia (chain ID 84532)
   - [ ] Transactions use Base Sepolia network
   - [ ] Block explorer links point to sepolia-explorer.base.org

2. **Mystery Box Feature:**
   - [ ] Mystery box button appears on loss screen (when eligible)
   - [ ] Eligibility check API works (`/api/mystery-box/check`)
   - [ ] Claim API works (`/api/mystery-box/claim`)
   - [ ] Airdrop transaction executes on Base Sepolia
   - [ ] Tokens are received in user's wallet

3. **Token Configuration:**
   - [ ] Only USDC appears in mystery boxes (testnet limitation)
   - [ ] USDC amounts are correct
   - [ ] Token logo displays correctly

---

## 📝 Environment Variables Summary

**Required for Base Testnet + Mystery Box:**
```bash
# Network (CRITICAL - must be testnet)
NEXT_PUBLIC_NETWORK=testnet

# Mystery Box Feature Flags (CRITICAL - both required)
FEATURE_MYSTERY_BOX=true
NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true

# Treasury Wallet (CRITICAL - must be testnet address)
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTestnetTreasuryAddress

# Redis (Required)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Privy Auth (Required)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-production-url.com
```

---

## ✅ Confirmation

**You are deploying:**
- ✅ Base Sepolia Testnet (not mainnet)
- ✅ Mystery Box feature enabled
- ✅ Testnet token configuration (USDC only)
- ✅ Testnet treasury wallet

**This is SAFE for production testing** - no real tokens will be used.

