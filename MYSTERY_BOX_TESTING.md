# Mystery Box Testing Guide

## Network Selection: Mainnet vs Testnet

The mystery box system supports both Base Mainnet and Base Sepolia Testnet. For initial testing, use **Base Sepolia Testnet** to avoid spending real tokens.

### Switching to Testnet

Add to your `.env` file:
```bash
NEXT_PUBLIC_NETWORK=testnet
```

### Switching to Mainnet

For production, use:
```bash
NEXT_PUBLIC_NETWORK=mainnet
# or simply omit the variable (defaults to mainnet)
```

## Base Sepolia Testnet Setup

### 1. Get Testnet ETH

You'll need testnet ETH to pay for gas fees. Get it from a faucet:
- **QuickNode Faucet**: https://faucet.quicknode.com/base
- Provides up to 0.01 ETH every 4 hours

### 2. Add Base Sepolia to Your Wallet

#### MetaMask:
1. Open MetaMask extension
2. Click network dropdown → "Add network" → "Add a network manually"
3. Enter:
   - **Network Name**: Base Sepolia
   - **RPC URL**: https://sepolia.base.org
   - **Chain ID**: 84532
   - **Currency Symbol**: ETH
   - **Block Explorer**: https://sepolia-explorer.base.org
4. Click "Save"

#### Coinbase Wallet:
1. Open Coinbase Wallet extension
2. Click network icon (upper right)
3. Click "More networks" → "Testnets" tab
4. Select "Base Sepolia"

### 3. Testnet Token Configuration

**Current Setup**: The testnet configuration uses **only USDC** for testing simplicity.

Testnet token configuration (in `src/lib/mystery-box/tokens.ts`):
- **USDC Test**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**⚠️ IMPORTANT**: Verify this USDC address matches your actual USDC token on Base Sepolia:
1. Check your wallet or Base Sepolia explorer to confirm your USDC contract address
2. If different, update the address in `src/lib/mystery-box/tokens.ts` in the `TESTNET_TOKENS` array

**Note**: With only USDC configured, mystery boxes will contain only USDC rewards (full $5 value per box). This is perfect for initial testing!

### 4. Fund Testnet Treasury Wallet

1. Create or use a testnet wallet for the treasury
2. Fund it with testnet ETH (for gas)
3. Fund it with testnet tokens (amounts depend on your testing needs)
4. Update `.env`:
   ```bash
   NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTestnetTreasuryAddress
   ```

**Note**: The treasury wallet must be able to **send** tokens (not just receive). Make sure it's a wallet you control with the private key.

### 5. Testnet Price Fetching

