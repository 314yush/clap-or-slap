# 🧪 Quick Mystery Box Testing Guide

## ✅ Pre-Flight Checklist

Before testing, make sure:

1. **Feature flag enabled** in `.env`:
   ```bash
   FEATURE_MYSTERY_BOX=true
   NEXT_PUBLIC_FEATURE_MYSTERY_BOX=true
   ```

2. **Redis configured** (required for eligibility):
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

3. **Dev server running**:
   ```bash
   npm run dev
   ```

## 🧪 Test 1: Price Fetching (Quick Test)

Test if DexScreener prices are working:

```bash
# In browser or curl
curl http://localhost:3000/api/mystery-box/test-prices

# Or test a specific token
curl http://localhost:3000/api/mystery-box/test-prices?symbol=JESSE
```

**Expected**: JSON with prices for all tokens or specific token

## 🧪 Test 2: Eligibility Check

### Option A: Browser Console
1. Open your app in browser
2. Open DevTools Console (F12)
3. Run:
```javascript
fetch('/api/mystery-box/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    userId: 'your-wallet-address', 
    streak: 5 
  })
})
.then(r => r.json())
.then(console.log)
```

### Option B: Using Test Script
```bash
# Edit test-mystery-box.js and set TEST_USER_ID
node test-mystery-box.js
```

**Expected Response**:
```json
{
  "success": true,
  "eligible": true/false,
  "reason": "..." // if not eligible
}
```

## 🧪 Test 3: Full Flow (In-Game)

### Step-by-Step:

1. **Meet Eligibility Requirements**:
   - Play at least 3 games (engagement check)
   - Your current streak should be **below** your recent average
   - Either: wait 24h OR play 2+ games today

2. **Lose a Game**:
   - Play until you get a wrong answer
   - Loss screen should appear

3. **Check for Mystery Box Button**:
   - Look for "🎁 Open Mystery Box" button
   - Should appear if eligible

4. **Open Mystery Box**:
   - Click the button
   - Mystery box modal opens
   - Scratch the card to reveal rewards

5. **Verify Prices**:
   - Check console logs for: `[MysteryBox] Fetched price for...`
   - Rewards should show real USD values
   - Token amounts should be calculated correctly

6. **Claim Flow** (if treasury is set up):
   - Click "Claim Reward"
   - Sign transaction in wallet
   - Transaction verifies
   - Success message appears

## 🐛 Debugging

### Check Server Logs
Watch your terminal for:
- `[MysteryBox] Fetched price for...` - Price fetching working
- `[MysteryBox] Calculated token amounts with prices:` - Prices used
- Any error messages

### Common Issues

**"Not eligible"**:
- Check eligibility requirements
- Verify you've played 3+ games
- Check if streak is below average
- Verify daily limits (2 boxes/day)

**Price fetching fails**:
- Check network connection
- Verify DexScreener API is accessible
- Check fallback prices are used (see console)

**No mystery box button**:
- Verify feature flag is enabled
- Check browser console for errors
- Verify eligibility check returned true

## 📊 Test Price Fetching Directly

Visit in browser:
```
http://localhost:3000/api/mystery-box/test-prices
```

Should return:
```json
{
  "success": true,
  "prices": {
    "USDC": 1,
    "JESSE": 0.006,
    "AVNT": 0.38,
    "AERO": 0.45,
    "BANKR": 0.00014,
    "ZORA": 0.039
  },
  "timestamp": "2024-...",
  "source": "DexScreener API"
}
```

## 🎯 Quick Test Checklist

- [ ] Feature flag enabled
- [ ] Redis configured
- [ ] Dev server running
- [ ] Price test endpoint works (`/api/mystery-box/test-prices`)
- [ ] Eligibility check works (via console or script)
- [ ] Played 3+ games
- [ ] Lost a game with eligible conditions
- [ ] Mystery box button appears
- [ ] Can scratch and reveal rewards
- [ ] Prices are real (not $1 placeholders)
- [ ] Token amounts calculated correctly

## 🚀 Next Steps After Testing

Once basic testing works:
1. Set up treasury wallet with token balances
2. Test actual airdrop transactions
3. Test daily limits (2 boxes/day)
4. Test pool exhaustion (50 boxes/day)
5. Test share functionality

## 💡 Pro Tips

- Use browser console to check eligibility quickly
- Watch server logs for price fetching details
- Test with different user IDs to test limits
- Check Redis directly to see daily pool count

