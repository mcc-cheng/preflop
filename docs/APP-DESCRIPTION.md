# 💰 Preflop - Poker Night Settlement Tracker

## What It Does

**Preflop is NOT a poker game.** It's a money tracking and settlement app for when you play poker with friends.

### The Problem It Solves

When playing home poker with physical chips:
- People buy in at different times
- Players rebuy when they lose
- Everyone cashes out different amounts
- At the end: Who owes who money? 🤔

**Without Preflop:**
- Messy paper notes
- Confusing mental math
- Arguments about amounts
- Multiple Venmo transactions

**With Preflop:**
- ✅ Record every buy-in/cashout instantly
- ✅ Auto-calculate who owes who
- ✅ Minimize number of transfers
- ✅ Complete audit trail
- ✅ Track your performance over time

---

## How It Works

### During the Game (Live Tracking)

1. **Host creates session** 
   - Set game name, default buy-in
   - Get shareable 6-digit code

2. **Players join**
   - Enter code on their phone
   - Everyone in the same session

3. **Track all money movements**
   - Player buys in $100 → Record it
   - Player rebuys $50 → Record it  
   - Player cashes out $300 → Record it
   - All transactions logged with timestamps

4. **Live dashboard shows:**
   - Each player's total in/out
   - Current net position (up/down)
   - Running totals
   - Complete transaction log

### After the Game (Settlement)

5. **Host ends session**
   - Auto-calculates final positions
   - Shows who owes who

6. **Settlement algorithm**
   - Minimizes number of transfers
   - Shows exact amounts
   - Example: Instead of 6 transactions, only 2 needed

7. **Players pay up**
   - See payment methods (Venmo, Zelle, etc.)
   - Transfer money via their preferred method
   - Mark as paid

---

## Example Flow

**Game Night with Alice, Bob, Charlie**

### Transactions:
```
Alice buys in:    $100
Bob buys in:      $100  
Charlie buys in:  $100
Alice rebuys:     $50
Bob cashes out:   $250  (big winner! 🎉)
Charlie cashes out: $50 (lost $50)
Alice cashes out: $0    (lost $150)
```

### Final Positions:
```
Bob:     +$150 (owed money)
Alice:   -$150 (owes money)
Charlie: -$50  (owes money)
```

### Settlement (Optimized):
```
❌ BAD: 
- Alice → Bob $150
- Charlie → Bob $50

✅ PREFLOP:
- Alice pays Bob $150
- Charlie pays Bob $50
(Already optimized - only 2 transfers!)
```

---

## Key Features

### 💵 Money Tracking
- Record buy-ins, rebuys, cashouts
- All amounts stored to the penny
- Immutable transaction log (can't be edited/deleted)
- Timestamp every transaction

### 🧮 Smart Settlement
- Auto-calculate net positions
- Greedy algorithm minimizes transfers
- Clear "who pays who" display
- Shows exact amounts

### 👥 Social Features
- Add friends by username
- View friends' statistics
- See who's winning/losing long-term
- Payment methods stored (Venmo, Zelle, etc.)

### 📊 Statistics
- Games played
- Hours at the table
- Total winnings/losses
- Hourly win rate
- Performance over time

### 💳 Payment Methods
- Store Venmo, Apple Pay, Zelle usernames
- Bank transfer info
- Makes settling up faster
- Set default payment method

---

## What Preflop Is NOT

❌ **NOT a poker game** - No cards, no hands, no gameplay
❌ **NOT a poker learning tool** - No strategy, no odds calculator
❌ **NOT real-time gameplay** - Just tracks money, not game state
❌ **NOT automatic payments** - Players still transfer money themselves (MVP)

---

## What Preflop IS

✅ **A ledger** - Records all transactions
✅ **A calculator** - Figures out settlements
✅ **An audit log** - Complete transaction history
✅ **A social tracker** - Friends, stats, performance
✅ **A settlement tool** - Makes end-of-night easier

---

## Use Cases

### Perfect For:
- 🏠 Home poker games with friends
- 💰 Cash games with buy-ins/cashouts
- 👥 Regular poker nights (track long-term)
- 🎰 Casual games where people come/go

### Also Works For:
- Any event with buy-ins/payouts
- Tournament rebuys tracking
- Group activities with shared costs

---

## App Store Description

**Title:** Preflop - Poker Settlement Tracker

**Subtitle:** Track buy-ins, cashouts, and settle up

**Description:**

Stop doing poker night math on napkins! Preflop tracks all buy-ins and cashouts during your home poker game, then automatically calculates who owes who at the end.

**Features:**
• Track buy-ins, rebuys, and cashouts in real-time
• Auto-calculate final settlements
• Minimize number of transfers needed
• Complete transaction history
• Track your performance over time
• Add friends and view their stats
• Store payment methods (Venmo, Zelle, etc.)
• Private rooms with join codes
• Beautiful, easy-to-use interface

**Perfect for home poker games, cash games, and poker nights with friends!**

No actual poker gameplay - just settlement tracking.

---

## Target Audience

**Primary:**
- People who play home poker regularly
- Groups of 4-10 players
- Ages 21-45
- Mix of casual and serious players

**Pain Points:**
- Tracking money during game is messy
- End-of-night settlements are confusing
- Want transparency and audit trail
- Need to know long-term performance

**Competitors:**
- Splitwise (general expense splitting)
- Venmo (just payments, no tracking)
- Paper/Excel (manual, error-prone)

**Why Preflop Wins:**
- Built specifically for poker settlements
- Live tracking during game
- Smart settlement algorithm
- Social features for regular groups

---

## Technical: What Actually Happens

### During Game:
1. Events logged to database (BUY_IN, REBUY, CASH_OUT)
2. Amounts stored as integer cents
3. Real-time polling updates dashboard (2s)
4. All transactions immutable (append-only)

### End of Game:
1. Host ends session → room.endedAt timestamp
2. Calculate net for each player: (cashOut - buyIn)
3. Greedy settlement algorithm:
   - Sort debtors (negative net)
   - Sort creditors (positive net)
   - Match largest with largest
   - Create transfer edges
4. Update player statistics (games, hours, winnings)
5. Display settlement plan

### No Actual Money Movement (MVP):
- MockPaymentsProvider logs actions
- Players transfer money themselves
- Can be upgraded to real payments later (Plaid + Stripe)

---

## Summary

**Preflop = Splitwise for Poker Night**

It's not a poker game. It's a simple, transparent way to track money during poker and settle up fairly at the end. That's it!