On testnet, the system automatically uses **fallback prices** instead of fetching from DexScreener (testnet tokens won't have real prices). The fallback prices are:
- USDC: $1.00
- JESSE: $0.006
- AVNT: $0.38
- AERO: $0.45
- BANKR: $0.00014
- ZORA: $0.039

## Prerequisites

### 1. Feature Flag Setup
Add to your `.env` file:
```bash
FEATURE_MYSTERY_BOX=true
NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true
```

### 2. Redis Setup (Required)
Mystery boxes use Redis for:
- Daily pool management (50 boxes/day)
- User claim tracking (max 2/day)
- Run history (for eligibility calculation)

Make sure you have:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 3. Treasury Wallet Setup
The treasury wallet needs to:
- Have sufficient token balances for airdrops
- Be able to send tokens (not just receive)

Set in `.env`:
```bash
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTreasuryWalletAddress
```

**Required token balances in treasury:**
- **Mainnet**: USDC: At least $250 (50 boxes × $5 × ~1 USDC per box), plus other tokens
- **Testnet**: Sufficient testnet tokens for testing (amounts depend on your needs)

**Note**: Use different treasury addresses for mainnet vs testnet!

### 4. Token Price Fetching
- **Mainnet**: Fetches real prices from DexScreener API
- **Testnet**: Uses fallback prices automatically (testnet tokens don't have real prices)

## Testing Steps

### Step 1: Enable Feature Flag
```bash
# In .env
FEATURE_MYSTERY_BOX=true
NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true
```

### Step 2: Test Eligibility Check
1. Play at least 3 games (to meet engagement requirement)
2. Make sure your streak is below your recent average
3. Wait 24 hours OR play 2+ games in the same day
4. Lose a game (streak ends)
5. Check if "🎁 Open Mystery Box" button appears on loss screen

### Step 3: Test Mystery Box Flow
1. Click "🎁 Open Mystery Box" button
2. Mystery box modal should appear
3. Scratch the card to reveal rewards
4. Confetti animation should play
5. Click "Claim Reward" button
6. Sign transaction in wallet (sends tokens from treasury to you)
7. Transaction should verify
8. Success message should appear
9. "Share Reward" button should work

### Step 4: Test Daily Limits
1. Claim 2 mystery boxes in one day
2. Try to claim a 3rd - should be blocked with "Daily claim limit reached"
3. Wait until next day (UTC midnight) - pool should reset

### Step 5: Test Pool Exhaustion
1. If 50 boxes are claimed in a day, next user should see "Daily mystery boxes exhausted"
2. Pool resets at midnight UTC

## Eligibility Requirements

A user is eligible if ALL of these are true:
1. ✅ **Engagement**: Played 3+ games total
2. ✅ **Time Away**: 24+ hours since last play OR 2+ games today
3. ✅ **Performance**: Current streak < recent average (last 10 runs)
4. ✅ **Daily Limits**: < 2 claims today AND pool has boxes remaining

## Debugging

### Check Redis Data
You can inspect Redis to see:
- Daily pool: `mystery-box:daily:YYYY-MM-DD`
- User claims: `mystery-box:claims:YYYY-MM-DD:userId`
- Run history: `user:${userId}:runs`

### Common Issues

**"Not eligible" - Check:**
- Have you played 3+ games?
- Is your streak below average?
- Have you claimed 2 boxes today?
- Is the daily pool exhausted?

**JSON Parsing Error:**
- Fixed in latest code - should not occur
- If it does, check network tab for request body

**Transaction Fails:**
- Check treasury wallet has token balances
- Check treasury wallet can send tokens (not just receive)
- Verify token addresses are correct for current network (mainnet vs testnet)
- Check you're on the correct network in your wallet
- Verify treasury wallet has enough ETH for gas fees

**No Mystery Box Button:**
- Check feature flag is enabled
- Check eligibility requirements
- Check browser console for errors
- Verify you're on the correct network (check wallet)

**Wrong Network:**
- Make sure `NEXT_PUBLIC_NETWORK` matches your intended network
- Check wallet is connected to the correct chain (Base Mainnet or Base Sepolia)
- Privy should auto-switch, but you may need to manually switch in wallet

## Token Addresses

### Base Mainnet
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- JESSE: `0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59`
- AVNT: `0x696f9436b67233384889472cd7cd58a6fb5df4f1`
- AERO: `0x940181a94a35a4569e4529a3cdfb74e38fd98631`
- BANKR: `0x22af33fe49fd1fa80c7149773dde5890d3c76f3b`
- ZORA: `0x1111111111166b7fe7bd91427724b487980afc69`

### Base Sepolia Testnet
**Current Configuration**: Only USDC is configured for testnet testing.

- **USDC Test**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**⚠️ Verify Address**: Make sure this matches your actual USDC address on Base Sepolia. If different, update it in `src/lib/mystery-box/tokens.ts`.

**Note**: With only USDC, mystery boxes will contain a single USDC reward worth $5. This simplifies testing and is perfect for initial validation.

## Switching Between Networks

### To Test on Base Sepolia:
1. Set `NEXT_PUBLIC_NETWORK=testnet` in `.env`
2. Restart your dev server
3. Connect wallet to Base Sepolia network
4. Ensure treasury wallet is funded with testnet tokens

### To Use Base Mainnet:
1. Set `NEXT_PUBLIC_NETWORK=mainnet` (or omit the variable)
2. Restart your dev server
3. Connect wallet to Base Mainnet
4. Ensure treasury wallet is funded with mainnet tokens

**Important**: Always verify you're on the correct network before testing to avoid sending real tokens during testing!

## What's Pending for Full Production

1. **Testnet Token Deployment**: 
   - Deploy or obtain testnet ERC20 tokens on Base Sepolia
   - Update testnet token addresses in `src/lib/mystery-box/tokens.ts`
   - Fund testnet treasury wallet

2. **Token Price Fetching**: 
   - ✅ Mainnet: Fetches real prices from DexScreener
   - ✅ Testnet: Uses fallback prices automatically

3. **Treasury Wallet Setup**: 
   - Fund treasury with tokens (separate wallets for mainnet/testnet)
   - Test airdrop transactions
   - Monitor token balances

4. **Transaction Batching**: Currently sends multiple transactions sequentially. Consider:
   - Using a multicall contract
   - Batching transactions for gas efficiency

5. **Error Handling**: Add more robust error handling for:
   - Network failures
   - Insufficient treasury balance
   - Transaction reverts

6. **Analytics**: Track:
   - Mystery box claim rate
   - Token distribution
   - User engagement impact

## Quick Test Script

To quickly test eligibility, you can manually check in browser console:
```javascript
// After losing a game, check eligibility
fetch('/api/mystery-box/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    userId: 'your-user-id', 
    streak: 5 // your current streak
  })
})
.then(r => r.json())
.then(console.log)
```


