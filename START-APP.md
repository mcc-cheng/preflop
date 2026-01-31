# 🚀 START YOUR POKER SETTLEMENT APP

Follow these steps **in order** to get your app running.

---

## ✅ STEP 1: Make Sure Database is Set Up

You should have already done this, but verify:

```bash
cat .env
```

You should see `DATABASE_URL` pointing to your Neon database.

---

## ✅ STEP 2: Start the Backend Server

Open a terminal and run:

```bash
cd /Users/mingchuan/Desktop/preflop
npm run dev
```

**Wait for:** "Ready on http://localhost:3000"

**Keep this terminal running!** (Don't close it)

---

## ✅ STEP 3: Start the Mobile App (In a NEW Terminal)

Open a **second terminal** (don't close the first one!) and run:

```bash
cd /Users/mingchuan/Desktop/preflop/mobile
npx expo start
```

**Wait for:** Metro bundler to start (you'll see "Logs for your project will appear below")

**Keep this terminal running too!**

---

## ✅ STEP 4: Connect Your Phone

### A. Install Expo Go on Your Phone

- **iPhone:** App Store → Search "Expo Go" → Install
- **Android:** Play Store → Search "Expo Go" → Install

### B. Connect to Your App

**MAKE SURE YOUR PHONE AND COMPUTER ARE ON THE SAME WIFI!**

Then:

1. Open Expo Go app on your phone
2. Scroll to the bottom
3. Tap "Enter URL manually"
4. Type: `10.206.43.59:8081`
5. Tap "Connect"

**First load takes 30-60 seconds!** Be patient.

---

## 🎉 DONE!

Your app should now be running on your phone!

---

## ⚠️ Troubleshooting

### "Can't connect" or "Network error"
- Make sure phone and computer are on the **same WiFi**
- Try running: `ipconfig getifaddr en0` to get your computer's IP
- Use that IP instead: `YOUR_IP:8081`

### "Too many open files"
Run this first (one time only):
```bash
cd /Users/mingchuan/Desktop/preflop
./fix-file-limit.sh
```
Then close and reopen your terminal.

---

## 📱 What You Can Do in the App

1. **Register** a new account
2. **Create a session** (poker night)
3. **Share the code** with friends so they can join
4. **Track buy-ins and cash-outs** during the game
5. **End the session** to see settlements
6. **Add friends** and view their stats
7. **Edit your profile** in settings

---

## 🛑 To Stop Everything

Press `Ctrl+C` in both terminal windows.
