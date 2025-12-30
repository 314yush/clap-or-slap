# Quick Testing Guide - Mystery Box on Base Sepolia

## Prerequisites Checklist

Before testing, make sure you have:

- [ ] `.env` file configured with all required variables
- [ ] Testnet ETH in your wallet (for gas fees)
- [ ] Testnet USDC in your treasury wallet
- [ ] Base Sepolia network added to your wallet
- [ ] Dev server running

## Step-by-Step Testing

### 1. Configure Environment Variables

Create or update your `.env` file with:

```bash
# Network - Set to testnet
NEXT_PUBLIC_NETWORK=testnet

# Feature Flags
FEATURE_MYSTERY_BOX=true
NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true

# Redis (Required)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Privy Auth (Required)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret

# Treasury Wallet (Your testnet wallet address with USDC)
NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTestnetWalletAddress

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Verify USDC Address

Check that the USDC address in `src/lib/mystery-box/tokens.ts` matches your testnet USDC:
- Current: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- If different, update it!

### 3. Fund Your Treasury Wallet

Your treasury wallet needs:
- **Testnet ETH**: At least 0.01 ETH (for gas fees)
- **Testnet USDC**: At least 250 USDC (for 50 boxes × $5 each)

Get testnet ETH from: https://faucet.quicknode.com/base

### 4. Start Dev Server

```bash
npm run dev
```

### 5. Add Base Sepolia to Wallet

#### MetaMask:
1. Click network dropdown → "Add network" → "Add a network manually"
2. Enter:
   - Network Name: `Base Sepolia`
   - RPC URL: `https://sepolia.base.org`
   - Chain ID: `84532`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia-explorer.base.org`
3. Click "Save" and switch to Base Sepolia

### 6. Test Methods

#### Method 1: Quick Test Page (Easiest - Bypasses Eligibility)

1. Navigate to: `http://localhost:3000/test-mystery-box`
2. Enter your user ID (wallet address or any string)
3. Click **"Claim Mystery Box (Bypass Enabled)"**
4. This will:
   - Generate a mystery box immediately
   - Show the scratch card UI
   - Allow you to test the claim flow

**Note**: This bypasses all eligibility checks, perfect for quick testing!

#### Method 2: Full Game Flow (Realistic Testing)

1. Navigate to: `http://localhost:3000`
2. Connect your wallet (make sure it's on Base Sepolia)
3. Play at least 3 games
4. Make sure your streak is below your recent average
5. Lose a game
6. Look for the **"🎁 Open Mystery Box"** button on the loss screen
7. Click it to open the mystery box

### 7. Test the Claim Flow

Once you see the mystery box:

1. **Scratch the card** to reveal rewards (should show $5 USDC)
2. **Click "Claim Reward"**
3. **Sign the transaction** in your wallet
   - This sends USDC from your treasury wallet to your connected wallet
   - Make sure you're on Base Sepolia network
4. **Wait for verification** (should take a few seconds)
5. **See success message** when complete

### 8. Verify Transaction

Check the transaction on Base Sepolia explorer:
- Go to: https://sepolia-explorer.base.org
- Paste your transaction hash
- Verify USDC was transferred from treasury to your wallet

## Troubleshooting

### "Not eligible" Error
- **Quick fix**: Use the test page at `/test-mystery-box` (bypasses eligibility)
- **Real fix**: Play 3+ games, ensure streak < average, wait 24h or play 2+ games today

### Transaction Fails
- Check treasury wallet has USDC balance
- Check treasury wallet has ETH for gas
- Verify you're on Base Sepolia network
- Check USDC address is correct in `tokens.ts`

### No Mystery Box Button
- Check feature flag: `NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true`
- Check browser console for errors
- Verify network is set to testnet
- Use test page to bypass eligibility

### Wrong Network
- Make sure `NEXT_PUBLIC_NETWORK=testnet` in `.env`
- Restart dev server after changing `.env`
- Manually switch wallet to Base Sepolia

### Can't Connect Wallet
- Check Privy App ID is set correctly
- Make sure wallet extension is installed
- Try refreshing the page

## Quick Test Commands

### Check Eligibility via API:
```bash
curl -X POST http://localhost:3000/api/mystery-box/check \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id","streak":5}'
```

### Check Daily Pool:
```bash
# Check Redis for daily pool count
# Key: mystery-box:daily:YYYY-MM-DD
```

## Expected Behavior

✅ **Working correctly when:**
- Mystery box appears after losing a game (if eligible)
- Scratch card reveals $5 USDC reward
- Transaction signs successfully
- USDC transfers from treasury to your wallet
- Success message appears
- Transaction shows on Base Sepolia explorer

❌ **Issues to watch for:**
- Transaction reverts (check treasury balance)
- Wrong network errors (verify network setting)
- Eligibility not working (use test page to bypass)
- Price calculation errors (should use $1 for USDC on testnet)

## Next Steps After Testing

1. ✅ Verify USDC transfers work correctly
2. ✅ Test daily limits (claim 2 boxes, try 3rd)
3. ✅ Test pool exhaustion (if possible)
4. ✅ Verify transaction verification works
5. ✅ Check error handling (insufficient balance, etc.)

## Need Help?

- Check browser console for errors
- Check server logs for API errors
- Verify all environment variables are set
- Make sure Redis is connected
- Verify wallet is on correct network

