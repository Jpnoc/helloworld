// Monetization settings. Change these when your real AdMob account is ready.
const CONFIG = {
  // Keep true until the app is approved and live: real ads tapped during testing can get your AdMob account banned.
  USE_TEST_ADS: true,
  // Google's official test ad unit. Replace with your own rewarded ad unit ID from admob.google.com (ca-app-pub-XXXX/YYYY).
  ADMOB_REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',
  // The AdMob *app* ID lives in android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID).

  ECONOMY: {
    startCrystals: 300,
    startBoosters: { hammer: 1, shuffle: 1, defuse: 1 },
    winBase: 20,          // crystals for any win
    winPerStar: 10,       // plus this per star
    firstClearBonus: 30,  // extra the first time a sector is cleared
    adCrystals: 30,       // "watch ad for crystals" on the map
    adCrystalsPerDay: 5,
    dailyBase: 50,        // daily reward: 50, 60, 70 ... capped at day 7
    dailyStep: 10,
    continueCost: 200,    // +5 moves for crystals
    continueMoves: 5,
    prices: { hammer: 120, shuffle: 80, defuse: 150 },
  },
};
