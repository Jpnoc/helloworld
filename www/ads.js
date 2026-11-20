// Rewarded ads. Uses the native AdMob plugin inside the Android app; in a desktop browser it shows a
// fake 5-second "test ad" so the whole flow can be tried without a phone.
const Ads = (() => {
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const AdMob = native ? cap.registerPlugin('AdMob') : null;
  let initialized = false, canRequest = true, loading = null, loaded = false;

  async function init() {
    if (!AdMob || initialized) return;
    initialized = true;
    try {
      await AdMob.initialize({ initializeForTesting: CONFIG.USE_TEST_ADS });
      // GDPR / UK consent (Google UMP). Shows Google's consent form only where the law requires it.
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        const after = await AdMob.showConsentForm();
        canRequest = after.canRequestAds !== false;
      } else canRequest = info.canRequestAds !== false;
    } catch (e) { console.warn('AdMob init failed', e); }
    preload();
  }

  function preload() {
    if (!AdMob || !canRequest || loaded || loading) return loading;
    loading = AdMob.prepareRewardVideoAd({ adId: CONFIG.ADMOB_REWARDED_ID, isTesting: CONFIG.USE_TEST_ADS })
      .then(() => { loaded = true; })
      .catch(e => { console.warn('Rewarded ad failed to load', e); })
      .finally(() => { loading = null; });
    return loading;
  }

  function fakeAd() {
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.className = 'fake-ad';
      el.innerHTML = '<div class="fake-ad-box"><small>TEST AD</small><h3>Your ad here</h3><p>Real ads appear in the Android app.</p><div class="fake-ad-count">5</div><button class="btn small ghost">CLOSE (no reward)</button></div>';
      document.body.appendChild(el);
      let n = 5;
      const cnt = el.querySelector('.fake-ad-count');
      const t = setInterval(() => { n--; cnt.textContent = n; if (n <= 0) { clearInterval(t); el.remove(); resolve(true); } }, 1000);
      el.querySelector('button').onclick = () => { clearInterval(t); el.remove(); resolve(false); };
    });
  }

  // Resolves true only if the player watched to the end and earned the reward.
  async function showRewarded() {
    if (!AdMob) return fakeAd();
    if (!canRequest) return false;
    if (!loaded) await preload();
    if (!loaded) return false;
    loaded = false;
    try { await AdMob.showRewardVideoAd(); return true; }
    catch (e) { return false; }
    finally { setTimeout(preload, 1000); }
  }

  async function privacyOptions() {
    if (!AdMob) return false;
    try { await AdMob.showPrivacyOptionsForm(); return true; } catch (e) { return false; }
  }

  return { init, showRewarded, privacyOptions, get native() { return native; }, isReady: () => !AdMob || loaded };
})();
