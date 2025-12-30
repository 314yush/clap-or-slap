# Mystery Box - What's Left to Build

## ✅ Completed (All Core Features)

All items from the plan are **implemented**:
- ✅ Core logic (eligibility, generation, daily pool)
- ✅ Redis storage (daily pool, claims, run history)
- ✅ Token configuration (all 6 tokens with addresses)
- ✅ Airdrop transaction builder
- ✅ All 3 API endpoints (check, claim, verify)
- ✅ Run history tracking
- ✅ Scratch card component
- ✅ Mystery box UI with confetti
- ✅ Claim flow with transaction signing
- ✅ LossScreen integration
- ✅ Share reward functionality
- ✅ Feature flag system
- ✅ Weighted token randomization

## 🔨 Remaining Work (Production Readiness)

### 1. **Token Price Fetching** (CRITICAL - Currently Using Placeholders)

**Status**: Placeholder prices (all tokens = $1)

**Location**: `src/app/api/mystery-box/claim/route.ts` (lines 75-101)

**What's Needed**:
- Fetch real token prices from CoinGecko API using `coingeckoId` from token config
- Calculate actual token amounts based on USD values
- Handle price fetch failures gracefully

**Implementation**:
```typescript
// Need to create a function like:
async function fetchTokenPrices(tokenSymbols: string[]): Promise<Record<string, number>> {
  // Use CoinGecko API to fetch prices
  // Map symbols to coingeckoId from MYSTERY_BOX_TOKENS
  // Return price map: { 'USDC': 1.0, 'JESSE': 0.05, ... }
}
```

**Files to Modify**:
- `src/app/api/mystery-box/claim/route.ts` - Replace placeholder price logic
- `src/lib/mystery-box/airdrop.ts` - Ensure `calculateTokenAmountsFromUSD` works correctly

### 2. **Treasury Wallet Setup** (REQUIRED for Testing)

**Status**: Configuration exists, but needs:
- Treasury wallet funded with tokens
- Verification that wallet can send tokens (not just receive)
- Token balances sufficient for airdrops

**What's Needed**:
- Fund treasury with:
  - USDC: ~$250+ (50 boxes × $5)
  - JESSE, AERO, AVNT, BANKR, ZORA: Sufficient amounts based on prices
- Test airdrop transaction manually
- Monitor token balances

**No Code Changes Needed** - Just setup/configuration

### 3. **Error Handling & Edge Cases** (RECOMMENDED)

**Status**: Basic error handling exists, but could be improved

**What's Needed**:
- Handle insufficient treasury balance
- Handle transaction reverts
- Better error messages for users
- Retry logic for failed transactions
- Rate limiting protection

**Files to Enhance**:
- `src/components/mystery-box/ClaimFlow.tsx` - Better error handling
- `src/app/api/mystery-box/claim/route.ts` - Validate treasury balance
- `src/app/api/mystery-box/airdrop/route.ts` - Better verification error messages

### 4. **Transaction Batching** (OPTIONAL - Performance)

**Status**: Currently sends multiple transactions sequentially

**What's Needed**:
- Use multicall contract to batch transfers
- Or use a batch transfer contract
- Reduces gas costs and improves UX

**Files to Create/Modify**:
- Create multicall utility or use existing Base multicall contract
- Modify `src/components/mystery-box/ClaimFlow.tsx` to use batched transactions

### 5. **Analytics & Monitoring** (OPTIONAL)

**Status**: Not implemented

**What's Needed**:
- Track mystery box claim rate
- Track token distribution
- Monitor daily pool usage
- Track user engagement impact

**Files to Create**:
- Analytics tracking in claim route
- Dashboard or logging for monitoring

### 6. **Testing & QA** (REQUIRED)

**Status**: Basic testing guide exists, but needs:
- End-to-end testing
- Edge case testing
- Load testing
- Security audit

**What's Needed**:
- Test all eligibility scenarios
- Test daily limits
- Test pool exhaustion
- Test transaction failures
- Test with different user histories

## Priority Order

1. **🔴 HIGH PRIORITY** (Blocking Production):
   - Token price fetching (real prices)
   - Treasury wallet setup & funding

2. **🟡 MEDIUM PRIORITY** (Important for UX):
   - Error handling improvements
   - Transaction batching (gas optimization)

3. **🟢 LOW PRIORITY** (Nice to Have):
   - Analytics & monitoring
   - Advanced testing

## Quick Start: Get It Working

To make mystery boxes functional **right now**:

1. **Enable feature flag**:
   ```bash
   FEATURE_MYSTERY_BOX=true
   NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true
   ```

2. **Implement price fetching** (see #1 above) - ~30 minutes of work

3. **Fund treasury wallet** with tokens

4. **Test the flow** end-to-end

## Code Locations

- **Price Fetching**: `src/app/api/mystery-box/claim/route.ts:75-101`
- **Token Config**: `src/lib/mystery-box/tokens.ts`
- **Airdrop Logic**: `src/lib/mystery-box/airdrop.ts`
- **Claim Flow**: `src/components/mystery-box/ClaimFlow.tsx`

## Summary

**Core implementation**: ✅ 100% Complete
**Production readiness**: ~80% Complete
**Remaining work**: Price fetching + Treasury setup + Testing

The feature is **fully built** but needs **real price data** and **treasury funding** to work in production.

