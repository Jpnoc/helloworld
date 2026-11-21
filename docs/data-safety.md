# Play Console answers for Void Shards

Use these when filling in Play Console. They describe the current game: no accounts, no servers, rewarded ads from Google AdMob, and progress stored only on the device.
Google's own guide for the AdMob SDK is the source of truth if anything differs: https://developers.google.com/admob/android/privacy/play-data-disclosure

## Privacy policy URL
`https://jpnoc.github.io/helloworld/privacy-policy.html` (after GitHub Pages is turned on; see the README)

## Ads
**Does your app contain ads?** Yes

## Data safety
**Does your app collect or share any of the required user data types?** Yes (through the Google Mobile Ads SDK)
**Is all of the user data collected by your app encrypted in transit?** Yes
**Do you provide a way for users to request that their data is deleted?** Yes. The game's own data is deleted by clearing app storage or uninstalling, and the policy explains this.

| Data type | Collected | Shared | Processed ephemerally? | Required or optional | Purposes |
|---|---|---|---|---|---|
| Location → Approximate location (from IP address) | Yes | Yes | No | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance |
| App activity → Other actions (ad interactions) | Yes | Yes | No | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance |
| App info and performance → Crash logs, Diagnostics | Yes | Yes | No | Required | Analytics, Fraud prevention, security and compliance |
| Device or other IDs (advertising ID, app set ID) | Yes | Yes | No | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance |

Leave every other data type unticked. The game collects no personal info (name, email), no financial info, contacts, photos, precise location, messages or health data.

## Target audience and content
- **Target age groups:** 13–15, 16–17, 18 and over. Do **not** tick any group under 13: ads in apps for children have much stricter rules.
- **Appeals to children?** No
- **Content rating questionnaire:** Category "Game", no violence against people, no gambling. Note: you can't buy anything with real money that works like a random reward, so it's not a "simulated gambling" game.
- **Advertising ID declaration:** Yes, the app uses an advertising ID, for **Advertising or marketing** and **Analytics**.
